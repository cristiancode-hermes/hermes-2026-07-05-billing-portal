import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PlansService } from './plans.service';
import { Plan } from '../entities/plan.entity';
import { Subscription } from '../entities/subscription.entity';

describe('PlansService', () => {
  let service: PlansService;

  const mockPlanRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockSubscriptionRepo = {
    count: jest.fn(),
  };

  const orgId = 'org-123';
  const planId = 'plan-456';

  const basePlan: Plan = {
    id: planId,
    organizationId: orgId,
    name: 'Pro Plan',
    description: 'Professional plan',
    price: 99,
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
        PlansService,
        { provide: getRepositoryToken(Plan), useValue: mockPlanRepo },
        { provide: getRepositoryToken(Subscription), useValue: mockSubscriptionRepo },
      ],
    }).compile();

    service = module.get<PlansService>(PlansService);
  });

  describe('findAll', () => {
    it('should return all plans for an organization', async () => {
      const plans = [basePlan];
      mockPlanRepo.find.mockResolvedValueOnce(plans);

      const result = await service.findAll(orgId);

      expect(mockPlanRepo.find).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(plans);
    });

    it('should return empty array when no plans exist', async () => {
      mockPlanRepo.find.mockResolvedValueOnce([]);

      const result = await service.findAll(orgId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a plan if found', async () => {
      mockPlanRepo.findOne.mockResolvedValueOnce(basePlan);

      const result = await service.findOne(orgId, planId);

      expect(mockPlanRepo.findOne).toHaveBeenCalledWith({
        where: { id: planId, organizationId: orgId },
      });
      expect(result).toEqual(basePlan);
    });

    it('should throw NotFoundException if plan not found', async () => {
      mockPlanRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findOne(orgId, planId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and return a new plan', async () => {
      const dto = { name: 'Basic', description: 'Basic plan', price: 29, cycle: 'monthly' as const, features: null, isActive: true };
      const createdPlan = { ...basePlan, name: 'Basic', price: 29 };
      mockPlanRepo.create.mockReturnValue(createdPlan);
      mockPlanRepo.save.mockResolvedValueOnce(createdPlan);

      const result = await service.create(orgId, dto);

      expect(mockPlanRepo.create).toHaveBeenCalledWith({
        ...dto,
        organizationId: orgId,
        isActive: true,
      });
      expect(mockPlanRepo.save).toHaveBeenCalledWith(createdPlan);
      expect(result).toEqual(createdPlan);
    });

    it('should default isActive to true when not provided', async () => {
      const dto = { name: 'Basic', description: 'Basic plan', price: 29, cycle: 'monthly' as const, features: null };
      mockPlanRepo.create.mockReturnValue(basePlan);
      mockPlanRepo.save.mockResolvedValueOnce(basePlan);

      await service.create(orgId, dto);

      expect(mockPlanRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true }),
      );
    });
  });

  describe('update', () => {
    it('should update and return a plan', async () => {
      mockPlanRepo.findOne.mockResolvedValueOnce(basePlan);
      const updatedPlan = { ...basePlan, price: 79 };
      mockPlanRepo.save.mockResolvedValueOnce(updatedPlan);

      const result = await service.update(orgId, planId, { price: 79 });

      expect(mockPlanRepo.findOne).toHaveBeenCalledWith({
        where: { id: planId, organizationId: orgId },
      });
      expect(mockPlanRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ price: 79 }),
      );
      expect(result.price).toBe(79);
    });

    it('should throw NotFoundException when updating non-existent plan', async () => {
      mockPlanRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.update(orgId, planId, { price: 79 })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a plan with no active subscriptions', async () => {
      mockPlanRepo.findOne.mockResolvedValueOnce(basePlan);
      mockSubscriptionRepo.count.mockResolvedValueOnce(0);
      mockPlanRepo.remove.mockResolvedValueOnce(basePlan);

      const result = await service.remove(orgId, planId);

      expect(mockPlanRepo.remove).toHaveBeenCalledWith(basePlan);
      expect(result).toEqual({ deleted: true });
    });

    it('should throw ConflictException when plan has active subscriptions', async () => {
      mockPlanRepo.findOne.mockResolvedValueOnce(basePlan);
      mockSubscriptionRepo.count.mockResolvedValueOnce(3);

      await expect(service.remove(orgId, planId)).rejects.toThrow(ConflictException);
      expect(mockPlanRepo.remove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when plan does not exist', async () => {
      mockPlanRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.remove(orgId, planId)).rejects.toThrow(NotFoundException);
    });
  });
});
