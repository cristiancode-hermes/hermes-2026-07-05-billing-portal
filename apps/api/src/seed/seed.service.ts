import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';
import { Plan } from '../entities/plan.entity';
import { Customer } from '../entities/customer.entity';
import { Subscription } from '../entities/subscription.entity';
import { Invoice } from '../entities/invoice.entity';
import { InvoiceItem } from '../entities/invoice-item.entity';
import { Payment } from '../entities/payment.entity';
import { Settings } from '../entities/settings.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private invoiceItemRepository: Repository<InvoiceItem>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Settings)
    private settingsRepository: Repository<Settings>,
  ) {}

  async onModuleInit() {
    const orgCount = await this.orgRepository.count();
    if (orgCount > 0) {
      this.logger.log('Database already seeded, skipping...');
      return;
    }

    this.logger.log('Seeding database with demo data...');

    // 1. Create Organization
    const org = this.orgRepository.create({
      name: 'Acme SaaS',
      email: 'admin@acme.com',
    });
    const savedOrg = await this.orgRepository.save(org);

    // 2. Create Users
    const passwordHash = await bcrypt.hash('password123', 10);
    const adminUser = this.userRepository.create({
      organizationId: savedOrg.id,
      email: 'admin@acme.com',
      passwordHash,
      name: 'Admin User',
      role: 'admin',
    });
    const viewerUser = this.userRepository.create({
      organizationId: savedOrg.id,
      email: 'viewer@acme.com',
      passwordHash,
      name: 'Viewer User',
      role: 'viewer',
    });
    const savedUsers = await this.userRepository.save([adminUser, viewerUser]);

    // 3. Create Plans
    const basicPlan = this.planRepository.create({
      organizationId: savedOrg.id,
      name: 'Basic',
      description: 'Basic plan with core features for small teams',
      price: 29,
      cycle: 'monthly',
      features: {
        features: [
          'Up to 5 users',
          'Basic analytics',
          'Email support',
          '1GB storage',
        ],
      },
      isActive: true,
    });
    const proPlan = this.planRepository.create({
      organizationId: savedOrg.id,
      name: 'Pro',
      description: 'Professional plan for growing businesses',
      price: 99,
      cycle: 'monthly',
      features: {
        features: [
          'Up to 25 users',
          'Advanced analytics',
          'Priority support',
          '10GB storage',
          'API access',
          'Custom integrations',
        ],
      },
      isActive: true,
    });
    const enterprisePlan = this.planRepository.create({
      organizationId: savedOrg.id,
      name: 'Enterprise',
      description: 'Enterprise plan with full features and dedicated support',
      price: 299,
      cycle: 'monthly',
      features: {
        features: [
          'Unlimited users',
          'Full analytics suite',
          'Dedicated support',
          'Unlimited storage',
          'API access',
          'Custom integrations',
          'SLA guarantee',
          'On-premise option',
        ],
      },
      isActive: true,
    });
    const savedPlans = await this.planRepository.save([
      basicPlan,
      proPlan,
      enterprisePlan,
    ]);

    // 4. Create Customers
    const customerInputs = [
      {
        name: 'John Smith',
        email: 'john@example.com',
        phone: '+1-555-0101',
        company: 'Tech Corp',
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        phone: '+1-555-0102',
        company: 'Design Studio',
      },
      {
        name: 'Mike Chen',
        email: 'mike@example.com',
        phone: '+1-555-0103',
        company: 'Chen Consulting',
      },
      {
        name: 'Emily Davis',
        email: 'emily@example.com',
        phone: '+1-555-0104',
        company: 'Davis Enterprises',
      },
      {
        name: 'Alex Wilson',
        email: 'alex@example.com',
        phone: '+1-555-0105',
        company: 'Wilson & Co',
      },
    ];
    const savedCustomers = await this.customerRepository.save(
      customerInputs.map((c) =>
        this.customerRepository.create({ ...c, organizationId: savedOrg.id }),
      ),
    );

    // 5. Create Subscriptions (8 total, mix active/cancelled)
    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const subInputs = [
      {
        customerIdx: 0,
        planIdx: 1,
        status: 'active',
        startDate: threeMonthsAgo,
      },
      { customerIdx: 1, planIdx: 0, status: 'active', startDate: twoMonthsAgo },
      {
        customerIdx: 2,
        planIdx: 2,
        status: 'active',
        startDate: threeMonthsAgo,
      },
      { customerIdx: 3, planIdx: 1, status: 'active', startDate: oneMonthAgo },
      {
        customerIdx: 0,
        planIdx: 0,
        status: 'cancelled',
        startDate: new Date(today.getTime() - 180 * 86400000),
        cancelledAt: twoMonthsAgo,
      },
      {
        customerIdx: 4,
        planIdx: 0,
        status: 'active',
        startDate: threeMonthsAgo,
      },
      {
        customerIdx: 1,
        planIdx: 1,
        status: 'cancelled',
        startDate: new Date(today.getTime() - 150 * 86400000),
        cancelledAt: oneMonthAgo,
      },
      { customerIdx: 2, planIdx: 1, status: 'active', startDate: twoMonthsAgo },
    ];

    const savedSubscriptions: Subscription[] = [];
    for (const si of subInputs) {
      const customer = savedCustomers[si.customerIdx];
      const plan = savedPlans[si.planIdx];
      const startStr = si.startDate.toISOString().split('T')[0];
      const endDate = new Date(si.startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      const endStr = endDate.toISOString().split('T')[0];

      const sub = this.subscriptionRepository.create({
        organizationId: savedOrg.id,
        customerId: customer.id,
        planId: plan.id,
        status: si.status,
        startDate: startStr,
        endDate:
          si.status === 'cancelled'
            ? (si.cancelledAt || si.startDate).toISOString().split('T')[0]
            : endStr,
        cancelledAt: si.cancelledAt || null,
      });
      const saved = await this.subscriptionRepository.save(sub);
      savedSubscriptions.push(saved);
    }

    // 6. Create Invoices (14 with items in various statuses)
    const invoiceInputs = [
      { customerIdx: 0, subIdx: 0, status: 'paid', daysAgo: 85, amount: 99 },
      { customerIdx: 1, subIdx: 1, status: 'paid', daysAgo: 55, amount: 29 },
      { customerIdx: 2, subIdx: 2, status: 'paid', daysAgo: 80, amount: 299 },
      { customerIdx: 3, subIdx: 3, status: 'sent', daysAgo: 20, amount: 99 },
      { customerIdx: 0, subIdx: 0, status: 'paid', daysAgo: 55, amount: 99 },
      { customerIdx: 4, subIdx: 5, status: 'paid', daysAgo: 82, amount: 29 },
      { customerIdx: 0, subIdx: 0, status: 'paid', daysAgo: 25, amount: 99 },
      { customerIdx: 1, subIdx: 1, status: 'sent', daysAgo: 10, amount: 29 },
      {
        customerIdx: 2,
        subIdx: 2,
        status: 'overdue',
        daysAgo: 45,
        amount: 299,
      },
      { customerIdx: 3, subIdx: 3, status: 'draft', daysAgo: 5, amount: 99 },
      { customerIdx: 4, subIdx: 5, status: 'paid', daysAgo: 50, amount: 29 },
      {
        customerIdx: 0,
        subIdx: null,
        status: 'draft',
        daysAgo: 2,
        amount: 150,
      },
      {
        customerIdx: 1,
        subIdx: null,
        status: 'cancelled',
        daysAgo: 30,
        amount: 50,
      },
      {
        customerIdx: 2,
        subIdx: null,
        status: 'overdue',
        daysAgo: 60,
        amount: 200,
      },
    ];

    const savedInvoices: Invoice[] = [];
    for (const ii of invoiceInputs) {
      const customer = savedCustomers[ii.customerIdx];
      const invDate = new Date(today);
      invDate.setDate(invDate.getDate() - ii.daysAgo);

      const dueDate = new Date(invDate);
      dueDate.setDate(dueDate.getDate() + 30);

      const invoiceNumber = `INV-DEMO-${invDate.getTime()}`;
      const tax = Math.round(ii.amount * 0.1 * 100) / 100;
      const total = ii.amount + tax;

      const invoice = this.invoiceRepository.create({
        organizationId: savedOrg.id,
        customerId: customer.id,
        subscriptionId:
          ii.subIdx !== null ? savedSubscriptions[ii.subIdx].id : null,
        invoiceNumber,
        status: ii.status,
        subtotal: ii.amount,
        tax,
        total,
        issueDate: invDate.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        paidAt:
          ii.status === 'paid' ? new Date(invDate.getTime() + 86400000) : null,
        sentAt: ['sent', 'paid', 'overdue'].includes(ii.status)
          ? invDate
          : null,
      });
      const savedInvoice = await this.invoiceRepository.save(invoice);
      savedInvoices.push(savedInvoice);

      // Add invoice item
      const item = this.invoiceItemRepository.create({
        invoiceId: savedInvoice.id,
        description:
          ii.subIdx !== null
            ? `Subscription - ${savedSubscriptions[ii.subIdx].id.substring(0, 8)}...`
            : 'Consulting services',
        quantity: 1,
        unitPrice: ii.amount,
        total: ii.amount,
        sortOrder: 0,
      });
      await this.invoiceItemRepository.save(item);
    }

    // 7. Create Payments (3)
    const paymentInputs = [
      {
        invoiceIdx: 0,
        method: 'transfer',
        amount: 108.9,
        ref: 'TRF-001',
        daysAgo: 84,
      },
      {
        invoiceIdx: 1,
        method: 'card',
        amount: 31.9,
        ref: 'CARD-001',
        daysAgo: 54,
      },
      { invoiceIdx: 4, method: 'cash', amount: 108.9, ref: null, daysAgo: 54 },
    ];

    for (const pi of paymentInputs) {
      const paymentDate = new Date(today);
      paymentDate.setDate(paymentDate.getDate() - pi.daysAgo);

      const payment = this.paymentRepository.create({
        invoiceId: savedInvoices[pi.invoiceIdx].id,
        organizationId: savedOrg.id,
        method: pi.method,
        amount: pi.amount,
        reference: pi.ref,
        paymentDate: paymentDate.toISOString().split('T')[0],
      });
      await this.paymentRepository.save(payment);
    }

    // 8. Create Settings
    const settings = this.settingsRepository.create({
      organizationId: savedOrg.id,
      currency: 'USD',
      defaultTaxRate: 10,
    });
    await this.settingsRepository.save(settings);

    this.logger.log(
      `Seeded: 1 org, ${savedUsers.length} users, ${savedPlans.length} plans, ${savedCustomers.length} customers, ${savedSubscriptions.length} subscriptions, ${savedInvoices.length} invoices, 3 payments, 1 settings`,
    );
  }
}
