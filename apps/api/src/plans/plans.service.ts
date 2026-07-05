import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from '../entities/plan.entity';
import { Subscription } from '../entities/subscription.entity';
import { CreatePlanDto, UpdatePlanDto } from './dto/create-plan.dto';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  async findAll(organizationId: string) {
    return this.planRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const plan = await this.planRepository.findOne({
      where: { id, organizationId },
    });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async create(organizationId: string, dto: CreatePlanDto) {
    const plan = this.planRepository.create({
      ...dto,
      organizationId,
      isActive: dto.isActive ?? true,
    });
    return this.planRepository.save(plan);
  }

  async update(organizationId: string, id: string, dto: UpdatePlanDto) {
    const plan = await this.findOne(organizationId, id);
    Object.assign(plan, dto);
    return this.planRepository.save(plan);
  }

  async remove(organizationId: string, id: string) {
    const plan = await this.findOne(organizationId, id);

    const activeSubs = await this.subscriptionRepository.count({
      where: { planId: id, status: 'active' },
    });
    if (activeSubs > 0) {
      throw new ConflictException(
        'Cannot delete plan with active subscriptions',
      );
    }

    await this.planRepository.remove(plan);
    return { deleted: true };
  }
}
