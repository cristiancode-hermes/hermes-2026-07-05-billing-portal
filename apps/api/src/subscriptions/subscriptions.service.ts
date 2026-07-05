import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { Plan } from '../entities/plan.entity';
import { Customer } from '../entities/customer.entity';
import { Invoice } from '../entities/invoice.entity';
import { InvoiceItem } from '../entities/invoice-item.entity';
import { Settings } from '../entities/settings.entity';
import {
  CreateSubscriptionDto,
  ChangePlanDto,
} from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private invoiceItemRepository: Repository<InvoiceItem>,
    @InjectRepository(Settings)
    private settingsRepository: Repository<Settings>,
  ) {}

  async findAll(organizationId: string) {
    return this.subscriptionRepository.find({
      where: { organizationId },
      relations: { customer: true, plan: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const sub = await this.subscriptionRepository.findOne({
      where: { id, organizationId },
      relations: { customer: true, plan: true },
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    return sub;
  }

  async create(organizationId: string, dto: CreateSubscriptionDto) {
    const customer = await this.customerRepository.findOne({
      where: { id: dto.customerId, organizationId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const plan = await this.planRepository.findOne({
      where: { id: dto.planId, organizationId },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let endDate: string | null = null;
    if (plan.cycle === 'monthly') {
      const end = new Date(now);
      end.setMonth(end.getMonth() + 1);
      endDate = end.toISOString().split('T')[0];
    } else {
      const end = new Date(now);
      end.setFullYear(end.getFullYear() + 1);
      endDate = end.toISOString().split('T')[0];
    }

    const sub = this.subscriptionRepository.create({
      organizationId,
      customerId: dto.customerId,
      planId: dto.planId,
      status: 'active',
      startDate: todayStr,
      endDate,
    });
    const savedSub = await this.subscriptionRepository.save(sub);

    // Generate first invoice (draft)
    await this.generateInvoice(
      organizationId,
      dto.customerId,
      savedSub.id,
      plan,
    );

    return this.subscriptionRepository.findOne({
      where: { id: savedSub.id },
      relations: { customer: true, plan: true },
    });
  }

  async cancel(organizationId: string, id: string) {
    const sub = await this.findOne(organizationId, id);
    if (sub.status === 'cancelled') {
      throw new BadRequestException('Subscription is already cancelled');
    }
    sub.status = 'cancelled';
    sub.cancelledAt = new Date();
    sub.endDate = new Date().toISOString().split('T')[0];
    return this.subscriptionRepository.save(sub);
  }

  async reactivate(organizationId: string, id: string) {
    const sub = await this.findOne(organizationId, id);
    if (sub.status === 'active') {
      throw new BadRequestException('Subscription is already active');
    }

    const plan = await this.planRepository.findOne({
      where: { id: sub.planId, organizationId },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const now = new Date();
    let endDate: string;
    if (plan.cycle === 'monthly') {
      const end = new Date(now);
      end.setMonth(end.getMonth() + 1);
      endDate = end.toISOString().split('T')[0];
    } else {
      const end = new Date(now);
      end.setFullYear(end.getFullYear() + 1);
      endDate = end.toISOString().split('T')[0];
    }

    sub.status = 'active';
    sub.startDate = now.toISOString().split('T')[0];
    sub.endDate = endDate;
    sub.cancelledAt = null;
    return this.subscriptionRepository.save(sub);
  }

  async changePlan(organizationId: string, id: string, dto: ChangePlanDto) {
    const sub = await this.findOne(organizationId, id);
    if (sub.status !== 'active') {
      throw new BadRequestException(
        'Cannot change plan on a cancelled subscription',
      );
    }

    const currentPlan = await this.planRepository.findOne({
      where: { id: sub.planId, organizationId },
    });
    if (!currentPlan) throw new NotFoundException('Current plan not found');

    const newPlan = await this.planRepository.findOne({
      where: { id: dto.newPlanId, organizationId },
    });
    if (!newPlan) throw new NotFoundException('New plan not found');

    if (currentPlan.id === newPlan.id) {
      throw new BadRequestException(
        'New plan must be different from current plan',
      );
    }

    // Proration logic
    const today = new Date();
    const startDate = new Date(sub.startDate);
    const endDateDate = sub.endDate ? new Date(sub.endDate) : new Date();

    const daysInPeriod = Math.round(
      (endDateDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const daysElapsed = Math.round(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const remainingDays = Math.max(0, daysInPeriod - daysElapsed);

    const credit = (currentPlan.price / daysInPeriod) * remainingDays;
    const newPeriodCharge = (newPlan.price / daysInPeriod) * remainingDays;
    const adjustment = newPeriodCharge - credit;

    // Update subscription with new plan
    sub.planId = newPlan.id;
    await this.subscriptionRepository.save(sub);

    // Create adjustment invoice if adjustment !== 0
    if (Math.abs(adjustment) > 0.001) {
      await this.createAdjustmentInvoice(
        organizationId,
        sub.customerId,
        sub.id,
        adjustment,
        currentPlan,
        newPlan,
      );
    }

    return this.subscriptionRepository.findOne({
      where: { id: sub.id },
      relations: { customer: true, plan: true },
    });
  }

  private async generateInvoice(
    organizationId: string,
    customerId: string,
    subscriptionId: string,
    plan: Plan,
  ) {
    const settings = await this.settingsRepository.findOne({
      where: { organizationId },
    });
    const taxRate = settings?.defaultTaxRate || 0;

    const today = new Date();
    const invoiceNumber = `INV-${today.getTime()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const issueDate = today.toISOString().split('T')[0];
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 30);

    const subtotal = plan.price;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    const invoice = this.invoiceRepository.create({
      organizationId,
      customerId,
      subscriptionId,
      invoiceNumber,
      status: 'draft',
      subtotal,
      tax,
      total,
      issueDate,
      dueDate: dueDate.toISOString().split('T')[0],
    });
    const savedInvoice = await this.invoiceRepository.save(invoice);

    const item = this.invoiceItemRepository.create({
      invoiceId: savedInvoice.id,
      description: `${plan.name} - ${plan.cycle === 'monthly' ? 'Monthly' : 'Yearly'} subscription`,
      quantity: 1,
      unitPrice: plan.price,
      total: plan.price,
      sortOrder: 0,
    });
    await this.invoiceItemRepository.save(item);

    return savedInvoice;
  }

  private async createAdjustmentInvoice(
    organizationId: string,
    customerId: string,
    subscriptionId: string,
    adjustment: number,
    currentPlan: Plan,
    newPlan: Plan,
  ) {
    const today = new Date();
    const invoiceNumber = `ADJ-${today.getTime()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const issueDate = today.toISOString().split('T')[0];

    const invoice = this.invoiceRepository.create({
      organizationId,
      customerId,
      subscriptionId,
      invoiceNumber,
      status: 'draft',
      subtotal: Math.abs(adjustment),
      tax: 0,
      total: Math.abs(adjustment),
      issueDate,
    });
    const savedInvoice = await this.invoiceRepository.save(invoice);

    const description =
      adjustment > 0
        ? `Prorated charge: Plan change from ${currentPlan.name} to ${newPlan.name}`
        : `Prorated credit: Plan change from ${currentPlan.name} to ${newPlan.name}`;

    const item = this.invoiceItemRepository.create({
      invoiceId: savedInvoice.id,
      description,
      quantity: 1,
      unitPrice: Math.abs(adjustment),
      total: Math.abs(adjustment),
      sortOrder: 0,
    });
    await this.invoiceItemRepository.save(item);

    return savedInvoice;
  }
}
