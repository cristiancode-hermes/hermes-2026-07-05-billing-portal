import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
} from './dto/create-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List customers with search and pagination' })
  @ApiQuery({ name: 'search', required: false, type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: 'number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: 'number', example: 10 })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.customersService.findAll(
      user.organizationId,
      search,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.customersService.findOne(user.organizationId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(user.organizationId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a customer' })
  @ApiParam({ name: 'id', type: 'string' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(user.organizationId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a customer' })
  @ApiParam({ name: 'id', type: 'string' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.customersService.remove(user.organizationId, id);
  }
}
