import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../users/user.entity';

// Lets the request through even without a Bearer token, but if a token is
// present and valid we still attach `req.user`. Public debate reads use
// this so that VisibilityGuard can later check group membership for
// logged-in callers without forcing anonymous visitors out.
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = User>(
    _err: unknown,
    user: TUser | false,
  ): TUser | undefined {
    return user || undefined;
  }

  override canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
