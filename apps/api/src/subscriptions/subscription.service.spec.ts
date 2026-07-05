import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription } from '../entities/subscription.entity';
import { Plan } from '../entities/plan.entity';
import { Customer } from '../entities/customer.entity';
import { Invoice } from '../entities/invoice.entity';
import { InvoiceItem } from '../entities/invoice-item.entity';
import { Settings } from '../entities/settings.entity';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;

  const mockSubscriptionRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockPlanRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockCustomerRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockInvoiceRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockInvoiceItemRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockSettingsRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const orgId = 'org-123';
  const subId = 'sub-456';

  const baseSubscription: Subscription = {
    id: subId,
    organizationId: orgId,
    customerId: 'cust-789',
    planId: 'plan-111',
    status: 'active',
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    cancelledAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    customer: null as any,
    plan: null as any,
    organization: null as any,
  };

  const monthlyPlan: Plan = {
    id: 'plan-111',
    organizationId: orgId,
    name: 'Starter',
    description: 'Starter plan',
    price: 100,
    cycle: 'monthly',
    features: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const premiumPlan: Plan = {
    id: 'plan-222',
    organizationId: orgId,
    name: 'Premium',
    description: 'Premium plan',
    price: 200,
    cycle: 'monthly',
    features: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const basicPlan: Plan = {
    id: 'plan-333',
    organizationId: orgId,
    name: 'Basic',
    description: 'Basic plan',
    price: 50,
    cycle: 'monthly',
    features: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionRepo,
        },
        {
          provide: getRepositoryToken(Plan),
          useValue: mockPlanRepo,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepo,
        },
        {
          provide: getRepositoryToken(Invoice),
          useValue: mockInvoiceRepo,
        },
        {
          provide: getRepositoryToken(InvoiceItem),
          useValue: mockInvoiceItemRepo,
        },
        {
          provide: getRepositoryToken(Settings),
          useValue: mockSettingsRepo,
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  // ---------------------------------------------------------------
  // cancel()
  // ---------------------------------------------------------------
  describe('cancel', () => {
    it('should cancel an active subscription (active → cancelled)', async () => {
      const activeSub = { ...baseSubscription, status: 'active' };
      mockSubscriptionRepo.findOne.mockResolvedValueOnce(activeSub);
      mockSubscriptionRepo.save.mockResolvedValueOnce({
        ...activeSub,
        status: 'cancelled',
        cancelledAt: new Date(),
        endDate: expect.any(String),
      });

      const result = await service.cancel(orgId, subId);

      expect(mockSubscriptionRepo.findOne).toHaveBeenCalledWith({
        where: { id: subId, organizationId: orgId },
        relations: { customer: true, plan: true },
      });
      expect(mockSubscriptionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...activeSub,
          status: 'cancelled',
        }),
      );
      expect(result.status).toBe('cancelled');
    });

    it('should throw BadRequestException when cancelling an already cancelled subscription', async () => {
      const cancelledSub = {
        ...baseSubscription,
        status: 'cancelled',
        cancelledAt: new Date(),
      };
      mockSubscriptionRepo.findOne.mockResolvedValue(cancelledSub);

      await expect(service.cancel(orgId, subId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ---------------------------------------------------------------
  // reactivate()
  // ---------------------------------------------------------------
  describe('reactivate', () => {
    it('should reactivate a cancelled subscription (cancelled → active)', async () => {
      const cancelledSub = {
        ...baseSubscription,
        status: 'cancelled',
        cancelledAt: new Date('2026-01-10'),
        endDate: '2026-01-10',
      };
      mockSubscriptionRepo.findOne.mockResolvedValueOnce(cancelledSub);
      mockPlanRepo.findOne.mockResolvedValueOnce(monthlyPlan);
      mockSubscriptionRepo.save.mockResolvedValueOnce({
        ...cancelledSub,
        status: 'active',
        cancelledAt: null,
        startDate: expect.any(String),
        endDate: expect.any(String),
      });

      const result = await service.reactivate(orgId, subId);

      expect(mockPlanRepo.findOne).toHaveBeenCalledWith({
        where: { id: cancelledSub.planId, organizationId: orgId },
      });
      expect(mockSubscriptionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
          cancelledAt: null,
        }),
      );
      expect(result.status).toBe('active');
    });

    it('should throw BadRequestException when reactivating an already active subscription', async () => {
      const activeSub = { ...baseSubscription, status: 'active' };
      mockSubscriptionRepo.findOne.mockResolvedValue(activeSub);

      await expect(service.reactivate(orgId, subId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when plan is not found during reactivation', async () => {
      const cancelledSub = {
        ...baseSubscription,
        status: 'cancelled',
        cancelledAt: new Date(),
      };
      mockSubscriptionRepo.findOne.mockResolvedValueOnce(cancelledSub);
      mockPlanRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.reactivate(orgId, subId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------
  // changePlan() — proration
  // ---------------------------------------------------------------
  describe('changePlan — proration', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should calculate positive adjustment for upgrade and create charge invoice', async () => {
      // Freeze time at mid-cycle: Jan 15 2026
      jest.setSystemTime(new Date('2026-01-15T00:00:00.000Z'));

      // Subscription started Jan 1, ends Jan 31 = 30-day period
      // Day 15 → 14 days elapsed, 16 days remaining
      const activeSub = {
        ...baseSubscription,
        status: 'active',
        planId: monthlyPlan.id,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      };

      mockSubscriptionRepo.findOne.mockResolvedValueOnce(activeSub);
      mockPlanRepo.findOne
        .mockResolvedValueOnce(monthlyPlan) // current plan (100)
        .mockResolvedValueOnce(premiumPlan); // new plan (200)

      mockSubscriptionRepo.save.mockResolvedValueOnce({
        ...activeSub,
        planId: premiumPlan.id,
      });
      // After save, findOne is called again to return the updated sub
      mockSubscriptionRepo.findOne.mockResolvedValueOnce({
        ...activeSub,
        planId: premiumPlan.id,
        plan: premiumPlan,
      });

      // Mock invoice and invoice item creation for the adjustment invoice
      const mockAdjustmentInvoice = { id: 'adj-inv-1', status: 'draft' };
      mockInvoiceRepo.create.mockReturnValue(mockAdjustmentInvoice);
      mockInvoiceRepo.save.mockResolvedValueOnce(mockAdjustmentInvoice);
      mockInvoiceItemRepo.create.mockReturnValue({});
      mockInvoiceItemRepo.save.mockResolvedValueOnce({});

      const result = await service.changePlan(orgId, subId, {
        newPlanId: premiumPlan.id,
      });

      // Proration: 100/30*16 = 53.33 credit, 200/30*16 = 106.67 charge
      // adjustment = 106.67 - 53.33 = 53.33 (positive = charge)
      const expectedCredit = (monthlyPlan.price / 30) * 16;
      const expectedNewCharge = (premiumPlan.price / 30) * 16;
      const expectedAdjustment = expectedNewCharge - expectedCredit;

      // Subscription plan was updated
      expect(mockSubscriptionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ planId: premiumPlan.id }),
      );

      // Adjustment invoice was created with the correct prorated amount
      expect(mockInvoiceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: Math.abs(expectedAdjustment),
          total: Math.abs(expectedAdjustment),
          status: 'draft',
        }),
      );

      expect(mockInvoiceItemRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringContaining('Prorated charge'),
        }),
      );

      expect(result.planId).toBe(premiumPlan.id);
    });

    it('should calculate negative adjustment for downgrade and create credit invoice', async () => {
      jest.setSystemTime(new Date('2026-01-15T00:00:00.000Z'));

      // Going from premium (200) to basic (50)
      const activeSub = {
        ...baseSubscription,
        status: 'active',
        planId: premiumPlan.id,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      };

      mockSubscriptionRepo.findOne.mockResolvedValueOnce(activeSub);
      mockPlanRepo.findOne
        .mockResolvedValueOnce(premiumPlan) // current plan (200)
        .mockResolvedValueOnce(basicPlan); // new plan (50)

      mockSubscriptionRepo.save.mockResolvedValueOnce({
        ...activeSub,
        planId: basicPlan.id,
      });
      mockSubscriptionRepo.findOne.mockResolvedValueOnce({
        ...activeSub,
        planId: basicPlan.id,
        plan: basicPlan,
      });

      const mockCreditInvoice = { id: 'adj-inv-2', status: 'draft' };
      mockInvoiceRepo.create.mockReturnValue(mockCreditInvoice);
      mockInvoiceRepo.save.mockResolvedValueOnce(mockCreditInvoice);
      mockInvoiceItemRepo.create.mockReturnValue({});
      mockInvoiceItemRepo.save.mockResolvedValueOnce({});

      const result = await service.changePlan(orgId, subId, {
        newPlanId: basicPlan.id,
      });

      // Proration: 200/30*16 = 106.67 credit, 50/30*16 = 26.67 charge
      // adjustment = 26.67 - 106.67 = -80.00 (negative = credit)
      const expectedCredit = (premiumPlan.price / 30) * 16;
      const expectedNewCharge = (basicPlan.price / 30) * 16;
      const expectedAdjustment = expectedNewCharge - expectedCredit;

      expect(mockSubscriptionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ planId: basicPlan.id }),
      );

      expect(mockInvoiceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: Math.abs(expectedAdjustment),
          total: Math.abs(expectedAdjustment),
          status: 'draft',
        }),
      );

      expect(mockInvoiceItemRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringContaining('Prorated credit'),
        }),
      );

      expect(result.planId).toBe(basicPlan.id);
    });

    it('should throw when changing to the same plan', async () => {
      const activeSub = {
        ...baseSubscription,
        status: 'active',
        planId: monthlyPlan.id,
      };
      mockSubscriptionRepo.findOne.mockResolvedValueOnce(activeSub);
      mockPlanRepo.findOne
        .mockResolvedValueOnce(monthlyPlan)
        .mockResolvedValueOnce(monthlyPlan);

      await expect(
        service.changePlan(orgId, subId, { newPlanId: monthlyPlan.id }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when subscription is not active', async () => {
      const cancelledSub = {
        ...baseSubscription,
        status: 'cancelled',
      };
      mockSubscriptionRepo.findOne.mockResolvedValueOnce(cancelledSub);

      await expect(
        service.changePlan(orgId, subId, { newPlanId: premiumPlan.id }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ---------------------------------------------------------------
  // findAll / findOne
  // ---------------------------------------------------------------
  describe('findAll', () => {
    it('should return all subscriptions for an organization', async () => {
      const subs = [baseSubscription];
      mockSubscriptionRepo.find.mockResolvedValueOnce(subs);

      const result = await service.findAll(orgId);

      expect(mockSubscriptionRepo.find).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        relations: { customer: true, plan: true },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(subs);
    });
  });

  describe('findOne', () => {
    it('should return a subscription if found', async () => {
      mockSubscriptionRepo.findOne.mockResolvedValueOnce(baseSubscription);

      const result = await service.findOne(orgId, subId);

      expect(result).toEqual(baseSubscription);
    });

    it('should throw NotFoundException if not found', async () => {
      mockSubscriptionRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findOne(orgId, subId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
