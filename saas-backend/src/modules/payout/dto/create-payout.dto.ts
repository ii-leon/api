import { IsNumber, IsPositive, IsString, IsObject, Min, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePayoutDto {
  @ApiProperty({ example: 50.00 })
  @IsNumber()
  @IsPositive()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'bank_transfer', enum: ['bank_transfer', 'zain_cash', 'fast_pay', 'usdt'] })
  @IsString()
  @IsIn(['bank_transfer', 'zain_cash', 'fast_pay', 'usdt'])
  paymentMethod: string;

  @ApiProperty({ example: { accountNumber: '123-456-789' } })
  @IsObject()
  paymentDetails: Record<string, string>;
}
