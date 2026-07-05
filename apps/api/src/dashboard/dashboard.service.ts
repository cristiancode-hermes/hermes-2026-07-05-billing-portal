import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async getKpis(organizationId: string) {
    const activeSubs = await this.subscriptionRepository.find({
      where: { organizationId, status: 'active' },
      relations: { plan: true },
    });

    const mrr = activeSubs.reduce((sum, sub) => {
      if (sub.plan?.cycle === 'yearly') {
        return sum + (sub.plan.price || 0) / 12;
      }
      return sum + (sub.plan?.price || 0);
    }, 0);

    const totalActiveSubscriptions = activeSubs.length;

    const revenueResult = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('COALESCE(SUM(invoice.total), 0)', 'total')
      .where('invoice.organizationId = :orgId', { orgId: organizationId })
      .andWhere('invoice.status = :status', { status: 'paid' })
      .getRawOne();
    const totalRevenue = parseFloat(revenueResult?.total || '0');

    const totalSubs = await this.subscriptionRepository.count({
      where: { organizationId },
    });
    const cancelledSubs = await this.subscriptionRepository.count({
      where: { organizationId, status: 'cancelled' },
    });

    const churnRate = totalSubs > 0 ? (cancelledSubs / totalSubs) * 100 : 0;

    return {
      mrr: Math.round(mrr * 100) / 100,
      totalActiveSubscriptions,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      churnRate: Math.round(churnRate * 100) / 100,
      totalSubscriptions: totalSubs,
      cancelledSubscriptions: cancelledSubs,
    };
  }

  async getRevenueChart(organizationId: string) {
    const months: { month: string; revenue: number }[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const monthStr = `${year}-${month.toString().padStart(2, '0')}`;

      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const result = await this.invoiceRepository
        .createQueryBuilder('invoice')
        .select('COALESCE(SUM(invoice.total), 0)', 'revenue')
        .where('invoice.organizationId = :orgId', { orgId: organizationId })
        .andWhere('invoice.status = :status', { status: 'paid' })
        .andWhere('invoice.paidAt >= :start', { start: startDate })
        .andWhere('invoice.paidAt <= :end', { end: endDate + 'T23:59:59' })
        .getRawOne();

      const revenue = parseFloat(result?.revenue || '0');
      months.push({
        month: monthStr,
        revenue: Math.round(revenue * 100) / 100,
      });
    }

    return months;
  }

  async getOverdueInvoices(organizationId: string) {
    return this.invoiceRepository.find({
      where: { organizationId, status: 'overdue' },
      relations: { customer: true },
      order: { dueDate: 'ASC' },
    });
  }

  async getSubscriptionSummary(organizationId: string) {
    const active = await this.subscriptionRepository.count({
      where: { organizationId, status: 'active' },
    });
    const cancelled = await this.subscriptionRepository.count({
      where: { organizationId, status: 'cancelled' },
    });
    return { active, cancelled, total: active + cancelled };
  }
}
