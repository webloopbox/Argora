import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Argument } from '../arguments/argument.entity';
import { VisibilityGuard } from '../common/guards/visibility.guard';
import { GroupsModule } from '../groups/groups.module';
import { UsersModule } from '../users/users.module';
import { User } from '../users/user.entity';
import { Debate } from './debate.entity';
import { DebatesController } from './debates.controller';
import { DebatesService } from './debates.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Debate, Argument, User]),
    GroupsModule,
    UsersModule,
  ],
  controllers: [DebatesController],
  providers: [DebatesService, VisibilityGuard],
  exports: [DebatesService, TypeOrmModule, VisibilityGuard],
})
export class DebatesModule {}
