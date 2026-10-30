import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    type?: string;
    startDate?: string;
    endDate?: string;
    categoryId?: number;
    page?: number;
    limit?: number;
  }) {
    const { type, startDate, endDate, categoryId, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (type) where['type'] = type;
    if (categoryId) where['categoryId'] = categoryId;
    if (startDate || endDate) {
      where['date'] = {};
      if (startDate) (where['date'] as Record<string, unknown>)['gte'] = new Date(startDate);
      if (endDate) (where['date'] as Record<string, unknown>)['lte'] = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    return this.prisma.transaction.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  async create(data: {
    amount: number;
    type: string;
    description: string;
    date: string;
    categoryId: number;
  }) {
    return this.prisma.transaction.create({
      data: {
        amount: data.amount,
        type: data.type,
        description: data.description,
        date: new Date(data.date),
        categoryId: data.categoryId,
      },
      include: { category: true },
    });
  }

  async update(
    id: number,
    data: {
      amount?: number;
      type?: string;
      description?: string;
      date?: string;
      categoryId?: number;
    },
  ) {
    const updateData: Record<string, unknown> = {};
    if (data.amount !== undefined) updateData['amount'] = data.amount;
    if (data.type !== undefined) updateData['type'] = data.type;
    if (data.description !== undefined) updateData['description'] = data.description;
    if (data.date !== undefined) updateData['date'] = new Date(data.date);
    if (data.categoryId !== undefined) updateData['categoryId'] = data.categoryId;

    return this.prisma.transaction.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });
  }

  async remove(id: number) {
    return this.prisma.transaction.delete({ where: { id } });
  }

  async getSummary(month?: number, year?: number) {
    const now = new Date();
    const targetMonth = month ?? now.getMonth() + 1;
    const targetYear = year ?? now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      include: { category: true },
    });

    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    // Group by category
    const byCategory = transactions.reduce(
      (acc, t) => {
        const key = t.category.name;
        if (!acc[key]) {
          acc[key] = {
            category: t.category,
            total: 0,
            count: 0,
          };
        }
        acc[key]!.total += t.amount;
        acc[key]!.count += 1;
        return acc;
      },
      {} as Record<string, { category: typeof transactions[0]['category']; total: number; count: number }>,
    );

    // Daily totals for chart
    const dailyTotals = transactions.reduce(
      (acc, t) => {
        const day = t.date.toISOString().split('T')[0]!;
        if (!acc[day]) {
          acc[day] = { date: day, income: 0, expense: 0 };
        }
        if (t.type === 'INCOME') {
          acc[day]!.income += t.amount;
        } else {
          acc[day]!.expense += t.amount;
        }
        return acc;
      },
      {} as Record<string, { date: string; income: number; expense: number }>,
    );

    return {
      totalIncome,
      totalExpense,
      balance,
      transactionCount: transactions.length,
      byCategory: Object.values(byCategory),
      dailyTotals: Object.values(dailyTotals).sort((a, b) => a.date.localeCompare(b.date)),
      month: targetMonth,
      year: targetYear,
    };
  }
}
