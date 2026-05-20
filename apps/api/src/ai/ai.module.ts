import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArgumentsModule } from '../arguments/arguments.module';
import { Argument } from '../arguments/argument.entity';
import { VisibilityGuard } from '../common/guards/visibility.guard';
import { Debate } from '../debates/debate.entity';
import { GroupMembership } from '../groups/group-membership.entity';
import { EmbeddingModule } from './embedding.module';
import { LlmRegistry } from './llm-registry';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Argument, Debate, GroupMembership]),
    EmbeddingModule,
    ArgumentsModule,
  ],
  providers: [LlmRegistry, AiService, VisibilityGuard],
  controllers: [AiController],
})
export class AiModule {}
