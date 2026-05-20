import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  DuplicateCheckResultDto,
  GeneratedArgumentDto,
  LlmProviderDto,
  SynthesisResultDto,
} from '@brainstorm/core';
import { ArgumentSide } from '@brainstorm/core';
import { Argument } from '../arguments/argument.entity';
import { ArgumentsService } from '../arguments/arguments.service';
import { Debate } from '../debates/debate.entity';
import { User } from '../users/user.entity';
import { activeWhere } from '../common/repository/soft-delete';
import { EmbeddingService } from './embedding.service';
import { LlmRegistry } from './llm-registry';
import type { GenerateInput, SynthesizeInput } from './llm-provider.interface';

const DUPLICATE_THRESHOLD = parseFloat(
  process.env['DUPLICATE_THRESHOLD'] ?? '0.86',
);

@Injectable()
export class AiService {
  constructor(
    private readonly registry: LlmRegistry,
    private readonly embedding: EmbeddingService,
    private readonly argumentsService: ArgumentsService,
    @InjectRepository(Argument)
    private readonly args: Repository<Argument>,
    @InjectRepository(Debate)
    private readonly debates: Repository<Debate>,
  ) {}

  getProviders(): LlmProviderDto[] {
    return this.registry.getActive();
  }

  async generate(
    modelId: string,
    input: GenerateInput,
  ): Promise<GeneratedArgumentDto> {
    const provider = this.registry.get(modelId);
    if (!provider)
      throw new BadRequestException(`Nieznany model: ${modelId}`);
    const content = await provider.generate(input);
    return { content, modelId };
  }

  async checkDuplicate(
    debateId: string,
    side: ArgumentSide,
    content: string,
    caller?: User,
  ): Promise<DuplicateCheckResultDto> {
    const newEmbedding = await this.embedding.embed(content);
    if (!newEmbedding) {
      return { similarity: 0, threshold: DUPLICATE_THRESHOLD };
    }

    const candidates = await this.args.find({
      where: activeWhere<Argument>({ debateId, side }),
    });

    let best: { id: string; similarity: number } | null = null;
    for (const arg of candidates) {
      if (!arg.embedding) continue;
      const sim = this.embedding.cosineSimilarity(newEmbedding, arg.embedding);
      if (!best || sim > best.similarity) {
        best = { id: arg.id, similarity: sim };
      }
    }

    if (!best || best.similarity < DUPLICATE_THRESHOLD) {
      return {
        similarity: best?.similarity ?? 0,
        threshold: DUPLICATE_THRESHOLD,
      };
    }

    const duplicateOf = await this.argumentsService.findById(best.id, caller);
    return { duplicateOf, similarity: best.similarity, threshold: DUPLICATE_THRESHOLD };
  }

  async synthesize(
    debateId: string,
    argumentIds: string[],
    modelId: string,
  ): Promise<SynthesisResultDto> {
    const provider = this.registry.get(modelId);
    if (!provider)
      throw new BadRequestException(`Nieznany model: ${modelId}`);

    const debate = await this.debates.findOne({
      where: activeWhere<Debate>({ id: debateId }),
    });
    if (!debate) throw new NotFoundException('Debata nie istnieje.');

    if (argumentIds.length === 0)
      throw new BadRequestException('Brak argumentów do syntezy.');

    const allArgs = await this.args.find({
      where: activeWhere<Argument>({ debateId }),
      order: { createdAt: 'ASC' },
    });

    const selected = allArgs.filter((a) => argumentIds.includes(a.id));
    if (selected.length === 0)
      throw new BadRequestException('Żaden z podanych argumentów nie należy do tej debaty.');

    const parentMap = new Map(allArgs.map((a) => [a.id, a.parentArgumentId]));

    const getDepth = (id: string): number => {
      let depth = 0;
      let current: string | null = parentMap.get(id) ?? null;
      while (current && depth < 20) {
        depth++;
        current = parentMap.get(current) ?? null;
      }
      return depth;
    };

    const input: SynthesizeInput = {
      thesis: debate.thesis,
      arguments: selected.map((a) => ({
        side: a.side as string,
        content: a.content,
        depth: getDepth(a.id),
      })),
    };

    const text = await provider.synthesize(input);
    return { text, modelId };
  }
}
