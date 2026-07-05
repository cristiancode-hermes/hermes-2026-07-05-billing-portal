import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthModule } from './auth/auth.module';
import { PlansModule } from './plans/plans.module';
import { CustomersModule } from './customers/customers.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { InvoicesModule } from './invoices/invoices.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SettingsModule } from './settings/settings.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: 'better-sqlite3',
        database: config.get<string>('DATABASE_PATH', 'data/billing.sqlite'),
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev-secret'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    PlansModule,
    CustomersModule,
    SubscriptionsModule,
    InvoicesModule,
    DashboardModule,
    SettingsModule,
    SeedModule,
  ],
  providers: [
    { provide: APP_PIPE, useValue: new ValidationPipe({ whitelist: true, transform: true }) },
  ],
})
export class AppModule {}
