import { Controller, Post, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CheckoutService } from './checkout.service';
import { CreateCheckoutDto, ProcessPaymentDto } from './dto/checkout.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('checkout')
export class CheckoutController {
  constructor(private checkoutService: CheckoutService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createSession(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCheckoutDto,
  ) {
    return this.checkoutService.createSession(userId, dto);
  }

  @Get('session/:sessionId')
  async getSession(@Param('sessionId') sessionId: string) {
    return this.checkoutService.getSession(sessionId);
  }

  @Post('pay')
  async processPayment(@Body() dto: ProcessPaymentDto) {
    return this.checkoutService.processPayment(dto);
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard)
  async getUserOrders(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.checkoutService.getUserOrders(userId, page || 1, limit || 20);
  }

  @Post('reset-all')
  async resetAllBalances() {
    return this.checkoutService.resetAllBalances();
  }
}
