import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsModule } from '../applications/applications.module';
import { Document } from '../documents/entities/document.entity';
import { IncomeRecord } from './entities/income-record.entity';
import { AccountRecord } from './entities/account-record.entity';
import { PipelineService } from './pipeline.service';
import { PipelineScheduler } from './pipeline.scheduler';

@Module({
  imports: [
    // ApplicationsModule exports TypeOrmModule, giving this module access to
    // LoanApplication and BorrowerProfile repositories without re-registering them.
    ApplicationsModule,
    TypeOrmModule.forFeature([Document, IncomeRecord, AccountRecord]),
  ],
  providers: [PipelineService, PipelineScheduler],
  exports: [PipelineService],
})
export class PipelineModule {}
