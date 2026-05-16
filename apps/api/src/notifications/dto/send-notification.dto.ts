import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  NotificationChannel,
  NotificationType,
} from '../entities/notification.entity';

export class SendNotificationDto {
  @ApiProperty({ description: 'ID должника' })
  @IsUUID()
  debtorId: string;

  @ApiProperty({
    enum: NotificationChannel,
    description: 'Канал отправки: sms или whatsapp',
  })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiPropertyOptional({
    enum: NotificationType,
    default: NotificationType.MANUAL,
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiProperty({
    example:
      'Уважаемый Иван, у вас задолженность 15 000 сом. Пожалуйста, оплатите.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'Запланировать отправку на определённое время',
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
