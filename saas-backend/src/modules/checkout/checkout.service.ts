import { Injectable, NotFoundException, BadRequestException, GoneException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { CheckoutSession } from './entities/checkout-session.entity';
import { CreateCheckoutDto, ProcessPaymentDto } from './dto/checkout.dto';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Transaction, TransactionType, TransactionStatus } from '../wallet/entities/transaction.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(CheckoutSession)
    private sessionRepo: Repository<CheckoutSession>,
    @InjectRepository(Wallet)
    private walletRepo: Repository<Wallet>,
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
    private walletService: WalletService,
    private dataSource: DataSource,
  ) {}

  // ==================== CREATE SESSION ====================
  async createSession(userId: string, dto: CreateCheckoutDto) {
    const sessionId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    let amount = dto.amount;
    let amountIqd = dto.amountIqd;
    let merchantName = dto.merchantName;
    let description = dto.description;

    if (dto.items && dto.items.length > 0) {
      amountIqd = dto.total || dto.subtotal || dto.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      amount = amountIqd / 1450;
      merchantName = merchantName || 'bpayit IRAQ';
      description = description || dto.items.map(item => item.name).join(', ');
    }

    // Validate amount
    if (!amountIqd || amountIqd <= 0) {
      throw new BadRequestException('المبلغ غير صالح');
    }

    const jwtSecret = this.configService.get<string>('JWT_SECRET') || 'fallback-secret';
    
    const token = this.jwtService.sign({
      sub: sessionId,
      userId,
      merchantName: merchantName || 'bpayit IRAQ',
      amount: amount || 0,
      amountIqd: amountIqd || 0,
    }, { secret: jwtSecret, expiresIn: '30m' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const session = this.sessionRepo.create({
      sessionId,
      userId,
      merchantName: merchantName || 'bpayit IRAQ',
      merchantId: userId,
      amount: amount || 0,
      currency: dto.currency || 'IQD',
      amountIqd: amountIqd || 0,
      description,
      orderId: dto.orderId,
      items: dto.items,
      customer: dto.customer,
      callbackUrl: dto.callbackUrl,
      tokenHash,
      expiresAt,
    });

    await this.sessionRepo.save(session);

    return { sessionId, token, expiresAt };
  }

  // ==================== GET SESSION ====================
  async getSession(sessionId: string) {
    const session = await this.sessionRepo.findOne({ where: { sessionId } });
    
    if (!session) {
      throw new NotFoundException('جلسة الدفع غير موجودة');
    }

    if (new Date() > session.expiresAt) {
      await this.sessionRepo.update(session.id, { status: 'expired' });
      throw new GoneException('انتهت صلاحية جلسة الدفع');
    }

    return session;
  }

  // ==================== PROCESS PAYMENT ====================
  async processPayment(dto: ProcessPaymentDto) {
    const session = await this.sessionRepo.findOne({ where: { sessionId: dto.sessionId } });
    
    if (!session) {
      throw new NotFoundException('جلسة الدفع غير موجودة');
    }

    // Verify token
    const jwtSecret = this.configService.get<string>('JWT_SECRET') || 'fallback-secret';
    
    try {
      const payload = this.jwtService.verify(dto.token, { secret: jwtSecret });
      if (payload.sub !== session.sessionId) {
        throw new UnauthorizedException('توكن غير صالح');
      }
    } catch (error) {
      throw new UnauthorizedException('توكن غير صالح أو منتهي الصلاحية');
    }

    // Check expiry
    if (new Date() > session.expiresAt) {
      await this.sessionRepo.update(session.id, { status: 'expired' });
      throw new GoneException('انتهت صلاحية جلسة الدفع');
    }

    // Check if already processed
    if (session.status === 'completed') {
      throw new BadRequestException('تم معالجة هذه الجلسة مسبقاً');
    }

    // Validate amount
    const amount = Number(session.amount);
    if (!amount || amount <= 0 || !isFinite(amount)) {
      throw new BadRequestException('مبلغ غير صالح');
    }

    if (amount > 10000000) {
      throw new BadRequestException('المبلغ يتجاوز الحد الأقصى');
    }

    // Prevent merchant from paying their own link
    if (dto.method === 'wallet') {
      const buyer = await this.userRepo.findOne({ where: { email: dto.wallet?.email } });
      if (buyer && buyer.id === session.userId) {
        throw new BadRequestException('لا يمكنك الدفع بمحفظتك الخاصة');
      }
    }

    // Atomic status update
    const updated = await this.sessionRepo
      .createQueryBuilder()
      .update(CheckoutSession)
      .set({ status: 'processing' })
      .where('id = :id AND status = :status', { id: session.id, status: 'pending' })
      .execute();

    if (updated.affected === 0) {
      throw new BadRequestException('تم معالجة هذه الجلسة مسبقاً');
    }

    try {
      let paymentId: string;

      if (dto.method === 'card') {
        paymentId = await this.processCardPayment(session, dto.card);
      } else if (dto.method === 'wallet') {
        paymentId = await this.processWalletPayment(dto.wallet?.email || '', amount, dto.wallet?.password);
      } else if (dto.method === 'zaincash') {
        paymentId = await this.processZainCashPayment(session, dto.zaincash?.phone);
      } else {
        throw new BadRequestException('طريقة دفع غير صالحة');
      }

      // Credit merchant
      await this.creditMerchantWallet(session.userId, amount, paymentId);

      // Update session
      await this.sessionRepo.update(session.id, {
        status: 'completed',
        paymentId,
        paidAt: new Date(),
      });

      // Send callback
      if (session.callbackUrl) {
        await this.sendCallback(session.callbackUrl, {
          sessionId: session.sessionId,
          status: 'completed',
          paymentId,
          amount: session.amount,
          amountIqd: session.amountIqd,
        });
      }

      return { success: true, paymentId, sessionId: session.sessionId };
    } catch (error) {
      await this.sessionRepo.update(session.id, { status: 'failed' });
      throw error;
    }
  }

  // ==================== CARD PAYMENT ====================
  private async processCardPayment(session: CheckoutSession, cardData?: any): Promise<string> {
    const paymentId = `CARD-${uuidv4().substring(0, 8).toUpperCase()}`;
    
    // Validate card number (Luhn algorithm)
    if (!cardData?.number) {
      throw new BadRequestException('رقم البطاقة مطلوب');
    }
    
    const cardNumber = cardData.number.replace(/\s/g, '');
    if (cardNumber.length < 16 || !this.luhnCheck(cardNumber)) {
      throw new BadRequestException('رقم البطاقة غير صالح');
    }

    // Validate expiry
    if (!cardData.expiry || !/^\d{2}\/\d{2}$/.test(cardData.expiry)) {
      throw new BadRequestException('تاريخ انتهاء البطاقة غير صالح');
    }

    // Validate CVV
    if (!cardData.cvv || cardData.cvv.length < 3) {
      throw new BadRequestException('رمز CVV غير صالح');
    }

    // Validate name
    if (!cardData.name || cardData.name.trim().length < 2) {
      throw new BadRequestException('اسم حامل البطاقة مطلوب');
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return paymentId;
  }

  // Luhn algorithm for card validation
  private luhnCheck(num: string): boolean {
    let arr = (num + '').split('').reverse().map(x => parseInt(x));
    let sum = arr.reduce((acc, val, i) => {
      if (i % 2 !== 0) {
        val *= 2;
        if (val > 9) val -= 9;
      }
      return acc + val;
    }, 0);
    return sum % 10 === 0;
  }

  // ==================== WALLET PAYMENT ====================
  private async processWalletPayment(buyerEmail: string, amount: number, password?: string): Promise<string> {
    if (!amount || amount <= 0 || !isFinite(amount)) {
      throw new BadRequestException('مبلغ غير صالح');
    }

    if (amount > 10000000) {
      throw new BadRequestException('المبلغ يتجاوز الحد الأقصى');
    }

    if (!password) {
      throw new BadRequestException('كلمة المرور مطلوبة');
    }

    if (!buyerEmail) {
      throw new BadRequestException('البريد الإلكتروني مطلوب');
    }

    // Find buyer
    const buyer = await this.userRepo.findOne({ where: { email: buyerEmail } });
    if (!buyer) {
      throw new NotFoundException('المشتري غير موجود');
    }

    // Verify password
    const argon2 = await import('argon2');
    const isPasswordValid = await argon2.verify(buyer.passwordHash, password);
    if (!isPasswordValid) {
      throw new BadRequestException('كلمة المرور غير صحيحة');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;

      const wallet = await manager.findOne(Wallet, {
        where: { userId: buyer.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new NotFoundException('المحفظة غير موجودة');
      }

      if (wallet.isFrozen) {
        throw new ConflictException('المحفظة مجمدة');
      }

      if (Number(wallet.balance) < amount) {
        throw new BadRequestException('الرصيد غير كافٍ');
      }

      const newBalance = Number(wallet.balance) - amount;
      await manager.update(Wallet, { id: wallet.id }, { balance: newBalance });

      const paymentId = `WALLET-${uuidv4().substring(0, 8).toUpperCase()}`;
      const transaction = manager.create(Transaction, {
        walletId: wallet.id,
        type: TransactionType.WITHDRAWAL,
        amount,
        balanceBefore: Number(wallet.balance),
        balanceAfter: newBalance,
        description: `دفع عبر المحفظة - ${paymentId}`,
        referenceId: paymentId,
        metadata: { paymentId, method: 'wallet_checkout', buyerEmail },
        status: TransactionStatus.COMPLETED,
      });
      await manager.save(Transaction, transaction);

      await queryRunner.commitTransaction();
      return paymentId;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ==================== ZAINCASH PAYMENT ====================
  private async processZainCashPayment(session: CheckoutSession, phone?: string): Promise<string> {
    if (!phone) {
      throw new BadRequestException('رقم الهاتف مطلوب لزين كاش');
    }

    // Validate Iraqi phone number
    const cleanPhone = phone.replace(/\s/g, '');
    if (!/^78\d{8}$/.test(cleanPhone)) {
      throw new BadRequestException('رقم الهاتف غير صالح (يجب أن يبدأ بـ 78)');
    }

    const paymentId = `ZAIN-${uuidv4().substring(0, 8).toUpperCase()}`;
    
    // Simulate ZainCash API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    return paymentId;
  }

  // ==================== CREDIT MERCHANT ====================
  private async creditMerchantWallet(merchantUserId: string, amount: number, paymentId: string): Promise<void> {
    if (!amount || amount <= 0 || !isFinite(amount)) {
      throw new BadRequestException('مبلغ غير صالح');
    }

    // Check duplicate
    const existing = await this.transactionRepo.findOne({ where: { referenceId: paymentId } });
    if (existing) {
      return;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;

      const wallet = await manager.findOne(Wallet, {
        where: { userId: merchantUserId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new NotFoundException('محفظة التاجر غير موجودة');
      }

      const newBalance = Number(wallet.balance) + Number(amount);
      await manager.update(Wallet, { id: wallet.id }, { balance: newBalance });

      const transaction = manager.create(Transaction, {
        walletId: wallet.id,
        type: TransactionType.P2P_CREDIT,
        amount: Number(amount),
        balanceBefore: Number(wallet.balance),
        balanceAfter: newBalance,
        description: `استلام دفعة من عميل - ${paymentId}`,
        referenceId: paymentId,
        metadata: { paymentId, method: 'checkout_credit' },
        status: TransactionStatus.COMPLETED,
      });
      await manager.save(Transaction, transaction);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error crediting merchant:', error);
    } finally {
      await queryRunner.release();
    }
  }

  // ==================== CALLBACK ====================
  private async sendCallback(url: string, data: any) {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Failed to send callback:', error);
    }
  }

  // ==================== GET ORDERS ====================
  async getUserOrders(userId: string, page = 1, limit = 20) {
    const [sessions, total] = await this.sessionRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { orders: sessions, total, page, limit };
  }

  // ==================== RESET ALL BALANCES ====================
  async resetAllBalances() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;
      
      // Reset all wallet fields to default values
      await manager.update(Wallet, {}, { 
        balance: 0,
        dailyTransferUsed: 0,
        dailyTransferLimit: 10000,
      });
      
      // Delete all transactions
      await manager.delete(Transaction, {});
      
      // Delete all checkout sessions
      await manager.delete(CheckoutSession, {});

      await queryRunner.commitTransaction();
      
      return { success: true, message: 'تم إعادة تعيين جميع الأرصدة والمعاملات' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
