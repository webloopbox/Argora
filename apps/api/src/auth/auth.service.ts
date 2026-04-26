import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthTokenDto, LoginDto, RegisterDto } from '@brainstorm/core';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokenDto> {
    const existing = await this.users.findActiveByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Konto z tym adresem e-mail już istnieje.');
    }
    const user = await this.users.create(dto);
    return this.signToken(user.id);
  }

  async login(dto: LoginDto): Promise<AuthTokenDto> {
    const user = await this.users.findActiveByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Nieprawidłowe dane logowania.');
    }
    const ok = await this.users.verifyPassword(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Nieprawidłowe dane logowania.');
    }
    return this.signToken(user.id);
  }

  private signToken(userId: string): AuthTokenDto {
    return { accessToken: this.jwt.sign({ sub: userId }) };
  }
}
