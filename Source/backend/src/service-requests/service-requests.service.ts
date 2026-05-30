import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.providers';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto';

interface AuthUser {
  sub: number;
  username: string;
  role: string;
  clientId: number | null;
}

@Injectable()
export class ServiceRequestsService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findAll(user: AuthUser) {
    const isClient = user.role === 'client';

    const result = await this.pool.query(
      `
      SELECT
        sr.id,
        sr.engine_id AS "engineId",
        e.model AS "engineModel",
        c.name AS "clientName",
        sr.description,
        sr.status,
        sr.price,
        sr.created_at AS "createdAt",
        sr.completed_at AS "completedAt"
      FROM service_requests sr
      JOIN engines e ON e.id = sr.engine_id
      JOIN clients c ON c.id = e.client_id
      ${isClient ? 'WHERE e.client_id = $1' : ''}
      ORDER BY sr.id;
      `,
      isClient ? [user.clientId] : [],
    );

    return result.rows;
  }

  async findOne(id: number, user: AuthUser) {
    const isClient = user.role === 'client';

    const result = await this.pool.query(
      `
      SELECT
        sr.id,
        sr.engine_id AS "engineId",
        e.model AS "engineModel",
        c.name AS "clientName",
        sr.description,
        sr.status,
        sr.price,
        sr.created_at AS "createdAt",
        sr.completed_at AS "completedAt"
      FROM service_requests sr
      JOIN engines e ON e.id = sr.engine_id
      JOIN clients c ON c.id = e.client_id
      WHERE sr.id = $1
      ${isClient ? 'AND e.client_id = $2' : ''};
      `,
      isClient ? [id, user.clientId] : [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Заявка с id ${id} не найдена`);
    }

    return result.rows[0];
  }

  async create(createServiceRequestDto: CreateServiceRequestDto, user: AuthUser) {
    if (user.role === 'client') {
      const engineCheck = await this.pool.query(
        `
        SELECT id
        FROM engines
        WHERE id = $1 AND client_id = $2;
        `,
        [createServiceRequestDto.engineId, user.clientId],
      );

      if (engineCheck.rows.length === 0) {
        throw new ForbiddenException(
          'Клиент может создать заявку только для своего двигателя',
        );
      }
    }

    const status = user.role === 'client'
      ? 'новая'
      : createServiceRequestDto.status || 'новая';

    const price = user.role === 'client'
      ? 0
      : createServiceRequestDto.price || 0;

    try {
      const result = await this.pool.query(
        `
        INSERT INTO service_requests (
          engine_id,
          description,
          status,
          price
        )
        VALUES ($1, $2, $3, $4)
        RETURNING id;
        `,
        [
          createServiceRequestDto.engineId,
          createServiceRequestDto.description,
          status,
          price,
        ],
      );

      return this.findOne(result.rows[0].id, user);
    } catch (error: any) {
      if (error.code === '23503') {
        throw new BadRequestException('Двигатель с указанным id не найден');
      }

      throw error;
    }
  }

  async update(id: number, updateServiceRequestDto: UpdateServiceRequestDto) {
    await this.findOne(id, {
      sub: 0,
      username: 'admin',
      role: 'admin',
      clientId: null,
    });

    await this.pool.query(
      `
      UPDATE service_requests
      SET
        description = COALESCE($1, description),
        status = COALESCE($2, status),
        price = COALESCE($3, price),
        completed_at = CASE
          WHEN $2 = 'завершена' THEN CURRENT_TIMESTAMP
          ELSE completed_at
        END
      WHERE id = $4;
      `,
      [
        updateServiceRequestDto.description,
        updateServiceRequestDto.status,
        updateServiceRequestDto.price,
        id,
      ],
    );

    return this.findOne(id, {
      sub: 0,
      username: 'admin',
      role: 'admin',
      clientId: null,
    });
  }

  async remove(id: number) {
    await this.findOne(id, {
      sub: 0,
      username: 'admin',
      role: 'admin',
      clientId: null,
    });

    await this.pool.query('DELETE FROM service_requests WHERE id = $1;', [id]);

    return {
      message: `Заявка с id ${id} удалена`,
    };
  }
}
