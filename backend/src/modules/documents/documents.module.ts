import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { Document } from './entities/document.entity';
import { ApplicationsModule } from '../applications/applications.module';
import { PipelineModule } from '../pipeline/pipeline.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document]),
    ApplicationsModule,
    PipelineModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
