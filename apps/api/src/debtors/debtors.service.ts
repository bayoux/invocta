import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Debtor, DebtorStatus } from './entities/debtor.entity';
import { CreateDebtorDto } from './dto/create-debtor.dto';
import { UpdateDebtorDto } from './dto/update-debtor.dto';
import { FilterDebtorsDto } from './dto/filter-debtors.dto';

@Injectable()
export class DebtorsService {
  constructor(
    @InjectRepository(Debtor)
    private readonly debtorRepository: Repository<Debtor>,
  ) {}

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
      relations: ['notifications'],
    });

    if (!debtor) {
      throw new NotFoundException(`Должник с ID ${id} не найден`);
    }

    return debtor;
  }

  async update(id: string, updateDebtorDto: UpdateDebtorDto): Promise<Debtor> {
    const debtor = await this.findOne(id);
    Object.assign(debtor, updateDebtorDto);
    return this.debtorRepository.save(debtor);
  }

  async setPtp(
    id: string,
    ptpDate: string,
    ptpAmount: number,
  ): Promise<Debtor> {
    const debtor = await this.findOne(id);
    debtor.ptpDate = new Date(ptpDate);
    debtor.ptpAmount = ptpAmount;
    debtor.status = DebtorStatus.PTP;
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
