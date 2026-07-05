import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { Subscription } from '../entities/subscription.entity';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';

describe('DashboardService', () => {
  let service: DashboardService;

  const mockSubscriptionRepo = {
    find: jest.fn(),
    count: jest.fn(),
  };

  const mockInvoiceRepo = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockPaymentRepo = {};

  const orgId = 'org-123';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(Subscription), useValue: mockSubscriptionRepo },
        { provide: getRepositoryToken(Invoice), useValue: mockInvoiceRepo },
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepo },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  describe('getKpis', () => {
    it('should calculate MRR from active monthly subscriptions', async () => {
      const activeSubs = [
        { plan: { price: 100, cycle: 'monthly' } },
        { plan: { price: 200, cycle: 'monthly' } },
      ];
      mockSubscriptionRepo.find.mockResolvedValueOnce(activeSubs);
      mockInvoiceRepo.createQueryBuilder.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValueOnce({ total: '500' }),
      });
      mockSubscriptionRepo.count
        .mockResolvedValueOnce(5)  // total subscriptions
        .mockResolvedValueOnce(2); // cancelled subscriptions

      const result = await service.getKpis(orgId);

      expect(result.mrr).toBe(300); // 100 + 200
      expect(result.totalActiveSubscriptions).toBe(2);
      expect(result.totalRevenue).toBe(500);
      expect(result.churnRate).toBe(40); // (2 / 5) * 100
    });

    it('should normalize yearly plan prices to monthly MRR', async () => {
      const activeSubs = [
        { plan: { price: 1200, cycle: 'yearly' } },  // 1200/12 = 100 MRR
        { plan: { price: 50, cycle: 'monthly' } },
      ];
      mockSubscriptionRepo.find.mockResolvedValueOnce(activeSubs);
      mockInvoiceRepo.createQueryBuilder.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValueOnce({ total: '0' }),
      });
      mockSubscriptionRepo.count
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(0);

      const result = await service.getKpis(orgId);

      expect(result.mrr).toBe(150); // (1200/12) + 50
    });

    it('should return zero MRR when no active subscriptions', async () => {
      mockSubscriptionRepo.find.mockResolvedValueOnce([]);
      mockInvoiceRepo.createQueryBuilder.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValueOnce({ total: '0' }),
      });
      mockSubscriptionRepo.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getKpis(orgId);

      expect(result.mrr).toBe(0);
      expect(result.totalActiveSubscriptions).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.churnRate).toBe(0);
    });

    it('should handle null plan gracefully', async () => {
      const activeSubs = [{ plan: null }];
      mockSubscriptionRepo.find.mockResolvedValueOnce(activeSubs);
      mockInvoiceRepo.createQueryBuilder.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValueOnce({ total: '0' }),
      });
      mockSubscriptionRepo.count
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0);

      const result = await service.getKpis(orgId);

      expect(result.mrr).toBe(0);
    });
  });

  describe('getRevenueChart', () => {
    it('should return 12 months of revenue data', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ revenue: '0' }),
      };
      mockInvoiceRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getRevenueChart(orgId);

      expect(result).toHaveLength(12);
      result.forEach((item) => {
        expect(item).toHaveProperty('month');
        expect(item).toHaveProperty('revenue');
        expect(typeof item.revenue).toBe('number');
      });
    });

    it('should include revenue from paid invoices in a month', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn()
          .mockResolvedValueOnce({ revenue: '1500' })  // one month has revenue
          .mockResolvedValue({ revenue: '0' }),          // rest have none
      };
      mockInvoiceRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getRevenueChart(orgId);

      const monthWithRevenue = result.find((m) => m.revenue > 0);
      expect(monthWithRevenue).toBeDefined();
      expect(monthWithRevenue!.revenue).toBe(1500);
    });
  });

  describe('getOverdueInvoices', () => {
    it('should return overdue invoices with customer relation', async () => {
      const overdueInvoices = [
        { id: 'inv-1', status: 'overdue', customer: { name: 'John' } },
        { id: 'inv-2', status: 'overdue', customer: { name: 'Jane' } },
      ];
      mockInvoiceRepo.find.mockResolvedValueOnce(overdueInvoices);

      const result = await service.getOverdueInvoices(orgId);

      expect(mockInvoiceRepo.find).toHaveBeenCalledWith({
        where: { organizationId: orgId, status: 'overdue' },
        relations: { customer: true },
        order: { dueDate: 'ASC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('inv-1');
    });

    it('should return empty array when no overdue invoices', async () => {
      mockInvoiceRepo.find.mockResolvedValueOnce([]);

      const result = await service.getOverdueInvoices(orgId);

      expect(result).toEqual([]);
    });
  });

  describe('getSubscriptionSummary', () => {
    it('should return active and cancelled counts', async () => {
      mockSubscriptionRepo.count
        .mockResolvedValueOnce(8)  // active
        .mockResolvedValueOnce(3); // cancelled

      const result = await service.getSubscriptionSummary(orgId);

      expect(result).toEqual({ active: 8, cancelled: 3, total: 11 });
    });

    it('should return zero counts when no subscriptions exist', async () => {
      mockSubscriptionRepo.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getSubscriptionSummary(orgId);

      expect(result).toEqual({ active: 0, cancelled: 0, total: 0 });
    });
  });
});
