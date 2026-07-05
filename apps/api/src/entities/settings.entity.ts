import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity('settings')
@Index(['organizationId'], { unique: true })
export class Settings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  organizationId: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @Column({ type: 'text', default: 'USD' })
  currency: string;

  @Column({ type: 'real', default: 0 })
  defaultTaxRate: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
