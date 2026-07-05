import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Invoice } from './invoice.entity';
import { Organization } from './organization.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  invoiceId: string;

  @ManyToOne(() => Invoice)
  invoice: Invoice;

  @Column({ type: 'text' })
  organizationId: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column({ type: 'text', default: 'transfer' })
  method: string;

  @Column({ type: 'real' })
  amount: number;

  @Column({ type: 'text', nullable: true })
  reference: string | null;

  @Column({ type: 'text' })
  paymentDate: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
