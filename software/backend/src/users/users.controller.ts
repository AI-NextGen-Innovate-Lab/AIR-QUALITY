import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto, @Request() req: any) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.usersService.findAll();
  }

  @Get('audit-logs')
  @Roles('ADMIN')
  getAuditLogs(
    @Query('limit') limit: string,
    @Query('days') days: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Request() req: { user: { role: string } },
  ) {
    return this.usersService.getAuditLogs({
      limit: Number(limit || '100'),
      actorRole: req.user.role,
      days: days ? Number(days) : undefined,
      from: from || undefined,
      to: to || undefined,
    });
  }

  @Get('me')
  findMe(@Request() req: { user: { id: number } }) {
    return this.usersService.findOne(req.user.id);
  }

  @Patch('me')
  updateMe(@Request() req: { user: { id: number } }, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateMe(req.user.id, updateUserDto);
  }

  @Patch('me/password')
  changePassword(
    @Request() req: { user: { id: number } },
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(
      req.user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  @Get(':id')
  @Roles('ADMIN')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req: any) {
    return this.usersService.update(+id, updateUserDto, req.user.role, req.user.id);
  }

  @Patch(':id/role')
  @Roles('ADMIN')
  updateRole(@Param('id') id: string, @Body() body: { role: string }, @Request() req: any) {
    return this.usersService.updateRole(+id, body.role, req.user.role, req.user.id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.usersService.remove(+id, req.user.role, req.user.id);
  }
}
