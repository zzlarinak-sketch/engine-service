import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.providers';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const result = await this.pool.query(
      `
      SELECT
        u.id,
        u.username,
        u.email,
        u.password_hash,
        u.client_id,
        r.name AS role
      FROM app_users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.username = $1;
      `,
      [loginDto.username],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const user = result.rows[0];

    const isPasswordCorrect = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );

    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      clientId: user.client_id,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        clientId: user.client_id,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const dbClient = await this.pool.connect();

    try {
      await dbClient.query('BEGIN');

      const roleResult = await dbClient.query(
        `SELECT id FROM roles WHERE name = 'client';`,
      );

      const clientRoleId = roleResult.rows[0].id;

      const createdClient = await dbClient.query(
        `
        INSERT INTO clients (name, email, phone)
        VALUES ($1, $2, $3)
        RETURNING id, name, email, phone;
        `,
        [
          registerDto.name,
          registerDto.email,
          registerDto.phone || null,
        ],
      );

      const passwordHash = await bcrypt.hash(registerDto.password, 10);

      const createdUser = await dbClient.query(
        `
        INSERT INTO app_users (
          username,
          email,
          password_hash,
          role_id,
          client_id
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, username, email, client_id;
        `,
        [
          registerDto.username,
          registerDto.email,
          passwordHash,
          clientRoleId,
          createdClient.rows[0].id,
        ],
      );

      await dbClient.query('COMMIT');

      return {
        message: 'Аккаунт успешно создан. Теперь войдите в систему.',
        user: {
          id: createdUser.rows[0].id,
          username: createdUser.rows[0].username,
          email: createdUser.rows[0].email,
          role: 'client',
          clientId: createdUser.rows[0].client_id,
        },
      };
    } catch (error: any) {
      await dbClient.query('ROLLBACK');

      if (error.code === '23505') {
        throw new ConflictException(
          'Пользователь с таким логином или email уже существует',
        );
      }

      throw error;
    } finally {
      dbClient.release();
    }
  }
}
