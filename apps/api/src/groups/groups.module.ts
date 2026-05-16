import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupMembership } from './group-membership.entity';

// Thin shell: only registers the membership table so VisibilityGuard can
// reach it. Full Group/Invitation features arrive in Partia 6.
@Module({
  imports: [TypeOrmModule.forFeature([GroupMembership])],
  exports: [TypeOrmModule],
})
export class GroupsModule {}
