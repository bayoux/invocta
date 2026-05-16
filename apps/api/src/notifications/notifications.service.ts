import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from './entities/notification.entity';
import { Debtor } from '../debtors/entities/debtor.entity';
import { SendNotificationDto } from './dto/send-notification.dto';
import { Ch2dService } from './ch2d.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(Debtor)
    private readonly debtorRepository: Repository<Debtor>,
    private readonly ch2dService: Ch2dService,
  ) {}

  async send(dto: SendNotificationDto, userId?: string): Promise<Notification> {
    // Найти должника
    const debtor = await this.debtorRepository.findOne({
      where: { id: dto.debtorId },
    });
    if (!debtor) {
      throw new NotFoundException(`Должник с ID ${dto.debtorId} не найден`);
    }

    // Проверить opt-out для WhatsApp
    if (dto.channel === NotificationChannel.WHATSAPP && debtor.whatsappOptOut) {
      throw new BadRequestException(
        'Должник отписался от WhatsApp-уведомлений',
      );
    }

    // Определить номер телефона для отправки
    const targetPhone =
      dto.channel === NotificationChannel.WHATSAPP && debtor.whatsappPhone
        ? debtor.whatsappPhone
        : debtor.phone;

    // Создать запись уведомления
    const notification = this.notificationRepository.create({
      debtorId: dto.debtorId,
      createdById: userId,
      channel: dto.channel,
      type: dto.type || NotificationType.MANUAL,
      message: dto.message,
      status: NotificationStatus.PENDING,
      ...(dto.scheduledAt ? { scheduledAt: new Date(dto.scheduledAt) } : {}),
    });

    await this.notificationRepository.save(notification);

    // Если не запланировано — отправить сразу
    if (!dto.scheduledAt) {
      await this.dispatchNotification(notification, targetPhone);
    }

    return notification;
  }

  async dispatchNotification(
    notification: Notification,
    phone: string,
  ): Promise<void> {
    let result;

    if (notification.channel === NotificationChannel.WHATSAPP) {
      result = await this.ch2dService.sendWhatsApp(phone, notification.message);
    } else {
      result = await this.ch2dService.sendSms(phone, notification.message);
    }

    notification.status = result.success
      ? NotificationStatus.SENT
      : NotificationStatus.FAILED;
    notification.externalId = result.externalId;
    notification.errorMessage = result.errorMessage;
    if (result.success) {
      notification.sentAt = new Date();
    }

    await this.notificationRepository.save(notification);
  }

  async findAll(debtorId?: string): Promise<Notification[]> {
    const where = debtorId ? { debtorId } : {};
    return this.notificationRepository.find({
      where,
      relations: ['debtor', 'createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ['debtor', 'createdBy'],
    });

    if (!notification) {
      throw new NotFoundException(`Уведомление с ID ${id} не найдено`);
    }

    return notification;
  }

  // Статистика для супервайзера
  async getStats() {
    const total = await this.notificationRepository.count();
    const byStatus = await this.notificationRepository
      .createQueryBuilder('n')
      .select('n.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('n.status')
      .getRawMany();

    const byChannel = await this.notificationRepository
      .createQueryBuilder('n')
      .select('n.channel', 'channel')
      .addSelect('COUNT(*)', 'count')
      .groupBy('n.channel')
      .getRawMany();

    const today = await this.notificationRepository
      .createQueryBuilder('n')
      .where('DATE(n.sentAt) = CURRENT_DATE')
      .getCount();

    return { total, byStatus, byChannel, sentToday: today };
  }

  // Автоматическая рассылка по расписанию (вызывается Cron)
  async processPendingNotifications(): Promise<void> {
    const pending = await this.notificationRepository.find({
      where: { status: NotificationStatus.PENDING },
      relations: ['debtor'],
    });

    const now = new Date();
    const toSend = pending.filter(
      (n) => !n.scheduledAt || n.scheduledAt <= now,
    );

    for (const notification of toSend) {
      const phone =
        notification.channel === NotificationChannel.WHATSAPP &&
        notification.debtor?.whatsappPhone
          ? notification.debtor.whatsappPhone
          : notification.debtor?.phone;

      if (phone) {
        await this.dispatchNotification(notification, phone);
      }
    }
  }
}
