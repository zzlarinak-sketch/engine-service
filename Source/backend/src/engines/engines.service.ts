import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.providers';
import { CreateEngineDto } from './dto/create-engine.dto';
import { UpdateEngineDto } from './dto/update-engine.dto';

interface AuthUser {
  sub: number;
  username: string;
  role: string;
  clientId: number | null;
}

@Injectable()
export class EnginesService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findAll(user: AuthUser) {
    const isClient = user.role === 'client';

    const result = await this.pool.query(
      `
      SELECT
        id,
        model,
        engine_type AS "engineType",
        power_hp AS "powerHp",
        volume_liters AS "volumeLiters",
        serial_number AS "serialNumber",
        status,
        client_id AS "clientId",
        client_name AS "clientName",
        client_email AS "clientEmail"
      FROM view_engines_with_clients
      ${isClient ? 'WHERE client_id = $1' : ''}
      ORDER BY id;
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
        id,
        model,
        engine_type AS "engineType",
        power_hp AS "powerHp",
        volume_liters AS "volumeLiters",
        serial_number AS "serialNumber",
        status,
        client_id AS "clientId",
        client_name AS "clientName",
        client_email AS "clientEmail"
      FROM view_engines_with_clients
      WHERE id = $1
      ${isClient ? 'AND client_id = $2' : ''};
      `,
      isClient ? [id, user.clientId] : [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Двигатель с id ${id} не найден`);
    }

    return result.rows[0];
  }

  async create(createEngineDto: CreateEngineDto, user: AuthUser) {
    const clientId =
      user.role === 'client' ? user.clientId : createEngineDto.clientId;

    if (!clientId) {
      throw new ForbiddenException('Не удалось определить клиента для двигателя');
    }

    try {
      const result = await this.pool.query(
        `
        INSERT INTO engines (
          model,
          engine_type,
          power_hp,
          volume_liters,
          serial_number,
          status,
          client_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id;
        `,
        [
          createEngineDto.model,
          createEngineDto.engineType,
          createEngineDto.powerHp,
          createEngineDto.volumeLiters,
          createEngineDto.serialNumber,
          user.role === 'client' ? 'на диагностике' : createEngineDto.status,
          clientId,
        ],
      );

      return this.findOne(result.rows[0].id, user);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('Двигатель с таким серийным номером уже существует');
      }

      if (error.code === '23503') {
        throw new BadRequestException('Клиент с указанным id не найден');
      }

      throw error;
    }
  }

  async update(id: number, updateEngineDto: UpdateEngineDto) {
    await this.findOne(id, {
      sub: 0,
      username: 'admin',
      role: 'admin',
      clientId: null,
    });

    try {
      await this.pool.query(
        `
        UPDATE engines
        SET
          model = COALESCE($1, model),
          engine_type = COALESCE($2, engine_type),
          power_hp = COALESCE($3, power_hp),
          volume_liters = COALESCE($4, volume_liters),
          serial_number = COALESCE($5, serial_number),
          status = COALESCE($6, status),
          client_id = COALESCE($7, client_id)
        WHERE id = $8;
        `,
        [
          updateEngineDto.model,
          updateEngineDto.engineType,
          updateEngineDto.powerHp,
          updateEngineDto.volumeLiters,
          updateEngineDto.serialNumber,
          updateEngineDto.status,
          updateEngineDto.clientId,
          id,
        ],
      );

      return this.findOne(id, {
        sub: 0,
        username: 'admin',
        role: 'admin',
        clientId: null,
      });
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('Двигатель с таким серийным номером уже существует');
      }

      if (error.code === '23503') {
        throw new BadRequestException('Клиент с указанным id не найден');
      }

      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id, {
      sub: 0,
      username: 'admin',
      role: 'admin',
      clientId: null,
    });

    try {
      await this.pool.query('DELETE FROM engines WHERE id = $1;', [id]);

      return {
        message: `Двигатель с id ${id} удалён`,
      };
    } catch (error: any) {
      if (error.message?.includes('Нельзя удалить двигатель')) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }
}
