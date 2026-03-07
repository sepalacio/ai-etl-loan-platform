import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLogger } from '../logger/app.logger';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new AppLogger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const b = body as Record<string, unknown>;
        message = (b['message'] as string) ?? message;
        code = (b['error'] as string) ?? code;
        details = b['details'];
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        exception.message,
        exception.stack,
        GlobalExceptionFilter.name,
      );
    }

    this.logger.error(
      `${req.method} ${req.url} → ${status} ${code}`,
      GlobalExceptionFilter.name,
    );

    res.status(status).json({
      error: { code, message, details },
    });
  }
}
