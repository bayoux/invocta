import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DebtorStatus } from '../entities/debtor.entity';

export class FilterDebtorsDto {
  @ApiPropertyOptional({ enum: DebtorStatus, description: 'Фильтр по статусу' })
  @IsOptional()
  @IsEnum(DebtorStatus)
  status?: DebtorStatus;

  @ApiPropertyOptional({ example: 1, description: 'Минимальный DPD' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  dpdMin?: number;

  @ApiPropertyOptional({ example: 30, description: 'Максимальный DPD' })
  @IsOptional()
  @IsNumber()
  @Max(9999)
  @Type(() => Number)
  dpdMax?: number;

  @ApiPropertyOptional({
    example: 'Иван',
    description: 'Поиск по имени или номеру договора',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, description: 'Страница' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ example: 20, description: 'Размер страницы' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}
