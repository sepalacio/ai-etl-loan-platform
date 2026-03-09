import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Singleton queue-based rate limiter for Anthropic API calls.
 *
 * All callers await `throttle()` before each `anthropic.messages.create()` call.
 * Calls are serialised through a promise chain so concurrent pipeline steps
 * never burst above the configured RPM ceiling.
 *
 * Free tier  → ANTHROPIC_RPM=5  → one call every ~12 s
 * Build tier → ANTHROPIC_RPM=50 → one call every ~1.2 s
 */
@Injectable()
export class AnthropicRateLimiter {
  private readonly minIntervalMs: number;
  private queue: Promise<void> = Promise.resolve();
  private lastCallAt = 0;

  constructor(config: ConfigService) {
    const rpm = config.get<number>('anthropic.rpm') ?? 5;
    // Add 5 % safety margin on top of the theoretical minimum interval
    this.minIntervalMs = Math.ceil((60_000 / rpm) * 1.05);
  }

  /**
   * Await this before every Anthropic API call.
   * Returns only when it is safe to fire the next request.
   */
  throttle(): Promise<void> {
    this.queue = this.queue.then(async () => {
      const wait = this.minIntervalMs - (Date.now() - this.lastCallAt);
      if (wait > 0) await new Promise<void>((r) => setTimeout(r, wait));
      this.lastCallAt = Date.now();
    });
    return this.queue;
  }
}
