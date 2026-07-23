import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AiRequestDto {
  @ApiProperty({ example: 'What is machine learning?' })
  @IsString()
  @MaxLength(10000, { message: 'Prompt must not exceed 10000 characters' })
  prompt: string;

  @ApiPropertyOptional({ example: 'mimo-v2.5' })
  @IsString()
  @IsOptional()
  modelName?: string;
}
