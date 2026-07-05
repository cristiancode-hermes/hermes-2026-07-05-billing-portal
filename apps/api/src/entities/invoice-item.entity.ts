import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  invoiceId: string;

  @ManyToOne(() => Invoice, { onDelete: 'CASCADE' })
  invoice: Invoice;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'real' })
  unitPrice: number;

  @Column({ type: 'real' })
  total: number;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;
}
