import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateEngineDto {
  @IsString({ message: 'Модель двигателя должна быть строкой' })
  @IsNotEmpty({ message: 'Модель двигателя обязательна для заполнения' })
  model: string;

  @IsString({ message: 'Тип двигателя должен быть строкой' })
  @IsNotEmpty({ message: 'Тип двигателя обязателен для заполнения' })
  engineType: string;

  @Type(() => Number)
  @IsInt({ message: 'Мощность должна быть целым числом' })
  @Min(1, { message: 'Мощность должна быть больше 0' })
  powerHp: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Объём двигателя должен быть числом' })
  @Min(0.1, { message: 'Объём двигателя должен быть больше 0' })
  volumeLiters: number;

  @IsString({ message: 'Серийный номер должен быть строкой' })
  @IsNotEmpty({ message: 'Серийный номер обязателен для заполнения' })
  serialNumber: string;

  @IsString({ message: 'Статус должен быть строкой' })
  @IsNotEmpty({ message: 'Статус обязателен для заполнения' })
  status: string;

  @Type(() => Number)
  @IsInt({ message: 'ID клиента должен быть целым числом' })
  @Min(1, { message: 'ID клиента должен быть больше 0' })
  clientId: number;
}
