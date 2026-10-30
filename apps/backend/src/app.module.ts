import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { TransactionModule } from './transaction/transaction.module.js';
import { CategoryModule } from './category/category.module.js';

@Module({
  imports: [PrismaModule, TransactionModule, CategoryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
