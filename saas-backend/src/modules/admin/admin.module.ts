import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Transaction } from '../wallet/entities/transaction.entity';
import { PayoutRequest } from '../payout/entities/payout-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Wallet, Transaction, PayoutRequest])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
