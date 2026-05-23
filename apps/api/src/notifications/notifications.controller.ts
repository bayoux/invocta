import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Отправить уведомление должнику (SMS или WhatsApp)',
  })
  send(@Body() dto: SendNotificationDto, @Request() req: any) {
    return this.notificationsService.send(dto, req.user?.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'История всех уведомлений' })
  @ApiQuery({
    name: 'debtorId',
    required: false,
    description: 'Фильтр по должнику',
  })
  findAll(@Query('debtorId') debtorId?: string) {
    return this.notificationsService.findAll(debtorId);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Статистика по уведомлениям' })
  getStats() {
    return this.notificationsService.getStats();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Детали уведомления' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.findOne(id);
  }

  @Post('process-pending')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Запустить обработку отложенных уведомлений вручную',
  })
  processPending() {
    return this.notificationsService.processPendingNotifications();
  }
}
