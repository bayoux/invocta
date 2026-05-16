import { PartialType } from '@nestjs/swagger';
import { CreateDebtorDto } from './create-debtor.dto';
import { IsOptional, IsDateString, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateDebtorDto extends PartialType(CreateDebtorDto) {
  @ApiPropertyOptional({
    example: '2024-02-01',
    description: 'Дата обещанной оплаты (PTP)',
  })
  @IsOptional()
  @IsDateString()
  ptpDate?: string;

  @ApiPropertyOptional({ example: 5000, description: 'Сумма обещанной оплаты' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  ptpAmount?: number;
}
