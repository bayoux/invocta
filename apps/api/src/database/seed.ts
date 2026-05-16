import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { DebtorsService } from '../debtors/debtors.service';
import { UserRole } from '../users/entities/user.entity';
import { ContractType } from '../debtors/entities/debtor.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const usersService = app.get(UsersService);
  const debtorsService = app.get(DebtorsService);

  console.log('🌱 Seeding database...');

  // Создаём пользователей
  try {
    await usersService.create({
      email: 'admin@company.com',
      firstName: 'Администратор',
      lastName: 'Системы',
      password: 'admin123',
      role: UserRole.ADMIN,
    });
    console.log('✅ Admin user created: admin@company.com / admin123');
  } catch {
    console.log('⚠️  Admin user already exists');
  }

  try {
    await usersService.create({
      email: 'manager@company.com',
      firstName: 'Айгуль',
      lastName: 'Маматова',
      password: 'manager123',
      role: UserRole.MANAGER,
    });
    console.log('✅ Manager user created: manager@company.com / manager123');
  } catch {
    console.log('⚠️  Manager user already exists');
  }

  try {
    await usersService.create({
      email: 'supervisor@company.com',
      firstName: 'Бакыт',
      lastName: 'Асанов',
      password: 'supervisor123',
      role: UserRole.SUPERVISOR,
    });
    console.log('✅ Supervisor user created: supervisor@company.com / supervisor123');
  } catch {
    console.log('⚠️  Supervisor user already exists');
  }

  // Создаём тестовых должников
  const testDebtors = [
    {
      firstName: 'Нурлан',
      lastName: 'Токтосунов',
      phone: '+996700111222',
      contractNumber: 'LOAN-2024-001',
      contractType: ContractType.LOAN,
      totalDebt: 45000,
      principalDebt: 40000,
      interestDebt: 5000,
      dueDate: '2024-01-01',
      dpd: 25,
      whatsappPhone: '+996700111222',
    },
    {
      firstName: 'Гульнара',
      lastName: 'Осмонова',
      phone: '+996555333444',
      contractNumber: 'LOAN-2024-002',
      contractType: ContractType.CREDIT_CARD,
      totalDebt: 12500,
      principalDebt: 10000,
      interestDebt: 2500,
      dueDate: '2024-01-10',
      dpd: 16,
      whatsappPhone: '+996555333444',
    },
    {
      firstName: 'Эрлан',
      lastName: 'Джакыпов',
      phone: '+996770555666',
      contractNumber: 'LOAN-2024-003',
      contractType: ContractType.INSTALLMENT,
      totalDebt: 8000,
      principalDebt: 7500,
      interestDebt: 500,
      dueDate: '2024-01-15',
      dpd: 5,
      whatsappPhone: '+996770555666',
    },
  ];

  for (const debtor of testDebtors) {
    try {
      await debtorsService.create(debtor as any);
      console.log(`✅ Debtor created: ${debtor.firstName} ${debtor.lastName}`);
    } catch {
      console.log(`⚠️  Debtor ${debtor.contractNumber} already exists`);
    }
  }

  console.log('\n🎉 Seed completed!');
  console.log('\nLogin credentials:');
  console.log('  Admin:      admin@company.com / admin123');
  console.log('  Manager:    manager@company.com / manager123');
  console.log('  Supervisor: supervisor@company.com / supervisor123');

  await app.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
