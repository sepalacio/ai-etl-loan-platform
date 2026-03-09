import Joi from 'joi';

export const envValidationSchema = Joi.object({
  // Server
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api'),
  CORS_ORIGINS: Joi.string().default('http://localhost:5173'),
  BODY_LIMIT_MB: Joi.number().default(25),
  APP_URL: Joi.string().uri().default('http://localhost:5173'),

  // Database — required in all environments
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  // AWS
  AWS_REGION: Joi.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),
  S3_BUCKET: Joi.string().required(),

  // Anthropic
  ANTHROPIC_API_KEY: Joi.string().required(),

  // Email — Resend
  RESEND_API_KEY: Joi.string().required(),
  RESEND_FROM: Joi.string().default('LoanPro <onboarding@resend.dev>'),

  // Encryption
  ENCRYPTION_KEY: Joi.string().hex().length(64).required(),
});

export default () => ({
  server: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    apiPrefix: process.env.API_PREFIX ?? 'api',
    corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(
      ',',
    ),
    bodyLimitMb: parseInt(process.env.BODY_LIMIT_MB ?? '25', 10),
    nodeEnv: process.env.NODE_ENV ?? 'development',
  },
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    name: process.env.DB_NAME ?? 'loanpro',
  },
  aws: {
    region: process.env.AWS_REGION ?? 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    s3Bucket: process.env.S3_BUCKET ?? 'loanpro-documents',
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    classificationModel: 'claude-haiku-4-5-20251001',
    extractionModel: 'claude-sonnet-4-6',
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY ?? '',
    from: process.env.RESEND_FROM ?? 'LoanPro <onboarding@resend.dev>',
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY ?? '',
  },
  appUrl: process.env.APP_URL ?? 'http://localhost:5173',
});
