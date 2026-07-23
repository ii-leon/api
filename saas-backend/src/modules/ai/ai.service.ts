import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WalletService } from '../wallet/wallet.service';
import axios from 'axios';

@Injectable()
export class AiService {
  constructor(
    private readonly walletService: WalletService,
    private readonly configService: ConfigService,
  ) {}

  async generate(
    userId: string,
    prompt: string,
    modelName: string = 'mimo-v2.5',
  ): Promise<{
    response: string;
    creditsCost: number;
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    transactionId: string;
  }> {
    if (!prompt || prompt.trim().length === 0) {
      throw new BadRequestException('Prompt is required');
    }

    const estimatedTokens = Math.ceil(prompt.length / 4) + 200;
    const creditsCost = Math.max(0.01, estimatedTokens * 0.0001);

    // Hold credits
    const holdResult = await this.walletService.deductForAiUsage(userId, creditsCost, {
      modelName,
      promptTokens: Math.ceil(prompt.length / 4),
      completionTokens: 0,
      totalTokens: Math.ceil(prompt.length / 4),
      requestPayload: { prompt: prompt.substring(0, 500) },
    });

    try {
      const apiKey = this.configService.get('MIMO_API_KEY');
      const apiUrl = this.configService.get('MIMO_API_URL', 'https://api.mimo.ai/v1');

      let response: string;

      if (apiKey) {
        const apiResponse = await axios.post(
          `${apiUrl}/chat/completions`,
          {
            model: modelName,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1024,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          },
        );

        response = apiResponse.data.choices?.[0]?.message?.content || 'No response generated';

        const usage = apiResponse.data.usage || {};
        const actualPromptTokens = usage.prompt_tokens || Math.ceil(prompt.length / 4);
        const actualCompletionTokens = usage.completion_tokens || Math.ceil(response.length / 4);
        const actualTotalTokens = actualPromptTokens + actualCompletionTokens;

        await this.walletService.confirmAiUsage(holdResult.transactionId, {
          response: response.substring(0, 1000),
          usage,
        });

        return {
          response,
          creditsCost,
          totalTokens: actualTotalTokens,
          promptTokens: actualPromptTokens,
          completionTokens: actualCompletionTokens,
          transactionId: holdResult.transactionId,
        };
      } else {
        // Mock response when no API key
        response = `This is a mock response for your prompt: "${prompt.substring(0, 100)}..."\n\nIn production, this would be powered by MiMo V2.5 AI model. Please configure MIMO_API_KEY to enable real AI responses.`;

        await this.walletService.confirmAiUsage(holdResult.transactionId, {
          response: response.substring(0, 1000),
          mock: true,
        });

        return {
          response,
          creditsCost,
          totalTokens: estimatedTokens,
          promptTokens: Math.ceil(prompt.length / 4),
          completionTokens: Math.ceil(response.length / 4),
          transactionId: holdResult.transactionId,
        };
      }
    } catch (error) {
      // Reject/refund on failure
      await this.walletService.rejectAiUsage(
        holdResult.transactionId,
        error.message || 'AI request failed',
      );

      // Don't expose internal API error details to client
      throw new HttpException(
        'AI request failed. Please try again later.',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
