import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateServiceRequestDto {
  @Type(() => Number)
  @IsInt({ message: 'ID двигателя должен быть целым числом' })
  @Min(1, { message: 'ID двигателя должен быть больше 0' })
  engineId: number;

  @IsString({ message: 'Описание заявки должно быть строкой' })
  @IsNotEmpty({ message: 'Описание заявки обязательно для заполнения' })
  description: string;

  @IsOptional()
  @IsString({ message: 'Статус заявки должен быть строкой' })
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Стоимость должна быть числом' })
  @Min(0, { message: 'Стоимость не может быть отрицательной' })
  price?: number;
}
