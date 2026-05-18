import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { resolveEnvPath } from './config/resolve-env-path';

dotenv.config({ path: resolveEnvPath() });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './infrastructure/http/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const prodOrigins = [process.env.CLIENT_URL, process.env.PORTAL_URL].filter(
    (origin): origin is string => Boolean(origin),
  );
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? prodOrigins.length > 0
          ? prodOrigins
          : ['https://app.klipyt.com', 'https://lojista.klipyt.com']
        : '*',
    credentials: true,
  });

  const port = process.env.API_PORT || 3000;
  await app.listen(port);
  console.log(`[KLIPYT API] Rodando em http://localhost:${port}/api/v1`);
  console.log(`[KLIPYT API] Health: http://localhost:${port}/api/v1/health`);
}

bootstrap();
