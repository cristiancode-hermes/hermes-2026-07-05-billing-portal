import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';
import { Plan } from '../entities/plan.entity';
import { Customer } from '../entities/customer.entity';
import { Subscription } from '../entities/subscription.entity';
import { Invoice } from '../entities/invoice.entity';
import { InvoiceItem } from '../entities/invoice-item.entity';
import { Payment } from '../entities/payment.entity';
import { Settings } from '../entities/settings.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      User,
      Plan,
      Customer,
      Subscription,
      Invoice,
      InvoiceItem,
      Payment,
      Settings,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
