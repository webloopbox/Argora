import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class AiThrottlerGuard extends ThrottlerGuard {
  // Rate limits are counted per account, falling back to the client address
  // for a request that somehow reaches a throttled route unauthenticated.
  protected getTracker(req: Request): Promise<string> {
    const user = req.user as { id?: string } | undefined;
    return Promise.resolve(user?.id ?? req.ip ?? 'anonymous');
  }

  protected getErrorMessage(): Promise<string> {
    return Promise.resolve(
      'Zbyt wiele zapytań do AI. Odczekaj chwilę i spróbuj ponownie.',
    );
  }
}
