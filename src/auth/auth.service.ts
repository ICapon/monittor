import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

// Precomputed once at boot so a lookup for a nonexistent username still pays
// the same bcrypt.compare cost as a real one — closes the timing side
// channel that would otherwise let an attacker distinguish "no such user"
// from "wrong password" by response time.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

export interface JwtPayload {
  sub: string;
  username: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByUsername(username);
    const hash = user?.passwordHash ?? DUMMY_HASH;
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch && user ? user : null;
  }

  login(user: User): { token: string } {
    const token = this.jwtService.sign({ sub: user.id, username: user.username });
    return { token };
  }

  // Never throws — returns null for a missing/expired/malformed token so
  // callers can decide whether that's a hard failure (middleware) or just
  // "render as anonymous" (optional personalization).
  verifyToken(token: string | undefined): JwtPayload | null {
    if (!token) return null;
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('jwt.secret'),
        clockTolerance: 5,
      });
    } catch {
      return null;
    }
  }
}
