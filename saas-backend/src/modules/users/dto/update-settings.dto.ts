import { IsBoolean, IsOptional, IsIn, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  pushNotifications?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  twoFactorEnabled?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  darkMode?: boolean;

  @ApiPropertyOptional({ enum: ['en', 'ar', 'ku'] })
  @IsString()
  @IsIn(['en', 'ar', 'ku'], { message: 'Language must be en, ar, or ku' })
  @IsOptional()
  language?: string;
}
