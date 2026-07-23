import { IsString, IsPositive, IsNumber, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferDto {
  @ApiProperty({ example: 'john_doe' })
  @IsString()
  @MaxLength(50)
  recipientUsername: string;

  @ApiProperty({ example: 100.50 })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  amount: number;
}
