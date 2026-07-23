import { IsString, IsPositive, IsNumber, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeductionDto {
  @ApiProperty({ example: 5.50 })
  @IsNumber()
  @IsPositive()
  creditCost: number;

  @ApiProperty({ example: 'mimo-v2.5' })
  @IsString()
  modelName: string;

  @ApiPropertyOptional({ example: 150 })
  @IsNumber()
  @IsOptional()
  promptTokens?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsNumber()
  @IsOptional()
  completionTokens?: number;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  requestPayload?: Record<string, any>;
}
