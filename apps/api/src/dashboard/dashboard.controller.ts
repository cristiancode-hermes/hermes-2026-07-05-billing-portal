import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'Get KPI data (MRR, active subs, revenue, churn)' })
  getKpis(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getKpis(user.organizationId);
  }

  @Get('revenue-chart')
  @ApiOperation({ summary: 'Get revenue chart data (12 months)' })
  getRevenueChart(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getRevenueChart(user.organizationId);
  }

  @Get('overdue-invoices')
  @ApiOperation({ summary: 'Get overdue invoices' })
  getOverdueInvoices(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getOverdueInvoices(user.organizationId);
  }

  @Get('subscription-summary')
  @ApiOperation({ summary: 'Get subscription summary (active vs cancelled)' })
  getSubscriptionSummary(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getSubscriptionSummary(user.organizationId);
  }
}
