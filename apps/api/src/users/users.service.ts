import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
}
