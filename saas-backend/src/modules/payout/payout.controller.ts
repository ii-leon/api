import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PayoutService } from './payout.service';
import { CreatePayoutDto } from './dto/create-payout.dto';

@ApiTags('Payout')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payout')
export class PayoutController {
  constructor(private readonly payoutService: PayoutService) {}

  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a payout/withdrawal request' })
  @ApiResponse({ status: 201, description: 'Payout request created' })
  async createRequest(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePayoutDto,
  ) {
    return this.payoutService.createRequest(
      userId,
      dto.amount,
      dto.paymentMethod,
      dto.paymentDetails,
    );
  }

  @Get('my-requests')
  @ApiOperation({ summary: 'Get my payout requests' })
  @ApiResponse({ status: 200, description: 'Payout requests retrieved' })
  async getMyRequests(@CurrentUser('id') userId: string) {
    return this.payoutService.getMyRequests(userId);
  }
}
