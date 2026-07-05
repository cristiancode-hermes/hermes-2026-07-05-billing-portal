import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { Settings } from '../entities/settings.entity';
import { Organization } from '../entities/organization.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Settings, Organization])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
