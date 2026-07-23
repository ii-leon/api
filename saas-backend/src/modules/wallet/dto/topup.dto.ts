import { IsNumber, IsPositive, IsString, Min, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TopUpDto {
  @ApiProperty({ example: 50000 })
  @IsNumber()
  @IsPositive()
  @Min(10000)
  amountIqd: number;

  @ApiProperty({ example: 'REF-2024-001' })
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  referenceNumber: string;
}
