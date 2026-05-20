import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Argument } from '../arguments/argument.entity';
import { Debate } from '../debates/debate.entity';
import { User } from '../users/user.entity';
import { Vote } from '../votes/vote.entity';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([Debate, Argument, User, Vote])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
