import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationStatus,
} from '../notifications/entities/notification.entity';

interface Ch2dWebhookPayload {
  messageId: string; // externalId we stored on send
  status: string; // 'delivered' | 'read' | 'failed'
  timestamp?: string;
  errorCode?: string;
  errorMessage?: string;
}

// Ch2D status → our NotificationStatus
const STATUS_MAP: Record<string, NotificationStatus> = {
  delivered: NotificationStatus.DELIVERED,
  read: NotificationStatus.READ,
  failed: NotificationStatus.FAILED,
};

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly configService: ConfigService,
  ) {}

  @Post('ch2d')
  @ApiOperation({ summary: 'Ch2D delivery status webhook' })
  async handleCh2dWebhook(
    @Body() payload: Ch2dWebhookPayload,
    @Headers('x-ch2d-signature') signature: string,
  ) {
    // Verify webhook secret (skip if not configured — dev mode)
    const secret = this.configService.get<string>('CH2D_WEBHOOK_SECRET');
    if (secret && signature !== secret) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const { messageId, status, errorMessage } = payload;

    this.logger.log(`Ch2D webhook: messageId=${messageId} status=${status}`);

    const mappedStatus = STATUS_MAP[status?.toLowerCase()];
    if (!mappedStatus) {
      this.logger.warn(`Unknown Ch2D status: ${status}`);
      return { received: true };
    }

    // Find notification by externalId
    const notification = await this.notificationRepository.findOne({
      where: { externalId: messageId },
    });

    if (!notification) {
      this.logger.warn(`Notification not found for externalId: ${messageId}`);
      return { received: true };
    }

    notification.status = mappedStatus;
    if (errorMessage) {
      notification.errorMessage = errorMessage;
    }

    await this.notificationRepository.save(notification);

    this.logger.log(
      `Notification ${notification.id} updated to ${mappedStatus}`,
    );

    return { received: true };
  }
}
