import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // WEB_ORIGIN accepts a comma-separated list so the dev server can be reached
  // from more than one origin at a time - localhost on this machine and the
  // LAN address a phone or tablet uses. Blank entries are dropped so a trailing
  // comma cannot turn into an empty, always-failing origin.
  const allowedOrigins = config
    .get<string>('WEB_ORIGIN', 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = Number(config.get<string>('PORT', '3000'));
  await app.listen(port);
}

void bootstrap();
