import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('ADMIN', 'OWNER')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto, @Request() req: any) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('ADMIN', 'OWNER')
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  findMe(@Request() req: { user: { id: number } }) {
    return this.usersService.findOne(req.user.id);
  }

  @Patch('me')
  updateMe(@Request() req: { user: { id: number } }, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateMe(req.user.id, updateUserDto);
  }

  @Get(':id')
  @Roles('ADMIN', 'OWNER')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'OWNER')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req: any) {
    return this.usersService.update(+id, updateUserDto, req.user.role);
  }

  @Patch(':id/role')
  @Roles('ADMIN', 'OWNER')
  updateRole(@Param('id') id: string, @Body() body: { role: string }, @Request() req: any) {
    return this.usersService.updateRole(+id, body.role, req.user.role);
  }

  @Delete(':id')
  @Roles('ADMIN', 'OWNER')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.usersService.remove(+id, req.user.role);
  }
}
