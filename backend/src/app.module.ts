import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import configuration, { envValidationSchema } from './config/configuration';
import { CommonModule } from './common/common.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PipelineModule } from './modules/pipeline/pipeline.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true, // ignore OS-level vars not in our schema
        abortEarly: false, // report all missing vars at once, not just the first
      },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
        autoLoadEntities: true,
        migrations: [join(__dirname, 'database/migrations/*.{ts,js}')],
        migrationsTableName: 'migrations',
        migrationsRun: config.get<string>('server.nodeEnv') !== 'production',
        synchronize: false,
        logging: false,
        retryAttempts: 5,
        retryDelay: 3000,
        extra: {
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        },
      }),
    }),
    ScheduleModule.forRoot(),
    CommonModule,
    ApplicationsModule,
    DocumentsModule,
    NotificationsModule,
    PipelineModule,
  ],
})
export class AppModule {}
