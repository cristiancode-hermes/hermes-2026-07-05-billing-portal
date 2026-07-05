import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Customer } from './customer.entity';
import { Subscription } from './subscription.entity';
import { InvoiceItem } from './invoice-item.entity';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  organizationId: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column({ type: 'text' })
  customerId: string;

  @ManyToOne(() => Customer)
  customer: Customer;

  @Column({ type: 'text', nullable: true })
  subscriptionId: string | null;

  @ManyToOne(() => Subscription, { nullable: true })
  subscription: Subscription | null;

  @Column({ type: 'text', unique: true })
  invoiceNumber: string;

  @Column({ type: 'text', default: 'draft' })
  status: string;

  @Column({ type: 'real' })
  subtotal: number;

  @Column({ type: 'real', nullable: true })
  tax: number | null;

  @Column({ type: 'real' })
  total: number;

  @Column({ type: 'text' })
  issueDate: string;

  @Column({ type: 'text', nullable: true })
  dueDate: string | null;

  @Column({ type: 'datetime', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
  items: InvoiceItem[];
}
