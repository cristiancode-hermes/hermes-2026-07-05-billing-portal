import { IsString, IsNumber, IsOptional, IsBoolean, MinLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty({ example: 'Basic' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'Basic plan with core features' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 29.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 'monthly', enum: ['monthly', 'yearly'] })
  @IsString()
  cycle: string;

  @ApiPropertyOptional({ example: ['Feature 1', 'Feature 2'] })
  @IsOptional()
  features?: Record<string, any>;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePlanDto {
  @ApiPropertyOptional({ example: 'Basic' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'Basic plan with core features' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 29.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 'monthly', enum: ['monthly', 'yearly'] })
  @IsOptional()
  @IsString()
  cycle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  features?: Record<string, any>;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
