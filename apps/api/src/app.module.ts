import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';
import { AiModule } from './ai/ai.module';
import { ArgumentsModule } from './arguments/arguments.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { DebatesModule } from './debates/debates.module';
import { GroupsModule } from './groups/groups.module';
import { StatsModule } from './stats/stats.module';
import { UsersModule } from './users/users.module';
import { VotesModule } from './votes/votes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '.env'),
        join(process.cwd(), '..', '..', '.env'),
      ],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'ai-generate',
        ttl: 60_000,
        limit: 10,
      },
      {
        name: 'ai-synthesize',
        ttl: 60_000,
        limit: 5,
      },
      {
        name: 'ai-duplicate',
        ttl: 60_000,
        limit: 20,
      },
    ]),
    DatabaseModule,
    UsersModule,
    AuthModule,
    GroupsModule,
    DebatesModule,
    ArgumentsModule,
    VotesModule,
    AiModule,
    StatsModule,
  ],
})
export class AppModule {}
