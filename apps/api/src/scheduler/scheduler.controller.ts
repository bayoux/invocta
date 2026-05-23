import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SchedulerService } from './scheduler.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('scheduler')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post('dpd/recalculate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Вручную пересчитать DPD для всех активных должников',
  })
  async recalculateDpd() {
    return this.schedulerService.runDpdRecalculationNow();
  }

  @Post('dpd/notify')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Вручную запустить авторассылку по DPD триггерам' })
  async runNotifications() {
    await this.schedulerService.sendDpdNotifications();
    return { message: 'DPD notifications dispatched' };
  }
}
