import { IsOptional, IsString, IsNumber, MinLength, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultTaxRate?: number;

  @ApiPropertyOptional({ example: 'Acme SaaS' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  orgName?: string;
}
