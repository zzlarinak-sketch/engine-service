import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'Имя должно быть строкой' })
  @IsNotEmpty({ message: 'Имя обязательно для заполнения' })
  name: string;

  @IsString({ message: 'Логин должен быть строкой' })
  @IsNotEmpty({ message: 'Логин обязателен для заполнения' })
  username: string;

  @IsEmail({}, { message: 'Email должен быть корректным адресом электронной почты' })
  @IsNotEmpty({ message: 'Email обязателен для заполнения' })
  email: string;

  @IsOptional()
  @IsString({ message: 'Телефон должен быть строкой' })
  phone?: string;

  @IsString({ message: 'Пароль должен быть строкой' })
  @IsNotEmpty({ message: 'Пароль обязателен для заполнения' })
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  password: string;
}
