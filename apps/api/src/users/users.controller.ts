import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { UserDto, UserSearchResultDto } from '@argora/core';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from './user.entity';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt.toISOString(),
    };
  }

  // Powering the invite picker. Returns up to 10 active users matching
  // the prefix on displayName or email; caller is always excluded.
  @Get('search')
  search(
    @CurrentUser() caller: User,
    @Query('q') query: string | undefined,
  ): Promise<UserSearchResultDto[]> {
    return this.users.search(query ?? '', caller.id);
  }
}
