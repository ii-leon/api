import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PayoutRequest, PayoutStatus, PaymentMethod } from './entities/payout-request.entity';
import { Wallet } from '../wallet/entities/wallet.entity';

@Injectable()
export class PayoutService {
  constructor(
    @InjectRepository(PayoutRequest)
    private readonly payoutRepository: Repository<PayoutRequest>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    private readonly dataSource: DataSource,
  ) {}

  async createRequest(
    userId: string,
    amount: number,
    paymentMethod: string,
    paymentDetails: Record<string, string>,
  ): Promise<PayoutRequest> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const wallet = await this.walletRepository.findOne({ where: { userId } });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const exchangeRate = 1450;
    const amountIqd = amount * exchangeRate;

    const payout = this.payoutRepository.create({
      userId,
      walletId: wallet.id,
      amount,
      amountIqd,
      exchangeRate,
      paymentMethod: paymentMethod as PaymentMethod,
      paymentDetails,
      status: PayoutStatus.PENDING,
    });

    return this.payoutRepository.save(payout);
  }

  async getMyRequests(userId: string): Promise<PayoutRequest[]> {
    return this.payoutRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
