import {
  Controller,
  Get,
  Post,
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
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto, ChangePlanDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all subscriptions' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.subscriptionsService.findAll(user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.subscriptionsService.findOne(user.organizationId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a subscription (auto-generates first invoice)' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.create(user.organizationId, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiParam({ name: 'id', type: 'string' })
  cancel(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.subscriptionsService.cancel(user.organizationId, id);
  }

  @Post(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate a cancelled subscription' })
  @ApiParam({ name: 'id', type: 'string' })
  reactivate(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.subscriptionsService.reactivate(user.organizationId, id);
  }

  @Post(':id/change-plan')
  @ApiOperation({ summary: 'Change plan with proration' })
  @ApiParam({ name: 'id', type: 'string' })
  changePlan(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ChangePlanDto,
  ) {
    return this.subscriptionsService.changePlan(user.organizationId, id, dto);
  }
}
