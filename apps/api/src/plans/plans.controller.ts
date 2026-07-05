import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/create-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('plans')
export class PlansController {
  constructor(private plansService: PlansService) {}

  @Get()
  @ApiOperation({ summary: 'List all plans' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.plansService.findAll(user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plan by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.plansService.findOne(user.organizationId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new plan' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePlanDto) {
    return this.plansService.create(user.organizationId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a plan' })
  @ApiParam({ name: 'id', type: 'string' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.plansService.update(user.organizationId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a plan (blocks if active subscriptions)' })
  @ApiParam({ name: 'id', type: 'string' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.plansService.remove(user.organizationId, id);
  }
}
