import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';
import { Settings } from '../entities/settings.entity';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockOrgRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockSettingsRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Organization),
          useValue: mockOrgRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(Settings),
          useValue: mockSettingsRepo,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  // ---------------------------------------------------------------
  // register()
  // ---------------------------------------------------------------
  describe('register', () => {
    const registerDto = {
      organizationName: 'Acme SaaS',
      name: 'Admin User',
      email: 'admin@acme.com',
      password: 'password123',
    };

    const savedOrg = {
      id: 'org-001',
      name: 'Acme SaaS',
      email: 'admin@acme.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const savedSettings = {
      id: 'settings-001',
      organizationId: 'org-001',
      currency: 'USD',
      defaultTaxRate: 0,
      updatedAt: new Date(),
      organization: null as any,
    };

    const savedUser = {
      id: 'user-001',
      organizationId: 'org-001',
      email: 'admin@acme.com',
      passwordHash: 'hashed-password',
      name: 'Admin User',
      role: 'admin',
      createdAt: new Date(),
      organization: null as any,
    };

    const expectedToken = 'jwt-token-abc123';

    it('should create organization, settings, user and return token + user + org', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(null); // no existing user
      mockOrgRepo.create.mockReturnValue(savedOrg);
      mockOrgRepo.save.mockResolvedValueOnce(savedOrg);
      mockSettingsRepo.create.mockReturnValue(savedSettings);
      mockSettingsRepo.save.mockResolvedValueOnce(savedSettings);
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed-password');
      mockUserRepo.create.mockReturnValue(savedUser);
      mockUserRepo.save.mockResolvedValueOnce(savedUser);
      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = await service.register(registerDto);

      // Verify organization was created with correct data
      expect(mockOrgRepo.create).toHaveBeenCalledWith({
        name: 'Acme SaaS',
        email: 'admin@acme.com',
      });
      expect(mockOrgRepo.save).toHaveBeenCalledWith(savedOrg);

      // Verify settings were created for the organization
      expect(mockSettingsRepo.create).toHaveBeenCalledWith({
        organizationId: 'org-001',
        currency: 'USD',
        defaultTaxRate: 0,
      });
      expect(mockSettingsRepo.save).toHaveBeenCalledWith(savedSettings);

      // Verify password was hashed
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);

      // Verify user was created with correct data
      expect(mockUserRepo.create).toHaveBeenCalledWith({
        organizationId: 'org-001',
        email: 'admin@acme.com',
        passwordHash: 'hashed-password',
        name: 'Admin User',
        role: 'admin',
      });
      expect(mockUserRepo.save).toHaveBeenCalledWith(savedUser);

      // Verify JWT token was signed
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        userId: 'user-001',
        organizationId: 'org-001',
        email: 'admin@acme.com',
        role: 'admin',
      });

      // Verify response structure
      expect(result).toEqual({
        token: expectedToken,
        user: {
          id: 'user-001',
          email: 'admin@acme.com',
          name: 'Admin User',
          role: 'admin',
          organizationId: 'org-001',
        },
        organization: {
          id: 'org-001',
          name: 'Acme SaaS',
        },
      });
    });

    it('should throw ConflictException if email is already registered', async () => {
      mockUserRepo.findOne.mockResolvedValue(savedUser); // existing user

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );

      // No org, settings, or user should be created
      expect(mockOrgRepo.create).not.toHaveBeenCalled();
      expect(mockSettingsRepo.create).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // login()
  // ---------------------------------------------------------------
  describe('login', () => {
    const loginDto = {
      email: 'admin@acme.com',
      password: 'password123',
    };

    const userWithOrg = {
      id: 'user-001',
      organizationId: 'org-001',
      email: 'admin@acme.com',
      passwordHash: 'stored-hash',
      name: 'Admin User',
      role: 'admin',
      createdAt: new Date(),
      organization: null as any,
    };

    const expectedToken = 'jwt-token-xyz789';

    it('should return token and user when credentials are valid', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(userWithOrg);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = await service.login(loginDto);

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'admin@acme.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'stored-hash',
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        userId: 'user-001',
        organizationId: 'org-001',
        email: 'admin@acme.com',
        role: 'admin',
      });

      expect(result).toEqual({
        token: expectedToken,
        user: {
          id: 'user-001',
          email: 'admin@acme.com',
          name: 'Admin User',
          role: 'admin',
          organizationId: 'org-001',
        },
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(userWithOrg);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  // ---------------------------------------------------------------
  // getMe()
  // ---------------------------------------------------------------
  describe('getMe', () => {
    it('should return user info with organization name', async () => {
      const user = {
        id: 'user-001',
        organizationId: 'org-001',
        email: 'admin@acme.com',
        passwordHash: 'hash',
        name: 'Admin User',
        role: 'admin',
        createdAt: new Date(),
        organization: null as any,
      };

      const org = {
        id: 'org-001',
        name: 'Acme SaaS',
        email: 'admin@acme.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepo.findOne.mockResolvedValueOnce(user);
      mockOrgRepo.findOne.mockResolvedValueOnce(org);

      const result = await service.getMe('user-001');

      expect(result).toEqual({
        id: 'user-001',
        email: 'admin@acme.com',
        name: 'Admin User',
        role: 'admin',
        organizationId: 'org-001',
        organizationName: 'Acme SaaS',
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.getMe('non-existent')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
