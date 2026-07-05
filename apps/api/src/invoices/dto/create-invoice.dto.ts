import { IsString, IsNumber, IsOptional, MinLength, Min, IsArray, ValidateNested, IsIn, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvoiceItemDto {
  @ApiProperty({ example: 'Consulting services' })
  @IsString()
  @MinLength(2)
  description: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 150.0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ example: 'customer-uuid' })
  @IsString()
  customerId: string;

  @ApiPropertyOptional({ example: 'subscription-uuid' })
  @IsOptional()
  @IsString()
  subscriptionId?: string;

  @ApiProperty({ type: [CreateInvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];

  @ApiPropertyOptional({ example: '2026-07-05' })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({ example: '2026-08-05' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;
}

export class PayInvoiceDto {
  @ApiProperty({ example: 'transfer', enum: ['transfer', 'card', 'cash'] })
  @IsString()
  @IsIn(['transfer', 'card', 'cash'])
  method: string;

  @ApiProperty({ example: 150.0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 'PAY-REF-001' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ example: '2026-07-05' })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;
}
