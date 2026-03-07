import { Injectable, LoggerService } from '@nestjs/common';

const PII_KEYS = new Set([
  'ssn',
  'social_security_number',
  'taxId',
  'tax_id',
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'accountNumber',
  'account_number',
  'routingNumber',
  'routing_number',
  'creditCard',
  'credit_card',
  'dob',
  'date_of_birth',
  'dateOfBirth',
]);

const PII_PATTERNS: Array<{ pattern: RegExp; mask: string }> = [
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, mask: '***-**-****' }, // SSN
  { pattern: /\b\d{16}\b/g, mask: '****************' }, // credit card
  {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    mask: '[email]',
  }, // email
];

function redact(value: unknown, depth = 0): unknown {
  if (depth > 5 || value === null || value === undefined) return value;
  if (typeof value === 'string') {
    let s = value;
    for (const { pattern, mask } of PII_PATTERNS) s = s.replace(pattern, mask);
    return s;
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = PII_KEYS.has(k) ? '[REDACTED]' : redact(v, depth + 1);
    }
    return result;
  }
  if (Array.isArray(value))
    return (value as unknown[]).map((v) => redact(v, depth + 1));
  return value;
}

@Injectable()
export class AppLogger implements LoggerService {
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  setContext(context: string) {
    this.context = context;
  }

  private format(
    level: string,
    message: unknown,
    ...optionalParams: unknown[]
  ): string {
    const ts = new Date().toISOString();
    const ctx =
      optionalParams.find((p) => typeof p === 'string') ??
      this.context ??
      'App';
    const extra = optionalParams.filter((p) => typeof p !== 'string');
    const safeMessage = redact(message);
    const safeExtra = extra.map((e) => redact(e));
    const parts: unknown[] = [safeMessage, ...safeExtra];
    return `[${ts}] [${level.toUpperCase()}] [${ctx}] ${parts.map((p) => (typeof p === 'string' ? p : JSON.stringify(p))).join(' ')}`;
  }

  log(message: unknown, ...optionalParams: unknown[]) {
    console.log(this.format('info', message, ...optionalParams));
  }

  error(message: unknown, ...optionalParams: unknown[]) {
    console.error(this.format('error', message, ...optionalParams));
  }

  warn(message: unknown, ...optionalParams: unknown[]) {
    console.warn(this.format('warn', message, ...optionalParams));
  }

  debug(message: unknown, ...optionalParams: unknown[]) {
    console.debug(this.format('debug', message, ...optionalParams));
  }

  verbose(message: unknown, ...optionalParams: unknown[]) {
    console.log(this.format('verbose', message, ...optionalParams));
  }
}
