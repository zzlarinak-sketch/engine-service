import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'Логин должен быть строкой' })
  @IsNotEmpty({ message: 'Логин обязателен для заполнения' })
  username: string;

  @IsString({ message: 'Пароль должен быть строкой' })
  @IsNotEmpty({ message: 'Пароль обязателен для заполнения' })
  password: string;
}
