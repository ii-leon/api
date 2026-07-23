import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class FinancialThrottleGuard implements CanActivate {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const endpoint = request.route?.path;

    if (!userId) {
      return true; // Let auth guard handle this
    }

    // Define rate limits per endpoint type
    const limits = this.getRateLimit(endpoint);
    const key = `throttle:${endpoint}:${userId}`;

    // =====================================================
    // SECURITY: Atomic Increment with TTL using Lua Script
    // Prevents race condition between INCR and EXPIRE
    // =====================================================
    const luaScript = `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local window = tonumber(ARGV[2])

      local current = redis.call('INCR', key)
      if current == 1 then
        redis.call('EXPIRE', key, window)
      end

      local ttl = redis.call('TTL', key)

      return {current, ttl}
    `;

    const [currentCount, ttl] = (await this.redis.eval(
      luaScript,
      1, // number of keys
      key,
      limits.maxRequests.toString(),
      limits.windowSeconds.toString(),
    )) as [number, number];

    // Check if limit exceeded
    if (currentCount > limits.maxRequests) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Rate limit exceeded. Try again in ${ttl} seconds.`,
          retryAfter: ttl,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Add rate limit headers
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', limits.maxRequests.toString());
    response.setHeader(
      'X-RateLimit-Remaining',
      Math.max(0, limits.maxRequests - currentCount).toString(),
    );
    response.setHeader('X-RateLimit-Reset', ttl.toString());

    return true;
  }

  private getRateLimit(endpoint: string): {
    maxRequests: number;
    windowSeconds: number;
  } {
    // Strict limits for financial operations
    const limits: Record<string, { maxRequests: number; windowSeconds: number }> = {
      // Transfer: max 5 per minute
      '/wallet/transfer': { maxRequests: 5, windowSeconds: 60 },

      // Top-up: max 3 per hour
      '/wallet/topup': { maxRequests: 3, windowSeconds: 3600 },

      // Payout: max 2 per hour
      '/wallet/payout': { maxRequests: 2, windowSeconds: 3600 },

      // Auth: max 5 per 15 minutes
      '/auth/login': { maxRequests: 5, windowSeconds: 900 },

      // Registration: max 3 per hour
      '/auth/register': { maxRequests: 3, windowSeconds: 3600 },
    };

    return limits[endpoint] || { maxRequests: 100, windowSeconds: 60 };
  }
}
