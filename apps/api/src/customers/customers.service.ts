import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  async findAll(
    organizationId: string,
    search?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const where: any = { organizationId };

    if (search) {
      where.name = Like(`%${search}%`);
    }

    const [data, total] = await this.customerRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(organizationId: string, id: string) {
    const customer = await this.customerRepository.findOne({
      where: { id, organizationId },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async create(organizationId: string, dto: CreateCustomerDto) {
    const customer = this.customerRepository.create({
      ...dto,
      organizationId,
    });
    return this.customerRepository.save(customer);
  }

  async update(organizationId: string, id: string, dto: UpdateCustomerDto) {
    const customer = await this.findOne(organizationId, id);
    Object.assign(customer, dto);
    return this.customerRepository.save(customer);
  }

  async remove(organizationId: string, id: string) {
    const customer = await this.findOne(organizationId, id);
    await this.customerRepository.remove(customer);
    return { deleted: true };
  }
}
