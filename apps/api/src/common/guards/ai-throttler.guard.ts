import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class AiThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    const user = req.user as { id?: string } | undefined;
    return user?.id ?? req.ip ?? 'anonymous';
  }

  protected async getErrorMessage(
    _context: ExecutionContext,
  ): Promise<string> {
    return 'Zbyt wiele zapytań do AI. Odczekaj chwilę i spróbuj ponownie.';
  }
}
