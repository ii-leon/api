import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class EmailThrottleGuard implements CanActivate {
  constructor(
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Extract email from body (for login/register)
    const email = request.body?.email?.toLowerCase()?.trim();

    // If no email, skip throttle (for other routes)
    if (!email) return true;

    // Rate limit key per email
    const key = `throttle:auth:${email}`;
    const limit = 20;
    const windowSeconds = 900; // 15 minutes

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
      1,
      key,
      limit.toString(),
      windowSeconds.toString(),
    )) as [number, number];

    // Add rate limit headers
    response.setHeader('X-RateLimit-Limit', limit.toString());
    response.setHeader('X-RateLimit-Remaining', Math.max(0, limit - currentCount).toString());
    response.setHeader('X-RateLimit-Reset', ttl.toString());

    if (currentCount > limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many attempts for this email. Try again in ${ttl} seconds.`,
          retryAfter: ttl,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
