import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
  Request,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { DebtorsService } from './debtors.service';
import { CreateDebtorDto } from './dto/create-debtor.dto';
import { UpdateDebtorDto } from './dto/update-debtor.dto';
import { FilterDebtorsDto } from './dto/filter-debtors.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('debtors')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('debtors')
export class DebtorsController {
  constructor(private readonly debtorsService: DebtorsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Добавить должника' })
  @ApiResponse({ status: 201, description: 'Должник добавлен' })
  create(@Body() createDebtorDto: CreateDebtorDto) {
    return this.debtorsService.create(createDebtorDto);
  }

  @Post('bulk')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Массовая загрузка должников (из CSV/Excel)' })
  bulkCreate(@Body() debtors: CreateDebtorDto[]) {
    return this.debtorsService.bulkCreate(debtors);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Список должников с фильтрацией и пагинацией' })
  findAll(@Query() filterDto: FilterDebtorsDto) {
    return this.debtorsService.findAll(filterDto);
  }

  @Get('export/excel')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Экспорт должников в Excel (.xlsx)' })
  async exportExcel(
    @Query() filterDto: FilterDebtorsDto,
    @Res() res: Response,
  ) {
    const buffer = await this.debtorsService.exportToExcel(filterDto);
    const filename = `debtors_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Статистика по должникам' })
  getStats() {
    return this.debtorsService.getStats();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Карточка должника с историей уведомлений' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.debtorsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Обновить данные должника' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDebtorDto: UpdateDebtorDto,
    @Request() req: any,
  ) {
    return this.debtorsService.update(id, updateDebtorDto, req.user?.id);
  }

  @Patch(':id/ptp')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Установить PTP (Promise to Pay)' })
  setPtp(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { ptpDate: string; ptpAmount: number },
    @Request() req: any,
  ) {
    return this.debtorsService.setPtp(
      id,
      body.ptpDate,
      body.ptpAmount,
      req.user?.id,
    );
  }

  @Get(':id/history')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'История изменений статуса должника' })
  getStatusHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.debtorsService.getStatusHistory(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Удалить должника (только Admin)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.debtorsService.remove(id);
  }
}
