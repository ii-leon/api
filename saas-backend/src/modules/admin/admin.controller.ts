import { Controller, Get, Patch, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('payouts')
  @ApiOperation({ summary: 'Get all payout requests' })
  async getAllPayouts() {
    return this.adminService.getAllPayouts();
  }

  @Patch('payouts/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update payout status' })
  async updatePayout(
    @Param('id') id: string,
    @Body() body: { status: string; adminNotes?: string },
  ) {
    return this.adminService.updatePayoutStatus(id, body.status, body.adminNotes);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  async getAllUsers(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getAllUsers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }
}
