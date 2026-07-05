import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';
import { Settings } from '../entities/settings.entity';
import { RegisterDto, LoginDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Settings)
    private settingsRepository: Repository<Settings>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const org = this.orgRepository.create({
      name: dto.organizationName,
      email: dto.email,
    });
    const savedOrg = await this.orgRepository.save(org);

    const defaultSettings = this.settingsRepository.create({
      organizationId: savedOrg.id,
      currency: 'USD',
      defaultTaxRate: 0,
    });
    await this.settingsRepository.save(defaultSettings);

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      organizationId: savedOrg.id,
      email: dto.email,
      passwordHash,
      name: dto.name,
      role: 'admin',
    });
    const savedUser = await this.userRepository.save(user);

    const token = this.jwtService.sign({
      userId: savedUser.id,
      organizationId: savedOrg.id,
      email: savedUser.email,
      role: savedUser.role,
    });

    return {
      token,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        name: savedUser.name,
        role: savedUser.role,
        organizationId: savedOrg.id,
      },
      organization: {
        id: savedOrg.id,
        name: savedOrg.name,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const org = await this.orgRepository.findOne({
      where: { id: user.organizationId },
    });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: org?.name,
    };
  }
}
