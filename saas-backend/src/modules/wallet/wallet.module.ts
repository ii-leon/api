import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from './entities/transaction.entity';
import { User } from '../users/entities/user.entity';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, Transaction, User]),

    // Module-specific throttling for wallet routes
    ThrottlerModule.forRoot([
      {
        name: 'transfer',
        ttl: 60000,
        limit: 5,
      },
      {
        name: 'topup',
        ttl: 3600000,
        limit: 3,
      },
    ]),
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
