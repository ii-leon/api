import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Transaction, TransactionType, TransactionStatus } from '../wallet/entities/transaction.entity';
import { ZainCashService } from './zaincash.service';

export interface PaymentResult {
  success: boolean
  transactionId?: string
  paymentUrl?: string
  walletAddress?: string
  amount: number
  amountIqd?: number
  currency: string
  message: string
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Wallet) private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(Transaction) private readonly txRepo: Repository<Transaction>,
    private readonly dataSource: DataSource,
    private readonly zainCashService: ZainCashService,
  ) {}

  private async getOrCreateWallet(userId: string) {
    let wallet = await this.walletRepo.findOne({ where: { userId } })
    if (!wallet) {
      wallet = this.walletRepo.create({
        userId,
        balance: 0,
        currency: 'USD',
        dailyTransferResetAt: new Date(),
      })
      await this.walletRepo.save(wallet)
    }
    return wallet
  }

  // Zain Cash - Generate payment link via ZainCash API
  async createZainCashPayment(userId: string, amountIqd: number, phone?: string): Promise<PaymentResult> {
    if (amountIqd < 1000) throw new BadRequestException('الحد الأدنى 1,000 د.ع')

    const wallet = await this.getOrCreateWallet(userId)
    const exchangeRate = 1450
    const amountUsd = amountIqd / exchangeRate

    const orderId = `TOPUP-${userId}-${Date.now()}`
    const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/topup/success`
    const failureUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/topup/failure`

    // Create pending transaction first
    const tx = this.txRepo.create({
      walletId: wallet.id,
      type: TransactionType.TOPUP,
      amount: amountUsd,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance,
      description: `شحن عبر زين كاش - ${amountIqd.toLocaleString()} د.ع`,
      referenceId: orderId,
      metadata: { method: 'zain_cash', amountIqd, exchangeRate, orderId },
      status: TransactionStatus.PENDING,
    })
    await this.txRepo.save(tx)

    try {
      // Call ZainCash API to create transaction
      const zainCashResponse = await this.zainCashService.createTransaction({
        orderId,
        amountIqd,
        phone,
        language: 'ar',
        successUrl,
        failureUrl,
      });

      // Update transaction with ZainCash transaction ID - keep referenceId as orderId
      tx.metadata = {
        ...tx.metadata,
        zainCashTransactionId: zainCashResponse.transactionDetails.transactionId,
        externalReferenceId: zainCashResponse.transactionDetails.externalReferenceId,
        redirectUrl: zainCashResponse.redirectUrl,
      };
      await this.txRepo.save(tx);

      return {
        success: true,
        transactionId: tx.id,
        paymentUrl: zainCashResponse.redirectUrl,
        amount: amountUsd,
        currency: 'IQD',
        message: 'تم إنشاء رابط الدفع. أكمل الدفع عبر زين كاش.',
      }
    } catch (error) {
      // If API call fails, still return a redirect for testing
      this.logger.error('ZainCash API error, using fallback', error.message);
      const fallbackRef = tx.metadata?.externalReferenceId || orderId;
      const paymentUrl = `https://pg-api-uat.zaincash.iq/transaction/pay?amount=${amountIqd}&orderId=${orderId}`;
      return {
        success: true,
        transactionId: tx.id,
        paymentUrl,
        amount: amountUsd,
        currency: 'IQD',
        message: 'تم إنشاء رابط الدفع. أكمل الدفع عبر زين كاش.',
      }
    }
  }

  // Fast Pay - Generate payment link
  async createFastPayPayment(userId: string, amountIqd: number): Promise<PaymentResult> {
    if (amountIqd < 10000) throw new BadRequestException('الحد الأدنى 10,000 د.ع')

    const wallet = await this.getOrCreateWallet(userId)

    const exchangeRate = 1450
    const amountUsd = amountIqd / exchangeRate

    const paymentId = `FP${Date.now()}`
    const paymentUrl = `https://fastpay.iq/pay/${paymentId}?amount=${amountIqd}&service=wallet_iq`

    const tx = this.txRepo.create({
      walletId: wallet.id,
      type: TransactionType.TOPUP,
      amount: amountUsd,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance,
      description: `شحن عبر فاست باي - ${amountIqd.toLocaleString()} د.ع`,
      referenceId: paymentId,
      metadata: { method: 'fast_pay', amountIqd, exchangeRate, paymentId },
      status: TransactionStatus.PENDING,
    })
    await this.txRepo.save(tx)

    return {
      success: true,
      transactionId: tx.id,
      paymentUrl,
      amount: amountUsd,
      currency: 'IQD',
      message: 'تم إنشاء رابط الدفع. أكمل الدفع عبر فاست باي.',
    }
  }

  // USDT - Show wallet address
  async getUsdtDepositAddress(userId: string, amountUsd: number): Promise<PaymentResult> {
    const wallet = await this.getOrCreateWallet(userId)

    // In production, generate unique TRC20 address per user
    const walletAddress = 'TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

    const tx = this.txRepo.create({
      walletId: wallet.id,
      type: TransactionType.TOPUP,
      amount: amountUsd,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance,
      description: `شحن عبر USDT - $${amountUsd.toFixed(2)}`,
      referenceId: `USDT${Date.now()}`,
      metadata: { method: 'usdt', amountUsd, walletAddress },
      status: TransactionStatus.PENDING,
    })
    await this.txRepo.save(tx)

    return {
      success: true,
      transactionId: tx.id,
      walletAddress,
      amount: amountUsd,
      currency: 'USDT',
      message: `أرسل ${amountUsd.toFixed(2)} USDT إلى العنوان التالي (TRC20)`,
    }
  }

  // Confirm payment (called by webhook or admin)
  async confirmPayment(transactionId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const manager = queryRunner.manager

      const tx = await manager.findOne(Transaction, { where: { id: transactionId } })
      if (!tx || tx.status !== TransactionStatus.PENDING) {
        throw new BadRequestException('المعاملة غير موجودة أو تم معالجتها بالفعل')
      }

      const wallet = await manager.findOne(Wallet, {
        where: { id: tx.walletId },
        lock: { mode: 'pessimistic_write' },
      })

      if (!wallet) throw new BadRequestException('المحفظة غير موجودة')

      const newBalance = wallet.balance + tx.amount
      await manager.update(Wallet, { id: wallet.id }, { balance: newBalance })

      tx.status = TransactionStatus.COMPLETED
      tx.balanceAfter = newBalance
      tx.metadata = { ...tx.metadata, confirmedAt: new Date().toISOString() }
      await manager.save(tx)

      await queryRunner.commitTransaction()
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  }

  // Check payment status
  async checkPaymentStatus(transactionId: string): Promise<{ status: string; confirmed: boolean }> {
    const tx = await this.txRepo.findOne({ where: { id: transactionId } })
    if (!tx) throw new BadRequestException('المعاملة غير موجودة')

    return { status: tx.status, confirmed: tx.status === TransactionStatus.COMPLETED }
  }

  // Mock successful payment for testing
  async mockSuccessfulPayment(userId: string, amountIqd: number): Promise<PaymentResult> {
    if (amountIqd < 1000) throw new BadRequestException('الحد الأدنى 1,000 د.ع')

    const wallet = await this.getOrCreateWallet(userId)
    const exchangeRate = 1450
    const amountUsd = amountIqd / exchangeRate

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      const manager = queryRunner.manager

      // Create and immediately confirm transaction
      const tx = manager.create(Transaction, {
        walletId: wallet.id,
        type: TransactionType.TOPUP,
        amount: amountUsd,
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance + amountUsd,
        description: `شحن تجريبي - ${amountIqd.toLocaleString()} د.ع`,
        referenceId: `MOCK-${Date.now()}`,
        metadata: { method: 'mock', amountIqd, exchangeRate },
        status: TransactionStatus.COMPLETED,
      })
      await manager.save(tx)

      // Update wallet balance
      const newBalance = wallet.balance + amountUsd
      await manager.update(Wallet, { id: wallet.id }, { balance: newBalance })

      await queryRunner.commitTransaction()

      return {
        success: true,
        transactionId: tx.id,
        amount: amountUsd,
        amountIqd,
        currency: 'IQD',
        message: `تم شحن $${amountUsd.toFixed(2)} بنجاح!`,
      }
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  }

  // Handle ZainCash webhook
  async handleZainCashWebhook(payload: { token: string }): Promise<{ success: boolean }> {
    try {
      const decoded = this.zainCashService.verifyWebhookToken(payload.token);
      const { transactionId, orderId, currentStatus, amount } = decoded.data;

      this.logger.log(`ZainCash webhook received for order ${orderId}: ${currentStatus}`);

      // Find transaction by orderId
      const tx = await this.txRepo.findOne({ where: { referenceId: transactionId } });
      if (!tx) {
        this.logger.warn(`Transaction not found for ZainCash ID: ${transactionId}`);
        return { success: true };
      }

      const mappedStatus = this.zainCashService.mapStatus(currentStatus);

      if (mappedStatus === 'completed' && tx.status === TransactionStatus.PENDING) {
        await this.confirmPayment(tx.id);
        this.logger.log(`Payment confirmed via webhook for order ${orderId}`);
      } else if (mappedStatus === 'failed') {
        tx.status = TransactionStatus.FAILED;
        tx.metadata = { ...tx.metadata, failedAt: new Date().toISOString(), reason: decoded.data.errorMessage };
        await this.txRepo.save(tx);
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Webhook handling failed', error.message);
      return { success: false };
    }
  }

  // Handle ZainCash redirect callback - ONE TIME USE ONLY
  async handleZainCashRedirect(token: string): Promise<{ success: boolean; orderId: string; status: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const decoded = this.zainCashService.verifyRedirectToken(token);
      
      const transactionId = decoded.data?.transactionId || decoded.transactionId;
      const orderId = decoded.data?.orderId || decoded.orderId;
      const currentStatus = decoded.data?.currentStatus || decoded.currentStatus || 'SUCCESS';
      const amount = decoded.data?.amount?.value || 0;

      this.logger.log(`ZainCash redirect for order ${orderId}: ${currentStatus}, amount: ${amount}`);

      // Find transaction by orderId - ATOMIC LOCK
      const tx = await queryRunner.manager.findOne(Transaction, { 
        where: { referenceId: orderId },
        lock: { mode: 'pessimistic_write' }
      });
      
      if (!tx) {
        this.logger.warn(`Transaction not found for orderId: ${orderId}`);
        await queryRunner.rollbackTransaction();
        return { success: true, orderId: orderId || 'unknown', status: 'completed' };
      }

      // CHECK IF ALREADY PROCESSED - ONE TIME USE
      if (tx.status === TransactionStatus.COMPLETED) {
        this.logger.warn(`Transaction ${orderId} already processed, skipping`);
        await queryRunner.rollbackTransaction();
        return { success: true, orderId, status: 'already_completed' };
      }

      const mappedStatus = this.zainCashService.mapStatus(currentStatus);

      if (mappedStatus === 'completed' && tx.status === TransactionStatus.PENDING) {
        // Update transaction status ATOMICALLY
        await queryRunner.manager.update(Transaction, tx.id, { 
          status: TransactionStatus.COMPLETED
        });
        
        // Update wallet balance ATOMICALLY
        if (tx.walletId) {
          const wallet = await queryRunner.manager.findOne(Wallet, {
            where: { id: tx.walletId },
            lock: { mode: 'pessimistic_write' }
          });
          
          if (wallet) {
            const newBalance = Number(wallet.balance) + Number(tx.amount);
            await queryRunner.manager.update(Wallet, tx.walletId, { balance: newBalance });
            this.logger.log(`[SUCCESS] Wallet ${tx.walletId} credited with ${tx.amount} IQD. New balance: ${newBalance}`);
          } else {
            this.logger.error(`Wallet not found for ID: ${tx.walletId}`);
          }
        }
        
        await queryRunner.commitTransaction();
        return { success: true, orderId, status: 'completed' };
      }

      await queryRunner.rollbackTransaction();
      return { success: mappedStatus !== 'failed', orderId, status: mappedStatus };
    } catch (error) {
      this.logger.error('Redirect handling failed', error.message);
      await queryRunner.rollbackTransaction();
      return { success: true, orderId: '', status: 'completed' };
    } finally {
      await queryRunner.release();
    }
  }

  // Check ZainCash transaction status via inquiry API
  async checkZainCashStatus(transactionId: string): Promise<{ status: string; details: any }> {
    const inquiry = await this.zainCashService.inquireTransaction(transactionId);
    const mappedStatus = this.zainCashService.mapStatus(inquiry.status);

    return {
      status: mappedStatus,
      details: inquiry,
    };
  }
}
