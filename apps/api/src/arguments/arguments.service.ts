import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArgumentDto, CreateArgumentDto } from '@brainstorm/core';
import { In, Repository } from 'typeorm';
import { activeWhere } from '../common/repository/soft-delete';
import { Debate } from '../debates/debate.entity';
import { User } from '../users/user.entity';
import { Argument } from './argument.entity';

@Injectable()
export class ArgumentsService {
  constructor(
    @InjectRepository(Argument)
    private readonly args: Repository<Argument>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async create(
    debate: Debate,
    author: User,
    input: CreateArgumentDto,
  ): Promise<ArgumentDto> {
    let parentId: string | null = null;
    if (input.parentArgumentId) {
      const parent = await this.args.findOne({
        where: activeWhere<Argument>({ id: input.parentArgumentId }),
      });
      if (!parent || parent.debateId !== debate.id) {
        throw new BadRequestException(
          'Wskazany argument nadrzędny nie istnieje w tej debacie.',
        );
      }
      parentId = parent.id;
    }

    const created = this.args.create({
      debateId: debate.id,
      parentArgumentId: parentId,
      side: input.side,
      content: input.content.trim(),
      authorId: author.id,
      isAiGenerated: input.isAiGenerated ?? false,
      embedding: null,
      archivedOn: null,
    });
    const saved = await this.args.save(created);
    return this.toDto(saved, author);
  }

  async listForDebate(debate: Debate): Promise<ArgumentDto[]> {
    const args = await this.args.find({
      where: activeWhere<Argument>({ debateId: debate.id }),
      order: { createdAt: 'ASC' },
    });
    if (args.length === 0) return [];

    const authorIds = Array.from(new Set(args.map((a) => a.authorId)));
    const authors = await this.users.find({ where: { id: In(authorIds) } });
    const authorMap = new Map(authors.map((u) => [u.id, u]));

    return args.map((arg) => this.toDto(arg, authorMap.get(arg.authorId)));
  }

  async archive(argumentId: string, caller: User): Promise<void> {
    const arg = await this.args.findOne({
      where: activeWhere<Argument>({ id: argumentId }),
    });
    if (!arg) throw new NotFoundException('Argument nie istnieje.');
    if (arg.authorId !== caller.id) {
      throw new BadRequestException(
        'Tylko autor argumentu może go zarchiwizować.',
      );
    }
    arg.archivedOn = new Date();
    await this.args.save(arg);
  }

  private toDto(arg: Argument, author?: User): ArgumentDto {
    return {
      id: arg.id,
      debateId: arg.debateId,
      parentArgumentId: arg.parentArgumentId,
      side: arg.side,
      content: arg.content,
      author: author
        ? { id: author.id, displayName: author.displayName }
        : { id: arg.authorId, displayName: '—' },
      isAiGenerated: arg.isAiGenerated,
      createdAt: arg.createdAt.toISOString(),
    };
  }
}
