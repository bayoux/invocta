import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Debtor } from '../../debtors/entities/debtor.entity';
import { User } from '../../users/entities/user.entity';

export enum NotificationChannel {
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
}

export enum NotificationStatus {
  PENDING = 'pending', // Ожидает отправки
  SENT = 'sent', // Отправлено
  DELIVERED = 'delivered', // Доставлено
  READ = 'read', // Прочитано
  FAILED = 'failed', // Ошибка
}

export enum NotificationType {
  REMINDER = 'reminder', // Напоминание о долге
  PTP_REMINDER = 'ptp_reminder', // Напоминание о дате обещания
  PAYMENT_CONFIRM = 'payment_confirm', // Подтверждение платежа
  MANUAL = 'manual', // Ручная отправка оператора
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Debtor, (debtor) => debtor.notifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'debtorId' })
  debtor: Debtor;

  @Column()
  debtorId: string;

  @ManyToOne(() => User, (user) => user.notifications, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ nullable: true })
  createdById: string;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
  })
  channel: NotificationChannel;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.REMINDER,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({ type: 'text' })
  message: string;

  @Column({ nullable: true })
  templateId: string; // ID шаблона в Ch2D

  @Column({ nullable: true })
  externalId: string; // ID сообщения от провайдера (для трекинга)

  @Column({ nullable: true })
  errorMessage: string; // Причина ошибки если статус FAILED

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date; // Запланированное время отправки

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date; // Фактическое время отправки

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
