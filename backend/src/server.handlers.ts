import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppLogger } from './common/logger/app.logger';

const logger = new AppLogger('Process');

const handleUncaughtException = (err: Error): void => {
  logger.error(`uncaughtException: ${err.message}`, err.stack, 'Process');
  // Process state is undefined after an uncaught sync exception — must not continue.
  process.exit(1);
};

const handleUnhandledRejection = (reason: unknown): void => {
  const message = reason instanceof Error ? reason.message : String(reason);
  const stack = reason instanceof Error ? reason.stack : undefined;
  logger.error(`unhandledRejection: ${message}`, stack, 'Process');
  // In request context NestJS's GlobalExceptionFilter already handles rejections.
  // Force-exit only in production where any leak is unacceptable.
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
};

export const registerProcessHandlers = (): void => {
  process.on('uncaughtException', handleUncaughtException);
  process.on('unhandledRejection', handleUnhandledRejection);
};

export const setupSwagger = (
  app: INestApplication,
  apiPrefix: string,
): void => {
  if (process.env.NODE_ENV === 'production') return;

  const config = new DocumentBuilder()
    .setTitle('LoanPro API')
    .setDescription(
      'Unstructured document extraction API for loan applications',
    )
    .setVersion('1.0')
    .addApiKey(
      { type: 'apiKey', in: 'header', name: 'X-Lender-Email' },
      'lender-email',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
};

export const setupHealthCheck = (app: INestApplication): void => {
  app
    .getHttpAdapter()
    .get('/health', (_req: unknown, res: { json: (body: unknown) => void }) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
};

export const serverStarted = ({
  port,
  apiPrefix,
  corsOrigins,
}: {
  port: number;
  apiPrefix: string;
  corsOrigins: string[];
}): void => {
  logger.log(`Server listening on http://localhost:${port}`, 'Bootstrap');
  logger.log(
    `Swagger docs at http://localhost:${port}/${apiPrefix}/docs`,
    'Bootstrap',
  );
  logger.log(`CORS allowed origins: ${corsOrigins.join(', ')}`, 'Bootstrap');
};

export const handleBootstrapError = (err: Error): void => {
  logger.error(`Bootstrap failed: ${err.message}`, err.stack, 'Process');
  process.exit(1);
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
export const compression = require('compression') as () => ReturnType<
  typeof import('compression')
>;
