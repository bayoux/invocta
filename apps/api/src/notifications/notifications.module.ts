import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';
import { Debtor } from '../debtors/entities/debtor.entity';
import { Ch2dService } from './ch2d.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, Debtor])],
  controllers: [NotificationsController],
  providers: [NotificationsService, Ch2dService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
