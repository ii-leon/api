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

  // CORS - Require explicit origin in production
  const corsOrigin = process.env.CORS_ORIGIN;
  const isProduction = process.env.APP_ENV === 'production';

  if (isProduction && (!corsOrigin || corsOrigin === '*')) {
    console.error('⛔ SECURITY FATAL: CORS_ORIGIN cannot be wildcard or empty in production!');
  }

  app.enableCors({
    origin: corsOrigin && corsOrigin !== '*' ? corsOrigin.split(',') : (isProduction ? false : true),
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

