import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateEngineDto {
  @IsOptional()
  @IsString({ message: 'Модель двигателя должна быть строкой' })
  model?: string;

  @IsOptional()
  @IsString({ message: 'Тип двигателя должен быть строкой' })
  engineType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Мощность должна быть целым числом' })
  @Min(1, { message: 'Мощность должна быть больше 0' })
  powerHp?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Объём двигателя должен быть числом' })
  @Min(0.1, { message: 'Объём двигателя должен быть больше 0' })
  volumeLiters?: number;

  @IsOptional()
  @IsString({ message: 'Серийный номер должен быть строкой' })
  serialNumber?: string;

  @IsOptional()
  @IsString({ message: 'Статус должен быть строкой' })
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID клиента должен быть целым числом' })
  @Min(1, { message: 'ID клиента должен быть больше 0' })
  clientId?: number;
}
