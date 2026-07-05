import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from '../entities/settings.entity';
import { Organization } from '../entities/organization.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings)
    private settingsRepository: Repository<Settings>,
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
  ) {}

  async getSettings(organizationId: string) {
    const org = await this.orgRepository.findOne({
      where: { id: organizationId },
    });
    if (!org) throw new NotFoundException('Organization not found');

    const settings = await this.settingsRepository.findOne({
      where: { organizationId },
    });

    return {
      organizationId,
      orgName: org.name,
      currency: settings?.currency || 'USD',
      defaultTaxRate: settings?.defaultTaxRate || 0,
      updatedAt: settings?.updatedAt || org.updatedAt,
    };
  }

  async updateSettings(organizationId: string, dto: UpdateSettingsDto) {
    let settings = await this.settingsRepository.findOne({
      where: { organizationId },
    });

    if (!settings) {
      settings = this.settingsRepository.create({ organizationId });
    }

    if (dto.currency !== undefined) settings.currency = dto.currency;
    if (dto.defaultTaxRate !== undefined) settings.defaultTaxRate = dto.defaultTaxRate;

    await this.settingsRepository.save(settings);

    if (dto.orgName) {
      const org = await this.orgRepository.findOne({
        where: { id: organizationId },
      });
      if (org) {
        org.name = dto.orgName;
        await this.orgRepository.save(org);
      }
    }

    return this.getSettings(organizationId);
  }
}
