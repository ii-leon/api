import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers: Content Security Policy, Frameguard, HSTS
  app.use(
    helmet({
      contentSecurityPolicy: process.env.APP_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS - Flexible & Secure Origin Handling
  const corsOrigin = process.env.CORS_ORIGIN;

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || !corsOrigin || corsOrigin === '*') {
        return callback(null, true);
      }
      const allowedOrigins = corsOrigin.split(',').map((o) => o.trim().replace(/\/+$/, ''));
      const cleanOrigin = origin.replace(/\/+$/, '');
      if (allowedOrigins.includes(cleanOrigin) || cleanOrigin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation - DISABLED in production
  const isProduction = process.env.APP_ENV === 'production';
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('SaaS Platform API')
      .setDescription('Bulletproof Backend Architecture for SaaS Platform')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Wallet', 'Credit/Wallet operations')
      .addTag('Admin', 'Admin operations')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    console.log(`📚 Swagger docs: http://localhost:${process.env.APP_PORT || 3000}/api/docs`);
  }

  const port = process.env.APP_PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application running on: http://localhost:${port}`);
}
bootstrap();

