import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Organization } from './organization.entity';
import { Customer } from './customer.entity';
import { Plan } from './plan.entity';

@Entity('subscriptions')
export class Subscription {
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

  @Column({ type: 'text' })
  planId: string;

  @ManyToOne(() => Plan)
  plan: Plan;

  @Column({ type: 'text', default: 'active' })
  status: string;

  @Column({ type: 'text' })
  startDate: string;

  @Column({ type: 'text', nullable: true })
  endDate: string | null;

  @Column({ type: 'datetime', nullable: true })
  cancelledAt: Date | null;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
