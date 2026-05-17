import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { ArgumentsModule } from './arguments/arguments.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { DebatesModule } from './debates/debates.module';
import { GroupsModule } from './groups/groups.module';
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
    DatabaseModule,
    UsersModule,
    AuthModule,
    GroupsModule,
    DebatesModule,
    ArgumentsModule,
    VotesModule,
  ],
})
export class AppModule {}
