import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { TransactionModule } from './transaction/transaction.module.js';
import { CategoryModule } from './category/category.module.js';

@Module({
  imports: [PrismaModule, TransactionModule, CategoryModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
