import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'Имя должно быть строкой' })
  @IsNotEmpty({ message: 'Имя обязательно для заполнения' })
  name!: string;

  @IsEmail({}, { message: 'Email должен быть корректным адресом электронной почты' })
  @IsNotEmpty({ message: 'Email обязателен для заполнения' })
  email!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Возраст должен быть целым числом' })
  @Min(1, { message: 'Возраст должен быть больше 0' })
  age?: number;
}
