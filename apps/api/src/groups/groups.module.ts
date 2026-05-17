import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Argument } from '../arguments/argument.entity';
import { Debate } from '../debates/debate.entity';
import { UsersModule } from '../users/users.module';
import { GroupInvitation } from './group-invitation.entity';
import { GroupMembership } from './group-membership.entity';
import { Group } from './group.entity';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Group,
      GroupMembership,
      GroupInvitation,
      Debate,
      Argument,
    ]),
    UsersModule,
  ],
  controllers: [GroupsController, InvitationsController],
  providers: [GroupsService, InvitationsService],
  exports: [TypeOrmModule, GroupsService],
})
export class GroupsModule {}
