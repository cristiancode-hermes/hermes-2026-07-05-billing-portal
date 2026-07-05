import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, PayInvoiceDto } from './dto/create-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'List all invoices' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.invoicesService.findAll(user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.invoicesService.findOne(user.organizationId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a manual invoice with items' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(user.organizationId, dto);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Mark invoice as sent' })
  @ApiParam({ name: 'id', type: 'string' })
  send(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.invoicesService.send(user.organizationId, id);
  }

  @Post(':id/pay')
  @ApiOperation({ summary: 'Record payment for invoice' })
  @ApiParam({ name: 'id', type: 'string' })
  pay(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: PayInvoiceDto,
  ) {
    return this.invoicesService.pay(user.organizationId, id, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an invoice' })
  @ApiParam({ name: 'id', type: 'string' })
  cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.invoicesService.cancel(user.organizationId, id);
  }

  @Post(':id/mark-overdue')
  @ApiOperation({ summary: 'Mark invoice as overdue' })
  @ApiParam({ name: 'id', type: 'string' })
  markOverdue(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.invoicesService.markOverdue(user.organizationId, id);
  }
}
