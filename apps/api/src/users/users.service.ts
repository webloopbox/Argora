import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { UserSearchResultDto } from '@argora/core';
import * as bcrypt from 'bcrypt';
import { IsNull, Repository } from 'typeorm';
import { User } from './user.entity';

const PASSWORD_SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  findActiveById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id, archivedOn: IsNull() } });
  }

  findActiveByEmail(email: string): Promise<User | null> {
    return this.users.findOne({
      where: { email: email.toLowerCase(), archivedOn: IsNull() },
    });
  }

  async create(input: {
    email: string;
    password: string;
    displayName: string;
  }): Promise<User> {
    const passwordHash = await bcrypt.hash(
      input.password,
      PASSWORD_SALT_ROUNDS,
    );
    const user = this.users.create({
      email: input.email.toLowerCase(),
      passwordHash,
      displayName: input.displayName,
      archivedOn: null,
    });
    return this.users.save(user);
  }

  verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }

  // Used by the invite picker - case-insensitive prefix match against
  // displayName and email, excludes the caller, caps at 10. The trimmed
  // query must be at least 2 chars to keep the result set focused.
  async search(
    query: string,
    excludeUserId: string,
  ): Promise<UserSearchResultDto[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    const pattern = `%${trimmed.replace(/[%_]/g, '\\$&')}%`;
    const rows = await this.users
      .createQueryBuilder('u')
      .where('u.archived_on IS NULL')
      .andWhere('u.id <> :selfId', { selfId: excludeUserId })
      .andWhere('(u.display_name ILIKE :pattern OR u.email ILIKE :pattern)', {
        pattern,
      })
      .orderBy('u.display_name', 'ASC')
      .limit(10)
      .getMany();

    return rows.map((u) => ({
      id: u.id,
      displayName: u.displayName,
      email: u.email,
    }));
  }
}
