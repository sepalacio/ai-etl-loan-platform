import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { AppLogger } from './common/logger/app.logger';
import {
  registerProcessHandlers,
  serverStarted,
  handleBootstrapError,
  setupSwagger,
  setupHealthCheck,
  compression,
} from './server.handlers';

registerProcessHandlers();

async function bootstrap(): Promise<{
  port: number;
  apiPrefix: string;
  corsOrigins: string[];
}> {
  const logger = new AppLogger('Bootstrap');
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  // config.getOrThrow() throws at startup if the key is missing,
  const port = config.getOrThrow<number>('server.port');
  const apiPrefix = config.getOrThrow<string>('server.apiPrefix');
  const corsOrigins = config.getOrThrow<string[]>('server.corsOrigins');
  const bodyLimitMb = config.getOrThrow<number>('server.bodyLimitMb');

  app.useLogger(logger);
  app.enableShutdownHooks();

  // ── Security ──────────────────────────────────────────────────────────────
  app.use(helmet());
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Lender-Email'],
    credentials: true,
  });

  // ── Performance ───────────────────────────────────────────────────────────
  app.use(compression());
  app.use(json({ limit: `${bodyLimitMb}mb` }));
  app.use(urlencoded({ extended: true, limit: `${bodyLimitMb}mb` }));

  // ── Routing ───────────────────────────────────────────────────────────────
  app.setGlobalPrefix(apiPrefix, { exclude: ['/health'] });

  // ── Global pipes & filters ────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── Swagger & health check ────────────────────────────────────────────────
  setupSwagger(app, apiPrefix);
  setupHealthCheck(app);

  await app.listen(port);

  return { port, apiPrefix, corsOrigins };
}

bootstrap().then(serverStarted).catch(handleBootstrapError);
