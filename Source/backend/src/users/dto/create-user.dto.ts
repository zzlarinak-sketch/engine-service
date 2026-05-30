import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'Имя должно быть строкой' })
  @IsNotEmpty({ message: 'Имя обязательно для заполнения' })
  name: string;

  @IsEmail({}, { message: 'Email должен быть корректным адресом электронной почты' })
  @IsNotEmpty({ message: 'Email обязателен для заполнения' })
  email: string;
}