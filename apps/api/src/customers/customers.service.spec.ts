import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { Customer } from '../entities/customer.entity';

describe('CustomersService', () => {
  let service: CustomersService;

  const mockCustomerRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    findAndCount: jest.fn(),
  };

  const orgId = 'org-123';
  const customerId = 'cust-456';

  const baseCustomer: Customer = {
    id: customerId,
    organizationId: orgId,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1-555-0100',
    company: 'Acme Inc',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: getRepositoryToken(Customer), useValue: mockCustomerRepo },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  describe('findAll', () => {
    it('should return paginated customers without search', async () => {
      const customers = [baseCustomer];
      mockCustomerRepo.findAndCount.mockResolvedValueOnce([customers, 1]);

      const result = await service.findAll(orgId);

      expect(mockCustomerRepo.findAndCount).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({ data: customers, total: 1, page: 1, limit: 10 });
    });

    it('should return paginated customers with search', async () => {
      const customers = [baseCustomer];
      mockCustomerRepo.findAndCount.mockResolvedValueOnce([customers, 1]);

      const result = await service.findAll(orgId, 'John', 2, 5);

      expect(mockCustomerRepo.findAndCount).toHaveBeenCalledWith({
        where: { organizationId: orgId, name: expect.any(Object) },
        order: { createdAt: 'DESC' },
        skip: 5,
        take: 5,
      });
      expect(result).toEqual({ data: customers, total: 1, page: 2, limit: 5 });
    });

    it('should return empty array when no customers match', async () => {
      mockCustomerRepo.findAndCount.mockResolvedValueOnce([[], 0]);

      const result = await service.findAll(orgId, 'NonExistent');

      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 10 });
    });

    it('should use default page and limit when not provided', async () => {
      mockCustomerRepo.findAndCount.mockResolvedValueOnce([[], 0]);

      await service.findAll(orgId);

      expect(mockCustomerRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a customer if found', async () => {
      mockCustomerRepo.findOne.mockResolvedValueOnce(baseCustomer);

      const result = await service.findOne(orgId, customerId);

      expect(mockCustomerRepo.findOne).toHaveBeenCalledWith({
        where: { id: customerId, organizationId: orgId },
      });
      expect(result).toEqual(baseCustomer);
    });

    it('should throw NotFoundException if customer not found', async () => {
      mockCustomerRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findOne(orgId, customerId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and return a new customer', async () => {
      const dto = { name: 'Jane Doe', email: 'jane@example.com', phone: '+1-555-0200', company: 'Corp' };
      const createdCustomer = { ...baseCustomer, name: 'Jane Doe', email: 'jane@example.com' };
      mockCustomerRepo.create.mockReturnValue(createdCustomer);
      mockCustomerRepo.save.mockResolvedValueOnce(createdCustomer);

      const result = await service.create(orgId, dto);

      expect(mockCustomerRepo.create).toHaveBeenCalledWith({
        ...dto,
        organizationId: orgId,
      });
      expect(mockCustomerRepo.save).toHaveBeenCalledWith(createdCustomer);
      expect(result).toEqual(createdCustomer);
    });

    it('should create a customer with minimal fields', async () => {
      const dto = { name: 'Minimal', email: 'minimal@example.com' };
      const minimalCustomer = { ...baseCustomer, name: 'Minimal', email: 'minimal@example.com', phone: undefined, company: undefined };
      mockCustomerRepo.create.mockReturnValue(minimalCustomer);
      mockCustomerRepo.save.mockResolvedValueOnce(minimalCustomer);

      const result = await service.create(orgId, dto);

      expect(result.name).toBe('Minimal');
      expect(result.email).toBe('minimal@example.com');
    });
  });

  describe('update', () => {
    it('should update and return a customer', async () => {
      mockCustomerRepo.findOne.mockResolvedValueOnce(baseCustomer);
      const updatedCustomer = { ...baseCustomer, company: 'New Corp' };
      mockCustomerRepo.save.mockResolvedValueOnce(updatedCustomer);

      const result = await service.update(orgId, customerId, { company: 'New Corp' });

      expect(mockCustomerRepo.findOne).toHaveBeenCalledWith({
        where: { id: customerId, organizationId: orgId },
      });
      expect(result.company).toBe('New Corp');
    });

    it('should throw NotFoundException when updating non-existent customer', async () => {
      mockCustomerRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.update(orgId, customerId, { company: 'New Corp' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a customer', async () => {
      mockCustomerRepo.findOne.mockResolvedValueOnce(baseCustomer);
      mockCustomerRepo.remove.mockResolvedValueOnce(baseCustomer);

      const result = await service.remove(orgId, customerId);

      expect(mockCustomerRepo.remove).toHaveBeenCalledWith(baseCustomer);
      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException when customer does not exist', async () => {
      mockCustomerRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.remove(orgId, customerId)).rejects.toThrow(NotFoundException);
    });
  });
});
