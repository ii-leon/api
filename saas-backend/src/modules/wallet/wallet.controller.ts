import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WalletService } from './wallet.service';
import { TransferDto } from './dto/transfer.dto';
import { TopUpDto } from './dto/topup.dto';
import { Request } from 'express';

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get wallet balance' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  async getBalance(@CurrentUser('id') userId: string) {
    return this.walletService.getBalance(userId);
  }

  @Post('transfer')
  @UseGuards(ThrottlerGuard)
  @Throttle({ transfer: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transfer credits to another user' })
  @ApiResponse({ status: 200, description: 'Transfer successful' })
  @ApiResponse({ status: 400, description: 'Insufficient balance' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async transfer(
    @CurrentUser('id') userId: string,
    @Body() transferDto: TransferDto,
  ) {
    return this.walletService.transferCredits(
      userId,
      transferDto.recipientUsername,
      transferDto.amount,
    );
  }

  @Post('topup')
  @UseGuards(ThrottlerGuard)
  @Throttle({ topup: { limit: 3, ttl: 3600000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request manual top-up' })
  @ApiResponse({ status: 201, description: 'Top-up request created' })
  async requestTopUp(
    @CurrentUser('id') userId: string,
    @Body() topUpDto: TopUpDto,
  ) {
    return this.walletService.handleManualTopUpRequest(
      userId,
      topUpDto.amountIqd,
      topUpDto.referenceNumber,
    );
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved' })
  async getTransactions(
    @CurrentUser('id') userId: string,
    @Req() req: Request,
  ) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    return this.walletService.getTransactionHistory(userId, page, limit);
  }
}
