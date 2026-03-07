import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanApplication } from './entities/loan-application.entity';
import { BorrowerProfile } from './entities/borrower-profile.entity';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoanApplication, BorrowerProfile]),
    NotificationsModule,
  ],
  providers: [ApplicationsService],
  controllers: [ApplicationsController],
  exports: [ApplicationsService, TypeOrmModule],
})
export class ApplicationsModule {}
