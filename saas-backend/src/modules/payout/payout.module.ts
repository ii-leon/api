import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayoutRequest } from './entities/payout-request.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { PayoutService } from './payout.service';
import { PayoutController } from './payout.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PayoutRequest, Wallet])],
  controllers: [PayoutController],
  providers: [PayoutService],
  exports: [PayoutService],
})
export class PayoutModule {}
