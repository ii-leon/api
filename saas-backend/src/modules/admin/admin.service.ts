import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Transaction } from '../wallet/entities/transaction.entity';
import { PayoutRequest, PayoutStatus } from '../payout/entities/payout-request.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Wallet) private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(Transaction) private readonly txRepo: Repository<Transaction>,
    @InjectRepository(PayoutRequest) private readonly payoutRepo: Repository<PayoutRequest>,
  ) {}

  async getStats() {
    const totalUsers = await this.userRepo.count();
    const totalBalance = await this.walletRepo
      .createQueryBuilder('wallet')
      .select('SUM(wallet.balance)', 'total')
      .getRawOne()
      .then((result) => parseFloat(result?.total || '0'));
    const pendingPayouts = await this.payoutRepo.count({ where: { status: PayoutStatus.PENDING } });
    const totalTransactions = await this.txRepo.count();

    return { totalUsers, totalBalance, pendingPayouts, totalTransactions };
  }

  async getAllPayouts() {
    return this.payoutRepo.find({ order: { createdAt: 'DESC' } });
  }

  async updatePayoutStatus(id: string, status: string, adminNotes?: string) {
    const validStatuses = Object.values(PayoutStatus);
    if (!validStatuses.includes(status as PayoutStatus)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const payout = await this.payoutRepo.findOne({ where: { id } });
    if (!payout) throw new BadRequestException('Payout not found');

    payout.status = status as PayoutStatus;
    if (adminNotes) payout.adminNotes = adminNotes;
    payout.processedAt = new Date();

    return this.payoutRepo.save(payout);
  }

  async getAllUsers(page = 1, limit = 20) {
    const [users, total] = await this.userRepo.findAndCount({
      select: ['id', 'email', 'username', 'fullName', 'role', 'isActive', 'createdAt'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { users, total };
  }
}
