import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

export interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
}

@Injectable()
export class UsersService {
  private users: User[] = [
    {
      id: 1,
      name: 'Arina',
      email: 'arina@example.com',
      age: 20,
    },
  ];

  private nextId = 2;

  findAll(): User[] {
    return this.users;
  }

  findOne(id: number): User {
    const user = this.users.find((item) => item.id === id);

    if (!user) {
      throw new NotFoundException(`Пользователь с id ${id} не найден`);
    }

    return user;
  }

  create(createUserDto: CreateUserDto): User {
    const newUser: User = {
      id: this.nextId,
      ...createUserDto,
    };

    this.users.push(newUser);
    this.nextId += 1;

    return newUser;
  }
}
