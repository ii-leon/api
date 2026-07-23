import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AiService } from './ai.service';
import { AiRequestDto } from './dto/ai-request.dto';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate AI response (costs credits)' })
  @ApiResponse({ status: 200, description: 'AI response generated' })
  @ApiResponse({ status: 402, description: 'Insufficient credits' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async generate(
    @CurrentUser('id') userId: string,
    @Body() dto: AiRequestDto,
  ) {
    return this.aiService.generate(userId, dto.prompt, dto.modelName);
  }
}
