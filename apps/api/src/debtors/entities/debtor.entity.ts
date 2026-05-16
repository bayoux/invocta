import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Notification } from '../../notifications/entities/notification.entity';

export enum DebtorStatus {
  ACTIVE = 'active', // Активный должник
  PTP = 'ptp', // Обещал заплатить (Promise to Pay)
  PAID = 'paid', // Оплачено
  DISPUTED = 'disputed', // Оспаривает долг
  CLOSED = 'closed', // Закрыто
}

export enum ContractType {
  LOAN = 'loan',
  CREDIT_CARD = 'credit_card',
  INSTALLMENT = 'installment',
}

@Entity('debtors')
export class Debtor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Персональные данные
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  middleName: string;

  @Column({ unique: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  // Данные о долге
  @Column({ unique: true })
  contractNumber: string;

  @Column({
    type: 'enum',
    enum: ContractType,
    default: ContractType.LOAN,
  })
  contractType: ContractType;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalDebt: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  principalDebt: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  interestDebt: number;

  @Column({ type: 'date' })
  dueDate: Date; // Дата последнего платежа

  @Column({ type: 'int', default: 0 })
  dpd: number; // Days Past Due — дней просрочки

  // Статус
  @Column({
    type: 'enum',
    enum: DebtorStatus,
    default: DebtorStatus.ACTIVE,
  })
  status: DebtorStatus;

  // PTP (Promise to Pay)
  @Column({ type: 'date', nullable: true })
  ptpDate: Date; // Дата обещанной оплаты

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  ptpAmount: number; // Сумма обещанной оплаты

  // Мессенджеры
  @Column({ nullable: true })
  whatsappPhone: string; // Может отличаться от основного номера

  @Column({ default: false })
  whatsappOptOut: boolean; // Отписался от WhatsApp-рассылок

  // Комментарий оператора
  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => Notification, (notification) => notification.debtor)
  notifications: Notification[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
