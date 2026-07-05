import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { Invoice } from '../entities/invoice.entity';
import { InvoiceItem } from '../entities/invoice-item.entity';
import { Payment } from '../entities/payment.entity';
import { Customer } from '../entities/customer.entity';
import { Settings } from '../entities/settings.entity';

describe('InvoicesService', () => {
  let service: InvoicesService;

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

  const mockPaymentRepo = {
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

  const mockSettingsRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const orgId = 'org-123';
  const invoiceId = 'inv-456';

  const baseInvoice: Invoice = {
    id: invoiceId,
    organizationId: orgId,
    customerId: 'cust-789',
    subscriptionId: null,
    invoiceNumber: 'INV-001',
    status: 'draft',
    subtotal: 100,
    tax: 10,
    total: 110,
    issueDate: '2026-01-01',
    dueDate: '2026-01-31',
    paidAt: null,
    sentAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    customer: null as any,
    subscription: null,
    organization: null as any,
    items: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        {
          provide: getRepositoryToken(Invoice),
          useValue: mockInvoiceRepo,
        },
        {
          provide: getRepositoryToken(InvoiceItem),
          useValue: mockInvoiceItemRepo,
        },
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepo,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepo,
        },
        {
          provide: getRepositoryToken(Settings),
          useValue: mockSettingsRepo,
        },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  // ---------------------------------------------------------------
  // send() — draft → sent
  // ---------------------------------------------------------------
  describe('send', () => {
    it('should send a draft invoice (draft → sent)', async () => {
      const draftInvoice = { ...baseInvoice, status: 'draft' };
      mockInvoiceRepo.findOne.mockResolvedValueOnce(draftInvoice);
      mockInvoiceRepo.save.mockResolvedValueOnce({
        ...draftInvoice,
        status: 'sent',
        sentAt: expect.any(Date),
      });

      const result = await service.send(orgId, invoiceId);

      expect(mockInvoiceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'sent',
          sentAt: expect.any(Date),
        }),
      );
      expect(result.status).toBe('sent');
    });

    it('should throw BadRequestException when sending a non-draft invoice', async () => {
      const sentInvoice = { ...baseInvoice, status: 'sent' };
      mockInvoiceRepo.findOne.mockResolvedValueOnce(sentInvoice);

      await expect(service.send(orgId, invoiceId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when invoice does not exist', async () => {
      mockInvoiceRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.send(orgId, invoiceId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------
  // pay() — sent → paid, overdue → paid
  // ---------------------------------------------------------------
  describe('pay', () => {
    it('should pay a sent invoice (sent → paid)', async () => {
      const sentInvoice = {
        ...baseInvoice,
        status: 'sent',
        sentAt: new Date('2026-01-15'),
      };
      mockInvoiceRepo.findOne.mockResolvedValueOnce(sentInvoice);
      mockPaymentRepo.create.mockReturnValue({ id: 'pay-001' });
      mockPaymentRepo.save.mockResolvedValueOnce({ id: 'pay-001' });
      mockInvoiceRepo.save.mockResolvedValueOnce({
        ...sentInvoice,
        status: 'paid',
        paidAt: expect.any(Date),
      });

      const result = await service.pay(orgId, invoiceId, {
        method: 'transfer',
        amount: 110,
      });

      expect(mockPaymentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceId: invoiceId,
          method: 'transfer',
          amount: 110,
        }),
      );
      expect(mockInvoiceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'paid' }),
      );
      expect(result.status).toBe('paid');
    });

    it('should pay an overdue invoice (overdue → paid)', async () => {
      const overdueInvoice = {
        ...baseInvoice,
        status: 'overdue',
        sentAt: new Date('2026-01-15'),
      };
      mockInvoiceRepo.findOne.mockResolvedValueOnce(overdueInvoice);
      mockPaymentRepo.create.mockReturnValue({ id: 'pay-002' });
      mockPaymentRepo.save.mockResolvedValueOnce({ id: 'pay-002' });
      mockInvoiceRepo.save.mockResolvedValueOnce({
        ...overdueInvoice,
        status: 'paid',
        paidAt: expect.any(Date),
      });

      const result = await service.pay(orgId, invoiceId, {
        method: 'card',
        amount: 110,
        reference: 'PAY-REF-002',
      });

      expect(mockPaymentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          reference: 'PAY-REF-002',
        }),
      );
      expect(result.status).toBe('paid');
    });

    it('should throw BadRequestException when paying an already paid invoice', async () => {
      const paidInvoice = {
        ...baseInvoice,
        status: 'paid',
        paidAt: new Date(),
      };
      mockInvoiceRepo.findOne.mockResolvedValueOnce(paidInvoice);

      await expect(
        service.pay(orgId, invoiceId, { method: 'transfer', amount: 110 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when paying a cancelled invoice', async () => {
      const cancelledInvoice = { ...baseInvoice, status: 'cancelled' };
      mockInvoiceRepo.findOne.mockResolvedValueOnce(cancelledInvoice);

      await expect(
        service.pay(orgId, invoiceId, { method: 'transfer', amount: 110 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ---------------------------------------------------------------
  // markOverdue() — sent → overdue
  // ---------------------------------------------------------------
  describe('markOverdue', () => {
    it('should mark a sent invoice as overdue (sent → overdue)', async () => {
      const sentInvoice = {
        ...baseInvoice,
        status: 'sent',
        sentAt: new Date(),
      };
      mockInvoiceRepo.findOne.mockResolvedValueOnce(sentInvoice);
      mockInvoiceRepo.save.mockResolvedValueOnce({
        ...sentInvoice,
        status: 'overdue',
      });

      const result = await service.markOverdue(orgId, invoiceId);

      expect(mockInvoiceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'overdue' }),
      );
      expect(result.status).toBe('overdue');
    });

    it('should throw BadRequestException if invoice is not in "sent" status', async () => {
      const draftInvoice = { ...baseInvoice, status: 'draft' };
      mockInvoiceRepo.findOne.mockResolvedValueOnce(draftInvoice);

      await expect(service.markOverdue(orgId, invoiceId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ---------------------------------------------------------------
  // cancel() — draft → cancelled, sent → cancelled
  // ---------------------------------------------------------------
  describe('cancel', () => {
    it('should cancel a draft invoice (draft → cancelled)', async () => {
      const draftInvoice = { ...baseInvoice, status: 'draft' };
      mockInvoiceRepo.findOne.mockResolvedValueOnce(draftInvoice);
      mockInvoiceRepo.save.mockResolvedValueOnce({
        ...draftInvoice,
        status: 'cancelled',
      });

      const result = await service.cancel(orgId, invoiceId);

      expect(result.status).toBe('cancelled');
    });

    it('should throw BadRequestException when cancelling a paid invoice', async () => {
      const paidInvoice = {
        ...baseInvoice,
        status: 'paid',
        paidAt: new Date(),
      };
      mockInvoiceRepo.findOne.mockResolvedValueOnce(paidInvoice);

      await expect(service.cancel(orgId, invoiceId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when cancelling an already cancelled invoice', async () => {
      const cancelledInvoice = { ...baseInvoice, status: 'cancelled' };
      mockInvoiceRepo.findOne.mockResolvedValueOnce(cancelledInvoice);

      await expect(service.cancel(orgId, invoiceId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ---------------------------------------------------------------
  // findAll / findOne
  // ---------------------------------------------------------------
  describe('findAll', () => {
    it('should return all invoices for an organization', async () => {
      const invoices = [baseInvoice];
      mockInvoiceRepo.find.mockResolvedValueOnce(invoices);

      const result = await service.findAll(orgId);

      expect(mockInvoiceRepo.find).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        relations: { customer: true, items: true },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(invoices);
    });
  });

  describe('findOne', () => {
    it('should return an invoice if found', async () => {
      mockInvoiceRepo.findOne.mockResolvedValueOnce(baseInvoice);

      const result = await service.findOne(orgId, invoiceId);

      expect(result).toEqual(baseInvoice);
    });

    it('should throw NotFoundException if not found', async () => {
      mockInvoiceRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findOne(orgId, invoiceId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
