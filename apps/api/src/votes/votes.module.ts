import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArgumentsModule } from '../arguments/arguments.module';
import { VisibilityGuard } from '../common/guards/visibility.guard';
import { Argument } from '../arguments/argument.entity';
import { Debate } from '../debates/debate.entity';
import { GroupMembership } from '../groups/group-membership.entity';
import { Vote } from './vote.entity';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vote, Argument, Debate, GroupMembership]),
    ArgumentsModule,
  ],
  controllers: [VotesController],
  providers: [VotesService, VisibilityGuard],
  exports: [VotesService, TypeOrmModule],
})
export class VotesModule {}
