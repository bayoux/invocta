import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Debtor, DebtorStatus } from './entities/debtor.entity';
import { DebtorStatusHistory } from './entities/debtor-status-history.entity';
import { CreateDebtorDto } from './dto/create-debtor.dto';
import { UpdateDebtorDto } from './dto/update-debtor.dto';
import { FilterDebtorsDto } from './dto/filter-debtors.dto';

@Injectable()
export class DebtorsService {
  constructor(
    @InjectRepository(Debtor)
    private readonly debtorRepository: Repository<Debtor>,
    @InjectRepository(DebtorStatusHistory)
    private readonly historyRepository: Repository<DebtorStatusHistory>,
  ) {}

  private async writeStatusHistory(
    debtorId: string,
    fromStatus: DebtorStatus | null,
    toStatus: DebtorStatus,
    changedById?: string,
    comment?: string,
  ) {
    const entry = this.historyRepository.create({
      debtorId,
      fromStatus,
      toStatus,
      changedById: changedById ?? null,
      comment: comment ?? null,
    });
    await this.historyRepository.save(entry);
  }

  async create(createDebtorDto: CreateDebtorDto): Promise<Debtor> {
    const existing = await this.debtorRepository.findOne({
      where: { contractNumber: createDebtorDto.contractNumber },
    });

    if (existing) {
      throw new ConflictException(
        `Договор ${createDebtorDto.contractNumber} уже существует в системе`,
      );
    }

    const debtor = this.debtorRepository.create(createDebtorDto);
    return this.debtorRepository.save(debtor);
  }

  async findAll(
    filterDto: FilterDebtorsDto,
  ): Promise<{ data: Debtor[]; total: number; page: number; limit: number }> {
    const { status, dpdMin, dpdMax, search, page = 1, limit = 20 } = filterDto;

    const queryBuilder = this.debtorRepository
      .createQueryBuilder('debtor')
      .orderBy('debtor.dpd', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      queryBuilder.andWhere('debtor.status = :status', { status });
    }

    if (dpdMin !== undefined) {
      queryBuilder.andWhere('debtor.dpd >= :dpdMin', { dpdMin });
    }

    if (dpdMax !== undefined) {
      queryBuilder.andWhere('debtor.dpd <= :dpdMax', { dpdMax });
    }

    if (search) {
      queryBuilder.andWhere(
        '(debtor.firstName ILIKE :search OR debtor.lastName ILIKE :search OR debtor.contractNumber ILIKE :search OR debtor.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Debtor> {
    const debtor = await this.debtorRepository.findOne({
      where: { id },
      relations: ['notifications', 'statusHistory', 'statusHistory.changedBy'],
    });

    if (!debtor) {
      throw new NotFoundException(`Должник с ID ${id} не найден`);
    }

    // Sort history newest first
    if (debtor.statusHistory) {
      debtor.statusHistory.sort(
        (a, b) =>
          new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
      );
    }

    return debtor;
  }

  async getStatusHistory(id: string): Promise<DebtorStatusHistory[]> {
    return this.historyRepository.find({
      where: { debtorId: id },
      relations: ['changedBy'],
      order: { changedAt: 'DESC' },
    });
  }

  async update(
    id: string,
    updateDebtorDto: UpdateDebtorDto,
    userId?: string,
  ): Promise<Debtor> {
    const debtor = await this.findOne(id);
    const prevStatus = debtor.status;
    Object.assign(debtor, updateDebtorDto);

    if (updateDebtorDto.status && updateDebtorDto.status !== prevStatus) {
      await this.writeStatusHistory(
        id,
        prevStatus,
        updateDebtorDto.status,
        userId,
      );
    }

    return this.debtorRepository.save(debtor);
  }

  async setPtp(
    id: string,
    ptpDate: string,
    ptpAmount: number,
    userId?: string,
  ): Promise<Debtor> {
    const debtor = await this.findOne(id);
    const prevStatus = debtor.status;
    debtor.ptpDate = new Date(ptpDate);
    debtor.ptpAmount = ptpAmount;
    debtor.status = DebtorStatus.PTP;

    if (prevStatus !== DebtorStatus.PTP) {
      await this.writeStatusHistory(
        id,
        prevStatus,
        DebtorStatus.PTP,
        userId,
        `PTP установлен на ${ptpDate}, сумма ${ptpAmount}`,
      );
    }

    return this.debtorRepository.save(debtor);
  }

  async remove(id: string): Promise<void> {
    const debtor = await this.findOne(id);
    await this.debtorRepository.remove(debtor);
  }

  // Статистика для супервайзера
  async getStats() {
    const total = await this.debtorRepository.count();
    const byStatus = await this.debtorRepository
      .createQueryBuilder('debtor')
      .select('debtor.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(debtor.totalDebt)', 'totalDebt')
      .groupBy('debtor.status')
      .getRawMany();

    const overdue1to10 = await this.debtorRepository.count({
      where: { dpd: Between(1, 10) },
    });
    const overdue11to30 = await this.debtorRepository.count({
      where: { dpd: Between(11, 30) },
    });

    return {
      total,
      byStatus,
      dpdBuckets: {
        '1-10': overdue1to10,
        '11-30': overdue11to30,
      },
    };
  }

  async exportToExcel(filter: FilterDebtorsDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Должники');

    sheet.columns = [
      { header: 'Фамилия', key: 'lastName', width: 18 },
      { header: 'Имя', key: 'firstName', width: 14 },
      { header: 'Отчество', key: 'middleName', width: 16 },
      { header: 'Телефон', key: 'phone', width: 16 },
      { header: 'Email', key: 'email', width: 24 },
      { header: 'Договор', key: 'contractNumber', width: 18 },
      { header: 'Тип', key: 'contractType', width: 14 },
      { header: 'Общий долг', key: 'totalDebt', width: 14 },
      { header: 'Основной долг', key: 'principalDebt', width: 14 },
      { header: 'Проценты', key: 'interestDebt', width: 14 },
      { header: 'Дата платежа', key: 'dueDate', width: 14 },
      { header: 'DPD', key: 'dpd', width: 8 },
      { header: 'Статус', key: 'status', width: 12 },
      { header: 'PTP дата', key: 'ptpDate', width: 14 },
      { header: 'PTP сумма', key: 'ptpAmount', width: 14 },
    ];

    // Style header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' },
    };

    // Fetch all matching debtors (no pagination)
    const allFilter = { ...filter, page: 1, limit: 9999 };
    const { data } = await this.findAll(allFilter);

    const STATUS_RU: Record<string, string> = {
      active: 'Активен',
      ptp: 'PTP',
      paid: 'Оплачено',
      disputed: 'Спор',
      closed: 'Закрыт',
    };

    data.forEach((d) => {
      sheet.addRow({
        lastName: d.lastName,
        firstName: d.firstName,
        middleName: d.middleName ?? '',
        phone: d.phone,
        email: d.email ?? '',
        contractNumber: d.contractNumber,
        contractType: d.contractType,
        totalDebt: Number(d.totalDebt),
        principalDebt: Number(d.principalDebt),
        interestDebt: Number(d.interestDebt),
        dueDate: d.dueDate
          ? new Date(d.dueDate).toLocaleDateString('ru-RU')
          : '',
        dpd: d.dpd,
        status: STATUS_RU[d.status] ?? d.status,
        ptpDate: d.ptpDate
          ? new Date(d.ptpDate).toLocaleDateString('ru-RU')
          : '',
        ptpAmount: d.ptpAmount ? Number(d.ptpAmount) : '',
      });
    });

    // Alternate row colors
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1 && rowNumber % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
      }
    });

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  // Импорт из массива (например из CSV)
  async bulkCreate(
    debtors: CreateDebtorDto[],
  ): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    for (const dto of debtors) {
      try {
        await this.create(dto);
        created++;
      } catch {
        skipped++;
      }
    }

    return { created, skipped };
  }
}
