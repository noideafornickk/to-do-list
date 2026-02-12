import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodosService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: number, createTodoDto: CreateTodoDto) {
    return this.prisma.todo.create({
      data: {
        title: createTodoDto.title,
        userId,
      },
    });
  }

  findAll(userId: number) {
    return this.prisma.todo.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(userId: number, id: number, updateTodoDto: UpdateTodoDto) {
    await this.assertTodoExists(userId, id);

    if (Object.keys(updateTodoDto).length === 0) {
      throw new BadRequestException('At least one field must be provided');
    }

    return this.prisma.todo.update({
      where: { id },
      data: updateTodoDto,
    });
  }

  async remove(userId: number, id: number) {
    await this.assertTodoExists(userId, id);

    return this.prisma.todo.delete({
      where: { id },
    });
  }

  private async assertTodoExists(userId: number, id: number): Promise<void> {
    const todo = await this.prisma.todo.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!todo) {
      throw new NotFoundException(`Todo ${id} not found`);
    }
  }
}
