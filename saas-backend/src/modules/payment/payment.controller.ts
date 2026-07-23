import { Controller, Post, Get, Body, Param, Query, UseGuards, HttpCode, HttpStatus, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaymentService } from './payment.service';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
  ) {}

  private checkDevelopmentMode() {
    if (process.env.APP_ENV === 'production') {
      throw new ForbiddenException('This endpoint is disabled in production');
    }
  }

  // Protected endpoints (require auth)
  @Post('fast-pay')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create Fast Pay payment' })
  async createFastPay(
    @CurrentUser('id') userId: string,
    @Body() body: { amountIqd: number },
  ) {
    return this.paymentService.createFastPayPayment(userId, body.amountIqd);
  }

  // ZainCash payment
  @Post('zaincash')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create ZainCash payment' })
  async createZainCash(
    @CurrentUser('id') userId: string,
    @Body() body: { amountIqd: number; phone?: string },
  ) {
    return this.paymentService.createZainCashPayment(userId, body.amountIqd, body.phone);
  }

  // ZainCash webhook (no auth - called by ZainCash)
  @Post('zaincash/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ZainCash webhook callback' })
  async zaincashWebhook(@Body() body: { token: string }) {
    return this.paymentService.handleZainCashWebhook(body);
  }

  // ZainCash redirect callback (no auth - redirected from ZainCash)
  @Get('zaincash/redirect')
  @ApiOperation({ summary: 'ZainCash redirect callback' })
  async zaincashRedirect(@Query('token') token: string) {
    return this.paymentService.handleZainCashRedirect(token);
  }

  // ZainCash inquiry
  @Get('zaincash/inquiry/:transactionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check ZainCash transaction status' })
  async zaincashInquiry(@Param('transactionId') transactionId: string) {
    return this.paymentService.checkZainCashStatus(transactionId);
  }

  // Mock payment for testing - ONLY available in development mode
  @Post('mock-success')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mock successful payment (development only)' })
  async mockSuccess(
    @CurrentUser('id') userId: string,
    @Body() body: { amountIqd: number },
  ) {
    this.checkDevelopmentMode();
    return this.paymentService.mockSuccessfulPayment(userId, body.amountIqd);
  }

  @Post('usdt')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get USDT deposit address' })
  async getUsdtAddress(
    @CurrentUser('id') userId: string,
    @Body() body: { amountUsd: number },
  ) {
    return this.paymentService.getUsdtDepositAddress(userId, body.amountUsd);
  }

  @Get('status/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check payment status' })
  async checkStatus(@Param('id') id: string) {
    return this.paymentService.checkPaymentStatus(id);
  }
}
