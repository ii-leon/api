import { registerAs } from '@nestjs/config';

export default registerAs('security', () => {
  const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!jwtAccessSecret || jwtAccessSecret.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must be set and at least 32 characters long');
  }

  if (!jwtRefreshSecret || jwtRefreshSecret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be set and at least 32 characters long');
  }

  return {
    jwtAccessSecret,
    jwtRefreshSecret,
    jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  };
});
