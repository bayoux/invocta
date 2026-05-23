import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Debtor, DebtorStatus } from '../debtors/entities/debtor.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotificationChannel,
  NotificationType,
} from '../notifications/entities/notification.entity';

// DPD trigger rules: day → message template
const DPD_TRIGGERS: {
  dpd: number;
  channel: NotificationChannel;
  type: NotificationType;
  template: (d: Debtor) => string;
}[] = [
  {
    dpd: 1,
    channel: NotificationChannel.WHATSAPP,
    type: NotificationType.REMINDER,
    template: (d) =>
      `Уважаемый(ая) ${d.firstName}! Напоминаем, что по договору ${d.contractNumber} образовалась задолженность ${Number(d.totalDebt).toLocaleString('ru')} сом. Пожалуйста, оплатите в ближайшее время.`,
  },
  {
    dpd: 7,
    channel: NotificationChannel.WHATSAPP,
    type: NotificationType.REMINDER,
    template: (d) =>
      `${d.firstName}, задолженность по договору ${d.contractNumber} составляет ${Number(d.totalDebt).toLocaleString('ru')} сом (${d.dpd} дней просрочки). Просим срочно погасить долг или связаться с нами.`,
  },
  {
    dpd: 15,
    channel: NotificationChannel.SMS,
    type: NotificationType.REMINDER,
    template: (d) =>
      `ВАЖНО! Долг ${Number(d.totalDebt).toLocaleString('ru')} сом по договору ${d.contractNumber}. Просрочка ${d.dpd} дней. Свяжитесь с нами немедленно.`,
  },
  {
    dpd: 30,
    channel: NotificationChannel.SMS,
    type: NotificationType.REMINDER,
    template: (d) =>
      `${d.firstName}, критическая просрочка ${d.dpd} дней по договору ${d.contractNumber}. Долг ${Number(d.totalDebt).toLocaleString('ru')} сом. Дело может быть передано в суд.`,
  },
];

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(Debtor)
    private readonly debtorRepository: Repository<Debtor>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ── Recalculate DPD every day at 00:01 ──────────────────────────────────
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async recalculateDpd() {
    this.logger.log('⏰ Starting daily DPD recalculation...');

    const debtors = await this.debtorRepository.find({
      where: [{ status: DebtorStatus.ACTIVE }, { status: DebtorStatus.PTP }],
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let updated = 0;

    for (const debtor of debtors) {
      const due = new Date(debtor.dueDate);
      due.setHours(0, 0, 0, 0);

      const diffMs = today.getTime() - due.getTime();
      const newDpd = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      if (newDpd !== debtor.dpd) {
        debtor.dpd = newDpd;
        await this.debtorRepository.save(debtor);
        updated++;
      }
    }

    this.logger.log(
      `✅ DPD recalculated: ${updated}/${debtors.length} debtors updated`,
    );
  }

  // ── Send auto-notifications at 09:00 based on DPD triggers ─────────────
  @Cron('0 9 * * *') // every day at 09:00
  async sendDpdNotifications() {
    this.logger.log('📤 Starting DPD-based auto-notifications...');

    const triggerDays = DPD_TRIGGERS.map((t) => t.dpd);

    // Find debtors whose DPD matches a trigger day
    const debtors = await this.debtorRepository
      .createQueryBuilder('debtor')
      .where('debtor.dpd IN (:...days)', { days: triggerDays })
      .andWhere('debtor.status IN (:...statuses)', {
        statuses: [DebtorStatus.ACTIVE, DebtorStatus.PTP],
      })
      .andWhere('debtor.whatsappOptOut = false')
      .getMany();

    let sent = 0;
    let failed = 0;

    for (const debtor of debtors) {
      const trigger = DPD_TRIGGERS.find((t) => t.dpd === debtor.dpd);
      if (!trigger) continue;

      // Skip WhatsApp if debtor opted out
      if (
        trigger.channel === NotificationChannel.WHATSAPP &&
        debtor.whatsappOptOut
      ) {
        continue;
      }

      try {
        await this.notificationsService.send({
          debtorId: debtor.id,
          channel: trigger.channel,
          type: trigger.type,
          message: trigger.template(debtor),
        });
        sent++;
      } catch (err) {
        this.logger.warn(
          `Failed to send notification to debtor ${debtor.id}: ${err.message}`,
        );
        failed++;
      }
    }

    this.logger.log(
      `✅ Auto-notifications: ${sent} sent, ${failed} failed out of ${debtors.length} debtors`,
    );
  }

  // ── Manual trigger endpoint (for testing/admin) ─────────────────────────
  async runDpdRecalculationNow(): Promise<{ updated: number; total: number }> {
    const debtors = await this.debtorRepository.find({
      where: [{ status: DebtorStatus.ACTIVE }, { status: DebtorStatus.PTP }],
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let updated = 0;

    for (const debtor of debtors) {
      const due = new Date(debtor.dueDate);
      due.setHours(0, 0, 0, 0);
      const newDpd = Math.max(
        0,
        Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)),
      );
      if (newDpd !== debtor.dpd) {
        debtor.dpd = newDpd;
        await this.debtorRepository.save(debtor);
        updated++;
      }
    }

    return { updated, total: debtors.length };
  }
}
