import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';
import { InvoiceItem } from '../entities/invoice-item.entity';
import { Payment } from '../entities/payment.entity';
import { Customer } from '../entities/customer.entity';
import { Settings } from '../entities/settings.entity';
import { CreateInvoiceDto, PayInvoiceDto } from './dto/create-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private invoiceItemRepository: Repository<InvoiceItem>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Settings)
    private settingsRepository: Repository<Settings>,
  ) {}

  async findAll(organizationId: string) {
    return this.invoiceRepository.find({
      where: { organizationId },
      relations: { customer: true, items: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const invoice = await this.invoiceRepository.findOne({
      where: { id, organizationId },
      relations: { customer: true, items: true, subscription: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async create(organizationId: string, dto: CreateInvoiceDto) {
    const customer = await this.customerRepository.findOne({
      where: { id: dto.customerId, organizationId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    let subtotal = 0;
    const itemDtos = dto.items.map((item, index) => {
      const total = item.quantity * item.unitPrice;
      subtotal += total;
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total,
        sortOrder: index,
      };
    });

    const taxRate = dto.taxRate ?? 0;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    const today = new Date();
    const invoiceNumber = `INV-${today.getTime()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const issueDate = dto.issueDate || today.toISOString().split('T')[0];
    const dueDate =
      dto.dueDate ||
      new Date(today.getTime() + 30 * 86400000).toISOString().split('T')[0];

    const invoice = this.invoiceRepository.create({
      organizationId,
      customerId: dto.customerId,
      subscriptionId: dto.subscriptionId || null,
      invoiceNumber,
      status: 'draft',
      subtotal,
      tax,
      total,
      issueDate,
      dueDate,
    });
    const savedInvoice = await this.invoiceRepository.save(invoice);

    const items = this.invoiceItemRepository.create(
      itemDtos.map((itemData) => ({
        ...itemData,
        invoiceId: savedInvoice.id,
      })),
    );
    await this.invoiceItemRepository.save(items);

    return this.invoiceRepository.findOne({
      where: { id: savedInvoice.id },
      relations: { customer: true, items: true },
    });
  }

  async send(organizationId: string, id: string) {
    const invoice = await this.findOne(organizationId, id);
    if (invoice.status !== 'draft') {
      throw new BadRequestException(
        `Cannot send invoice in status "${invoice.status}"`,
      );
    }
    invoice.status = 'sent';
    invoice.sentAt = new Date();
    return this.invoiceRepository.save(invoice);
  }

  async pay(organizationId: string, id: string, dto: PayInvoiceDto) {
    const invoice = await this.findOne(organizationId, id);
    if (invoice.status === 'paid') {
      throw new BadRequestException('Invoice is already paid');
    }
    if (invoice.status === 'cancelled') {
      throw new BadRequestException('Cannot pay a cancelled invoice');
    }

    const paymentDate =
      dto.paymentDate || new Date().toISOString().split('T')[0];

    const payment = this.paymentRepository.create({
      invoiceId: id,
      organizationId,
      method: dto.method,
      amount: dto.amount,
      reference: dto.reference || null,
      paymentDate,
    });
    await this.paymentRepository.save(payment);

    invoice.status = 'paid';
    invoice.paidAt = new Date();
    return this.invoiceRepository.save(invoice);
  }

  async cancel(organizationId: string, id: string) {
    const invoice = await this.findOne(organizationId, id);
    if (invoice.status === 'paid') {
      throw new BadRequestException('Cannot cancel a paid invoice');
    }
    if (invoice.status === 'cancelled') {
      throw new BadRequestException('Invoice is already cancelled');
    }
    invoice.status = 'cancelled';
    return this.invoiceRepository.save(invoice);
  }

  async markOverdue(organizationId: string, id: string) {
    const invoice = await this.findOne(organizationId, id);
    if (invoice.status !== 'sent') {
      throw new BadRequestException(
        `Cannot mark invoice as overdue from status "${invoice.status}"`,
      );
    }
    invoice.status = 'overdue';
    return this.invoiceRepository.save(invoice);
  }
}
