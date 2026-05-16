import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisibilityGuard } from '../common/guards/visibility.guard';
import { Debate } from '../debates/debate.entity';
import { GroupsModule } from '../groups/groups.module';
import { UsersModule } from '../users/users.module';
import { User } from '../users/user.entity';
import { Argument } from './argument.entity';
import {
  ArgumentItemController,
  ArgumentsController,
} from './arguments.controller';
import { ArgumentsService } from './arguments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Argument, Debate, User]),
    GroupsModule,
    UsersModule,
  ],
  controllers: [ArgumentsController, ArgumentItemController],
  providers: [ArgumentsService, VisibilityGuard],
  exports: [ArgumentsService],
})
export class ArgumentsModule {}
