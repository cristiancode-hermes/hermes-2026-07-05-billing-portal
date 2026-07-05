import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get organization settings' })
  getSettings(@CurrentUser() user: JwtPayload) {
    return this.settingsService.getSettings(user.organizationId);
  }

  @Put()
  @ApiOperation({ summary: 'Update organization settings' })
  updateSettings(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.settingsService.updateSettings(user.organizationId, dto);
  }
}
