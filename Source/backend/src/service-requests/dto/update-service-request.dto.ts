import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateServiceRequestDto {
  @IsOptional()
  @IsString({ message: 'Описание заявки должно быть строкой' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Статус заявки должен быть строкой' })
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Стоимость должна быть числом' })
  @Min(0, { message: 'Стоимость не может быть отрицательной' })
  price?: number;
}
