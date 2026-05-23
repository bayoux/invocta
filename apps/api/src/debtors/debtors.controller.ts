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
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
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

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Статистика по должникам (для супервайзера)' })
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
  ) {
    return this.debtorsService.update(id, updateDebtorDto);
  }

  @Patch(':id/ptp')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Установить PTP (Promise to Pay)' })
  setPtp(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { ptpDate: string; ptpAmount: number },
  ) {
    return this.debtorsService.setPtp(id, body.ptpDate, body.ptpAmount);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Удалить должника (только Admin)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.debtorsService.remove(id);
  }
}
