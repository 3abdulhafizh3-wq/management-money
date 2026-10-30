import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Master categories default
  const incomeCategories = [
    { name: 'Gaji', icon: '💰', color: '#10b981', type: 'INCOME' },
    { name: 'Freelance', icon: '💻', color: '#06b6d4', type: 'INCOME' },
    { name: 'Investasi', icon: '📈', color: '#8b5cf6', type: 'INCOME' },
    { name: 'Bonus', icon: '🎁', color: '#f59e0b', type: 'INCOME' },
    { name: 'Lainnya', icon: '📦', color: '#64748b', type: 'INCOME' },
  ];

  const expenseCategories = [
    { name: 'Makanan', icon: '🍔', color: '#ef4444', type: 'EXPENSE' },
    { name: 'Transportasi', icon: '🚗', color: '#f97316', type: 'EXPENSE' },
    { name: 'Belanja', icon: '🛍️', color: '#ec4899', type: 'EXPENSE' },
    { name: 'Tagihan', icon: '📄', color: '#6366f1', type: 'EXPENSE' },
    { name: 'Hiburan', icon: '🎮', color: '#a855f7', type: 'EXPENSE' },
    { name: 'Kesehatan', icon: '🏥', color: '#14b8a6', type: 'EXPENSE' },
    { name: 'Pendidikan', icon: '📚', color: '#3b82f6', type: 'EXPENSE' },
    { name: 'Lainnya', icon: '📦', color: '#64748b', type: 'EXPENSE' },
  ];

  const existingCount = await prisma.category.count();
  if (existingCount === 0) {
    for (const cat of [...incomeCategories, ...expenseCategories]) {
      await prisma.category.create({ data: cat });
    }
    console.log('Master categories seeded successfully!');
  } else {
    console.log('Categories already exist, skipping category seeding.');
  }

  // Tidak ada dummy transactions (pemasukan/pengeluaran) agar dashboard bersih
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
