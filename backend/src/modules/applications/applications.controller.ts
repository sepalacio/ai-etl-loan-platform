import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';

/**
 * Lender-facing endpoints.
 * In production this would be protected by JWT auth; for the take-home we use
 * the X-Lender-Email header as a lightweight identity mechanism.
 */
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly service: ApplicationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Headers('x-lender-email') lenderEmail: string,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.service.create(lenderEmail, dto);
  }

  @Get()
  findAll(@Headers('x-lender-email') lenderEmail: string) {
    return this.service.findAll(lenderEmail);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Headers('x-lender-email') lenderEmail: string,
  ) {
    return this.service.findOne(id, lenderEmail);
  }

  @Get(':id/profile')
  getBorrowerProfile(
    @Param('id') id: string,
    @Headers('x-lender-email') lenderEmail: string,
  ) {
    return this.service.getBorrowerProfile(id, lenderEmail);
  }
}
