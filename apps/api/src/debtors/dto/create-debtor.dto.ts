import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
  IsNumber,
  IsDateString,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ContractType, DebtorStatus } from '../entities/debtor.entity';

export class CreateDebtorDto {
  @ApiProperty({ example: 'Иван' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Иванов' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ example: 'Петрович' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ example: '+996700123456' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: 'ivanov@mail.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'LOAN-2024-001' })
  @IsString()
  @IsNotEmpty()
  contractNumber: string;

  @ApiPropertyOptional({ enum: ContractType, default: ContractType.LOAN })
  @IsOptional()
  @IsEnum(ContractType)
  contractType?: ContractType;

  @ApiProperty({ example: 15000.5, description: 'Общая сумма долга' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  totalDebt: number;

  @ApiPropertyOptional({ example: 12000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  principalDebt?: number;

  @ApiPropertyOptional({ example: 3000.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  interestDebt?: number;

  @ApiProperty({
    example: '2024-01-15',
    description: 'Дата последнего платежа',
  })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ example: 15, description: 'Days Past Due' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  dpd?: number;

  @ApiPropertyOptional({ enum: DebtorStatus, default: DebtorStatus.ACTIVE })
  @IsOptional()
  @IsEnum(DebtorStatus)
  status?: DebtorStatus;

  @ApiPropertyOptional({ example: '+996700123456' })
  @IsOptional()
  @IsString()
  whatsappPhone?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  whatsappOptOut?: boolean;

  @ApiPropertyOptional({ example: 'Клиент обещал позвонить завтра' })
  @IsOptional()
  @IsString()
  notes?: string;
}
