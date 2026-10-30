import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(type?: string) {
    const where: Record<string, unknown> = {};
    if (type) where['type'] = type;

    return this.prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  async create(data: { name: string; icon: string; color: string; type: string }) {
    return this.prisma.category.create({ data });
  }

  async update(id: number, data: { name?: string; icon?: string; color?: string; type?: string }) {
    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(id: number) {
    return this.prisma.category.delete({ where: { id } });
  }
}
