import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Ensures every lender-facing request carries a valid X-Lender-Email header.
 * In production this would be replaced by JWT authentication.
 */
@Injectable()
export class LenderEmailGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const email = req.headers['x-lender-email'];

    if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      throw new UnauthorizedException({
        error: 'MISSING_LENDER_EMAIL',
        message: 'A valid X-Lender-Email header is required',
      });
    }

    return true;
  }
}
