import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'customer-uuid' })
  @IsString()
  customerId: string;

  @ApiProperty({ example: 'plan-uuid' })
  @IsString()
  planId: string;
}

export class ChangePlanDto {
  @ApiProperty({ example: 'new-plan-uuid' })
  @IsString()
  newPlanId: string;
}
