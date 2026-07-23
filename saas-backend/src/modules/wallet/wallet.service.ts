import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from './entities/transaction.entity';
import { User } from '../users/entities/user.entity';
import { TransferDto } from './dto/transfer.dto';
import { TopUpDto } from './dto/topup.dto';
import { DeductionDto } from './dto/deduction.dto';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly dataSource: DataSource,
  ) {}

  // =====================================================
  // 1. TRANSFER CREDITS (Atomic with FOR UPDATE Lock)
  // =====================================================
  //
  // SECURITY FIX: Deadlock Prevention
  // The lock order is ALWAYS deterministic - sorted by wallet ID ascending.
  // This prevents circular wait conditions when User A -> B and User B -> A
  // happen concurrently. Both transactions will lock wallets in the same order.
  // =====================================================
  async transferCredits(
    senderId: string,
    recipientUsername: string,
    amount: number,
  ): Promise<{ senderBalance: number; recipientBalance: number; transactionId: string }> {
    // Input validation
    if (!amount || amount <= 0 || !isFinite(amount)) {
      throw new BadRequestException('المبلغ غير صالح');
    }

    if (amount > 10000) {
      throw new BadRequestException('المبلغ يتجاوز الحد الأقصى');
    }

    if (!recipientUsername) {
      throw new BadRequestException('اسم المستخدم مطلوب');
    }

    // Execute in atomic transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;

      // 1. Fetch BOTH wallets WITHOUT locks first (to get their IDs)
      const senderWallet = await manager.findOne(Wallet, {
        where: { userId: senderId },
      });

      if (!senderWallet) {
        throw new NotFoundException('Sender wallet not found');
      }

      if (senderWallet.isFrozen) {
        throw new ConflictException('Sender wallet is frozen');
      }

      // Find recipient by username (without lock yet)
      let recipientWallet = await manager
        .createQueryBuilder(Wallet, 'w')
        .innerJoin('w.user', 'u')
        .where('u.username = :username', { username: recipientUsername })
        .getOne();

      // Auto-create wallet for recipient if missing
      if (!recipientWallet) {
        const recipientUser = await manager.findOne(User, {
          where: { username: recipientUsername },
        });
        if (!recipientUser) {
          throw new NotFoundException('Recipient not found');
        }
        recipientWallet = manager.create(Wallet, {
          userId: recipientUser.id,
          balance: 0,
          currency: 'USD',
          dailyTransferResetAt: new Date(),
        });
        await manager.save(recipientWallet);
      }

      if (recipientWallet.userId === senderId) {
        throw new BadRequestException('Cannot transfer to yourself');
      }

      // =====================================================
      // DEADLOCK PREVENTION: Sort wallet IDs to ensure deterministic lock order
      // =====================================================
      const [firstWallet, secondWallet] = [senderWallet, recipientWallet].sort(
        (a, b) => a.id.localeCompare(b.id),
      );

      // 2. Lock wallets in sorted order with FOR UPDATE
      const lockedFirst = await manager.findOne(Wallet, {
        where: { id: firstWallet.id },
        lock: { mode: 'pessimistic_write' },
      });

      const lockedSecond = await manager.findOne(Wallet, {
        where: { id: secondWallet.id },
        lock: { mode: 'pessimistic_write' },
      });

      // Re-map to sender/recipient after locking
      const lockedSenderWallet = lockedFirst!.id === senderWallet.id ? lockedFirst : lockedSecond;
      const lockedRecipientWallet = lockedFirst!.id === senderWallet.id ? lockedSecond : lockedFirst;

      // 3. Verify sender is not frozen (re-check after lock)
      if (lockedSenderWallet!.isFrozen) {
        throw new ConflictException('Sender wallet is frozen');
      }

      // Check daily transfer limit
      await this.checkDailyTransferLimit(manager, lockedSenderWallet!);

      // Check sufficient balance
      if (Number(lockedSenderWallet!.balance) < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      // 4. Calculate new balances
      const senderNewBalance = Number(lockedSenderWallet!.balance) - amount;
      const recipientNewBalance = Number(lockedRecipientWallet!.balance) + amount;

      // 5. Update sender balance (atomic update)
      await manager.update(
        Wallet,
        { id: lockedSenderWallet!.id },
        {
          balance: senderNewBalance,
          dailyTransferUsed: (Number(lockedSenderWallet!.dailyTransferUsed) || 0) + amount,
        },
      );

      // 6. Update recipient balance (atomic update)
      await manager.update(
        Wallet,
        { id: lockedRecipientWallet!.id },
        { balance: recipientNewBalance },
      );

      // 7. Create transaction records (Dual-entry logging)
      const senderTransaction = manager.create(Transaction, {
        walletId: lockedSenderWallet!.id,
        type: TransactionType.P2P_DEBIT,
        amount,
        balanceBefore: Number(lockedSenderWallet!.balance),
        balanceAfter: senderNewBalance,
        description: `Transfer to ${recipientUsername}`,
        relatedUserId: lockedRecipientWallet!.userId,
        metadata: { recipientUsername },
        status: TransactionStatus.COMPLETED,
      });
      await manager.save(Transaction, senderTransaction);

      const recipientTransaction = manager.create(Transaction, {
        walletId: lockedRecipientWallet!.id,
        type: TransactionType.P2P_CREDIT,
        amount,
        balanceBefore: Number(lockedRecipientWallet!.balance),
        balanceAfter: recipientNewBalance,
        description: `Transfer from sender`,
        relatedUserId: senderId,
        metadata: { senderId },
        status: TransactionStatus.COMPLETED,
      });
      await manager.save(Transaction, recipientTransaction);

      // Commit transaction
      await queryRunner.commitTransaction();

      return {
        senderBalance: senderNewBalance,
        recipientBalance: recipientNewBalance,
        transactionId: senderTransaction.id,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // =====================================================
  // 2. DEDUCT FOR AI USAGE (Hold/Reserve Pattern)
  // =====================================================
  async deductForAiUsage(
    userId: string,
    creditCost: number,
    aiRequestData: {
      modelName: string;
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      requestPayload?: any;
    },
  ): Promise<{ transactionId: string; remainingBalance: number; success: boolean }> {
    if (creditCost <= 0) {
      throw new BadRequestException('Credit cost must be positive');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;

      // 1. Lock wallet
      const wallet = await manager.findOne(Wallet, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      if (wallet.isFrozen) {
        throw new ConflictException('Wallet is frozen');
      }

      // 2. Check sufficient balance
      if (wallet.balance < creditCost) {
        throw new BadRequestException('Insufficient balance for AI request');
      }

      // 3. HOLD: Deduct credits but mark transaction as PENDING
      const newBalance = wallet.balance - creditCost;
      await manager.update(Wallet, { id: wallet.id }, { balance: newBalance });

      const transaction = manager.create(Transaction, {
        walletId: wallet.id,
        type: TransactionType.AI_DEDUCTION,
        amount: creditCost,
        balanceBefore: wallet.balance,
        balanceAfter: newBalance,
        description: `AI usage: ${aiRequestData.modelName} (HOLD)`,
        metadata: {
          modelName: aiRequestData.modelName,
          promptTokens: aiRequestData.promptTokens,
          completionTokens: aiRequestData.completionTokens,
          totalTokens: aiRequestData.totalTokens,
          holdTimestamp: new Date().toISOString(),
        },
        status: TransactionStatus.PENDING,
      });
      const savedTransaction = await manager.save(Transaction, transaction);

      // Create AI usage log with pending status
      await manager
        .createQueryBuilder()
        .insert()
        .into('ai_usage_logs')
        .values({
          userId,
          walletId: wallet.id,
          transactionId: savedTransaction.id,
          modelName: aiRequestData.modelName,
          promptTokens: aiRequestData.promptTokens,
          completionTokens: aiRequestData.completionTokens,
          totalTokens: aiRequestData.totalTokens,
          creditsCost: creditCost,
          requestPayload: aiRequestData.requestPayload || null,
          status: 'pending',
        })
        .execute();

      await queryRunner.commitTransaction();

      return {
        transactionId: savedTransaction.id,
        remainingBalance: newBalance,
        success: true,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // =====================================================
  // 2b. CONFIRM AI USAGE (After successful MiMo API call)
  // =====================================================
  async confirmAiUsage(
    transactionId: string,
    responsePayload?: any,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;

      const transaction = await manager.findOne(Transaction, {
        where: { id: transactionId },
      });

      if (transaction) {
        transaction.status = TransactionStatus.COMPLETED;
        transaction.description = transaction?.description?.replace(' (HOLD)', '') || 'AI usage';
        transaction.metadata = {
          ...transaction.metadata,
          confirmedAt: new Date().toISOString(),
          responsePayload,
        };
        await manager.save(transaction);
      }

      await manager
        .createQueryBuilder()
        .update('ai_usage_logs')
        .set({ status: 'success', responsePayload })
        .where('transaction_id = :transactionId', { transactionId })
        .execute();

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // =====================================================
  // 2c. REJECT AI USAGE (After failed MiMo API call)
  // =====================================================
  async rejectAiUsage(
    transactionId: string,
    errorMessage: string,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;

      const transaction = await manager.findOne(Transaction, {
        where: { id: transactionId, status: TransactionStatus.PENDING },
      });

      if (!transaction) {
        throw new NotFoundException('Pending transaction not found');
      }

      const wallet = await manager.findOne(Wallet, {
        where: { id: transaction.walletId },
        lock: { mode: 'pessimistic_write' },
      });

      if (wallet) {
        const refundBalance = wallet.balance + transaction.amount;
        await manager.update(Wallet, { id: wallet.id }, { balance: refundBalance });

        transaction.status = TransactionStatus.FAILED;
        transaction.metadata = {
          ...transaction.metadata,
          rejectedAt: new Date().toISOString(),
          errorMessage,
        };
        await manager.save(transaction);

        await manager
          .createQueryBuilder()
          .update('ai_usage_logs')
          .set({ status: 'failed', errorMessage })
          .where('transaction_id = :transactionId', { transactionId })
          .execute();
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // =====================================================
  // 3. HANDLE MANUAL TOP-UP REQUEST
  // =====================================================
  async handleManualTopUpRequest(
    userId: string,
    amountIqd: number,
    referenceNumber: string,
  ): Promise<{ requestId: string; status: string }> {
    if (amountIqd <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    if (amountIqd < 10000) {
      throw new BadRequestException('Minimum top-up is 10,000 IQD');
    }

    if (!referenceNumber || referenceNumber.trim().length < 5) {
      throw new BadRequestException('Invalid reference number');
    }

    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const exchangeRate = 1450;
    const amountUsd = amountIqd / exchangeRate;

    const result = await this.dataSource.query(
      `INSERT INTO payout_requests
        (user_id, wallet_id, amount, amount_iqd, exchange_rate,
         payment_method, payment_details, reference_number, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       RETURNING id`,
      [
        userId,
        wallet.id,
        amountUsd,
        amountIqd,
        exchangeRate,
        'bank_transfer',
        JSON.stringify({ referenceNumber }),
        referenceNumber,
      ],
    );

    await this.logAudit(userId, 'topup_request_created', 'payout_requests', result[0].id, null, {
      amountIqd,
      amountUsd,
      referenceNumber,
    });

    return {
      requestId: result[0].id,
      status: 'pending',
    };
  }

  // =====================================================
  // HELPERS
  // =====================================================
  private async checkDailyTransferLimit(
    manager: EntityManager,
    wallet: Wallet,
  ): Promise<void> {
    const now = new Date();
    const resetAt = new Date(wallet.dailyTransferResetAt);

    if (now > resetAt) {
      await manager.update(Wallet, wallet.id, {
        dailyTransferUsed: 0,
        dailyTransferResetAt: this.getNextResetTime(),
      });
      wallet.dailyTransferUsed = 0;
    }

    const remaining = wallet.dailyTransferLimit - wallet.dailyTransferUsed;

    if (remaining <= 0) {
      throw new ConflictException(
        'Daily transfer limit exceeded. Try again tomorrow.',
      );
    }
  }

  private getNextResetTime(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  private async logAudit(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    oldValues: any,
    newValues: any,
  ): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO audit_logs
        (user_id, action, entity_type, entity_id, old_values, new_values)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, action, entityType, entityId,
       oldValues ? JSON.stringify(oldValues) : null,
       newValues ? JSON.stringify(newValues) : null],
    );
  }

  async getBalance(userId: string): Promise<{ balance: number; currency: string }> {
    let wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!wallet) {
      // Auto-create wallet if missing
      wallet = this.walletRepository.create({
        userId,
        balance: 0,
        currency: 'USD',
        dailyTransferResetAt: new Date(),
      });
      await this.walletRepository.save(wallet);
    }

    return {
      balance: wallet.balance,
      currency: wallet.currency,
    };
  }

  async getTransactionHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ transactions: Transaction[]; total: number }> {
    let wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!wallet) {
      wallet = this.walletRepository.create({
        userId,
        balance: 0,
        currency: 'USD',
        dailyTransferResetAt: new Date(),
      });
      await this.walletRepository.save(wallet);
    }

    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { transactions, total };
  }
}
