import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Settings } from '../entities/settings.entity';
import { Organization } from '../entities/organization.entity';

describe('SettingsService', () => {
  let service: SettingsService;

  const mockSettingsRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockOrgRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const orgId = 'org-123';

  const baseSettings: Settings = {
    id: 'sett-1',
    organizationId: orgId,
    currency: 'USD',
    defaultTaxRate: 0,
    updatedAt: new Date(),
    organization: null as any,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: getRepositoryToken(Settings), useValue: mockSettingsRepo },
        { provide: getRepositoryToken(Organization), useValue: mockOrgRepo },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  describe('getSettings', () => {
    it('should return settings with org name if found', async () => {
      mockSettingsRepo.findOne.mockResolvedValueOnce(baseSettings);
      mockOrgRepo.findOne.mockResolvedValueOnce({ id: orgId, name: 'Acme' });

      const result = await service.getSettings(orgId);

      expect(result.currency).toBe('USD');
      expect(result.defaultTaxRate).toBe(0);
      expect(result.orgName).toBe('Acme');
    });

    it('should return defaults when no settings found', async () => {
      mockSettingsRepo.findOne.mockResolvedValueOnce(null);
      mockOrgRepo.findOne.mockResolvedValueOnce({ id: orgId, name: 'Acme' });

      const result = await service.getSettings(orgId);

      expect(result.currency).toBe('USD');
      expect(result.defaultTaxRate).toBe(0);
      expect(result.orgName).toBe('Acme');
    });

    it('should throw NotFoundException when org does not exist', async () => {
      mockOrgRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.getSettings(orgId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSettings', () => {
    it('should update existing settings', async () => {
      const updatedEntity = { ...baseSettings, currency: 'EUR', defaultTaxRate: 10 };
      // updateSettings flow:
      // 1. settingsRepo.findOne → baseSettings (existing)
      // 2. settingsRepo.save → updatedEntity
      // 3. getSettings → orgRepo.findOne → Acme org
      // 4. getSettings → settingsRepo.findOne → updatedEntity
      mockSettingsRepo.findOne
        .mockResolvedValueOnce(baseSettings)
        .mockResolvedValueOnce(updatedEntity);
      mockSettingsRepo.save.mockResolvedValueOnce(updatedEntity);
      mockOrgRepo.findOne
        .mockResolvedValueOnce({ id: orgId, name: 'Acme' });

      const result = await service.updateSettings(orgId, { currency: 'EUR', defaultTaxRate: 10 });

      expect(mockSettingsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ currency: 'EUR', defaultTaxRate: 10 }),
      );
      expect(result.currency).toBe('EUR');
      expect(result.defaultTaxRate).toBe(10);
    });

    it('should create settings if none exist', async () => {
      const newSettings = { ...baseSettings, defaultTaxRate: 5 };
      // updateSettings flow (no orgName):
      // 1. settingsRepo.findOne → null (not found)
      // 2. settingsRepo.create → newSettings
      // 3. settingsRepo.save → newSettings
      // 4. getSettings → orgRepo.findOne → Acme org
      // 5. getSettings → settingsRepo.findOne → newSettings
      mockSettingsRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(newSettings);
      mockSettingsRepo.create.mockReturnValue(newSettings);
      mockSettingsRepo.save.mockResolvedValueOnce(newSettings);
      mockOrgRepo.findOne
        .mockResolvedValueOnce({ id: orgId, name: 'Acme' });

      const result = await service.updateSettings(orgId, { defaultTaxRate: 5 });

      expect(result.defaultTaxRate).toBe(5);
      expect(mockSettingsRepo.create).toHaveBeenCalledWith({ organizationId: orgId });
    });

    it('should update org name when provided', async () => {
      const updatedSettings = { ...baseSettings };
      // updateSettings flow (with orgName):
      // 1. settingsRepo.findOne → baseSettings
      // 2. settingsRepo.save → updatedSettings
      // 3. orgRepo.findOne → Acme org (for orgName update)
      // 4. orgRepo.save → updated org
      // 5. getSettings → orgRepo.findOne → New Name org
      // 6. getSettings → settingsRepo.findOne → updatedSettings
      mockSettingsRepo.findOne
        .mockResolvedValueOnce(baseSettings)
        .mockResolvedValueOnce(updatedSettings);
      mockSettingsRepo.save.mockResolvedValueOnce(baseSettings);
      mockOrgRepo.findOne
        .mockResolvedValueOnce({ id: orgId, name: 'Acme' })  // for orgName update
        .mockResolvedValueOnce({ id: orgId, name: 'New Name' }); // for getSettings
      mockOrgRepo.save.mockResolvedValueOnce({});

      await service.updateSettings(orgId, { orgName: 'New Name' });

      expect(mockOrgRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Name' }),
      );
    });
  });
});
