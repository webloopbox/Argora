import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  ArgumentSideCheckResultDto,
  CheckArgumentSideDto,
  CheckDuplicateDto,
  DuplicateCheckResultDto,
  GenerateArgumentDto,
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
import { describeError, upstreamAiException } from './upstream-error';
import type {
  ClassifySideInput,
  GenerateInput,
  SynthesizeInput,
} from './llm-provider.interface';

const DUPLICATE_THRESHOLD = parseFloat(
  process.env['DUPLICATE_THRESHOLD'] ?? '0.75',
);

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

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

  // `debate` comes from VisibilityGuard, so both the thesis and the output
  // language are taken from the persisted row rather than from the request
  // body - a client must not be able to inject English premises into a Polish
  // debate, nor argue against a thesis the debate does not actually hold.
  async generate(
    debate: Debate,
    dto: GenerateArgumentDto,
  ): Promise<GeneratedArgumentDto> {
    const provider = this.registry.get(dto.modelId);
    if (!provider)
      throw new BadRequestException(`Nieznany model: ${dto.modelId}`);

    const input: GenerateInput = {
      thesis: debate.thesis,
      side: dto.side as string,
      parentContent: dto.parentContent,
      lang: debate.language,
    };
    const content = await this.callProvider(dto.modelId, () =>
      provider.generate(input),
    );
    return { content, modelId: dto.modelId };
  }

  // A vendor failure must not reach the client as a raw 500 with an English SDK
  // message. `checkArgumentSide` is exempt: it already falls through to the next
  // provider and degrades to "no mismatch" rather than failing the submission.
  private async callProvider<T>(
    modelId: string,
    call: () => Promise<T>,
  ): Promise<T> {
    try {
      return await call();
    } catch (err) {
      this.logger.error(
        `[callProvider] ${modelId} failed: ${describeError(err)}`,
      );
      throw upstreamAiException(err);
    }
  }

  async checkDuplicate(
    dto: CheckDuplicateDto,
    caller?: User,
  ): Promise<DuplicateCheckResultDto> {
    const newEmbedding = await this.embedding.embed(dto.content);
    if (!newEmbedding) {
      return { similarity: 0, threshold: DUPLICATE_THRESHOLD };
    }

    const candidates = await this.args.find({
      where: activeWhere<Argument>({ debateId: dto.debateId, side: dto.side }),
    });

    let best: { id: string; similarity: number } | null = null;
    for (const arg of candidates) {
      if (dto.parentArgumentId && arg.id === dto.parentArgumentId) continue;
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
    return {
      duplicateOf,
      similarity: best.similarity,
      threshold: DUPLICATE_THRESHOLD,
    };
  }

  async checkArgumentSide(
    debate: Debate,
    dto: CheckArgumentSideDto,
  ): Promise<ArgumentSideCheckResultDto> {
    const providerInfos = this.registry.getActive();
    if (providerInfos.length === 0) return { isMismatch: false };

    const input: ClassifySideInput = {
      thesis: debate.thesis,
      content: dto.content,
      parentContent: dto.parentContent,
      lang: debate.language,
    };

    // Try each active provider until one succeeds. The classification is a
    // lightweight single-word call, so falling through is cheap.
    for (const info of providerInfos) {
      const provider = this.registry.get(info.id);
      if (!provider) continue;

      try {
        const raw = await provider.classifySide(input);
        this.logger.log(
          `[checkArgumentSide] provider=${info.id}, raw=${JSON.stringify(raw)}, selectedSide=${dto.selectedSide}`,
        );
        if (!raw) return { isMismatch: false };
        const suggestedSide =
          raw === 'pro' ? ArgumentSide.Pro : ArgumentSide.Against;
        if (suggestedSide === dto.selectedSide) return { isMismatch: false };
        return { isMismatch: true, suggestedSide };
      } catch (err) {
        this.logger.warn(
          `[checkArgumentSide] ${info.id} failed, trying next: ${describeError(err)}`,
        );
      }
    }

    // All providers failed — don't block the user.
    return { isMismatch: false };
  }

  async synthesize(
    debateId: string,
    argumentIds: string[],
    modelId: string,
  ): Promise<SynthesisResultDto> {
    const provider = this.registry.get(modelId);
    if (!provider) throw new BadRequestException(`Nieznany model: ${modelId}`);

    const debate = await this.debates.findOne({
      where: activeWhere<Debate>({ id: debateId }),
    });
    if (!debate) throw new NotFoundException('Debata nie istnieje.');

    if (argumentIds.length === 0)
      throw new BadRequestException('Brak argumentów do syntezy.');

    // Reuse the enriched-DTO pipeline so the synthesis prompt receives
    // author display names, vote counts, weight and sentiment - without
    // duplicating the JOIN/aggregate logic here.
    const allDtos = await this.argumentsService.listForDebate(debate);
    const dtoMap = new Map(allDtos.map((d) => [d.id, d]));

    const requested = new Set(argumentIds);
    const selected = allDtos.filter((d) => requested.has(d.id));
    if (selected.length === 0)
      throw new BadRequestException(
        'Żaden z podanych argumentów nie należy do tej debaty.',
      );

    // `side` is only relative to the immediate parent (Kialo-style nesting), so an
    // argument several levels deep can locally read "for" while actually opposing
    // the thesis. Resolve the real stance by walking up to the root and flipping
    // polarity on every Against link.
    const getEffectiveStance = (id: string): ArgumentSide => {
      let pro = true;
      let currentId: string | null = id;
      let hops = 0;
      while (currentId && hops < 20) {
        const node = dtoMap.get(currentId);
        if (!node) break;
        if (node.side === ArgumentSide.Against) pro = !pro;
        currentId = node.parentArgumentId;
        hops++;
      }
      return pro ? ArgumentSide.Pro : ArgumentSide.Against;
    };

    const input: SynthesizeInput = {
      thesis: debate.thesis,
      lang: debate.language,
      arguments: selected.map((d) => ({
        side: d.side as string,
        content: d.content,
        author: d.author.displayName,
        effectiveStance: getEffectiveStance(d.id),
        forCount: d.forCount,
        againstCount: d.againstCount,
        weight: d.weight,
        sentiment: d.sentiment,
        parentContent: d.parentArgumentId
          ? (dtoMap.get(d.parentArgumentId)?.content ?? null)
          : null,
      })),
    };

    const text = await this.callProvider(modelId, () =>
      provider.synthesize(input),
    );
    return { text, modelId };
  }
}
