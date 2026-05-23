import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Debtor, DebtorStatus } from './debtor.entity';
import { User } from '../../users/entities/user.entity';

@Entity('debtor_status_history')
export class DebtorStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Debtor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'debtorId' })
  debtor: Debtor;

  @Column({ type: 'varchar' })
  debtorId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  fromStatus: DebtorStatus | null;

  @Column({ type: 'varchar', length: 50 })
  toStatus: DebtorStatus;

  @Column({ type: 'varchar', nullable: true })
  comment: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'changedById' })
  changedBy: User;

  @Column({ type: 'varchar', nullable: true })
  changedById: string | null;

  @CreateDateColumn()
  changedAt: Date;
}
