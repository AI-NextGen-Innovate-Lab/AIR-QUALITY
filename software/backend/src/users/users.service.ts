import { Injectable, BadRequestException, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const { email, password, name, role = 'USER' } = createUserDto;

      // Check if user already exists
      const existingUser = await (this.prisma as any).user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await (this.prisma as any).user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role.toUpperCase(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      return user;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to create user'
      );
    }
  }

  async findAll() {
    try {
      const users = await (this.prisma as any).user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
        orderBy: { id: 'desc' },
      });
      return users;
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to fetch users'
      );
    }
  }

  async findOne(id: number) {
    try {
      const user = await (this.prisma as any).user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to fetch user'
      );
    }
  }

  async updateMe(id: number, updateUserDto: UpdateUserDto) {
    try {
      const user = await (this.prisma as any).user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      const updateData: { name?: string } = {};
      if (updateUserDto.name) updateData.name = updateUserDto.name;

      if (!Object.keys(updateData).length) {
        return this.findOne(id);
      }

      return await (this.prisma as any).user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to update profile',
      );
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto, currentUserRole: string) {
    try {
      // Only admin/owner can update users
      if (currentUserRole !== 'ADMIN' && currentUserRole !== 'OWNER') {
        throw new ForbiddenException('Only admins can update users');
      }

      // Check if user exists
      const user = await (this.prisma as any).user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      const updateData: any = {};

      // Only allow updating specific fields
      if (updateUserDto.name) updateData.name = updateUserDto.name;
      if (updateUserDto.role) updateData.role = updateUserDto.role.toUpperCase();

      // If updating password, hash it
      if (updateUserDto.password) {
        updateData.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      const updatedUser = await (this.prisma as any).user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to update user'
      );
    }
  }

  async updateRole(id: number, role: string, currentUserRole: string) {
    try {
      // Only admin/owner can update roles
      if (currentUserRole !== 'ADMIN' && currentUserRole !== 'OWNER') {
        throw new ForbiddenException('Only admins can update user roles');
      }

      if (!['USER', 'ADMIN', 'OWNER'].includes(role.toUpperCase())) {
        throw new BadRequestException('Invalid role');
      }

      // Check if user exists
      const user = await (this.prisma as any).user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      const updatedUser = await (this.prisma as any).user.update({
        where: { id },
        data: { role: role.toUpperCase() },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to update user role'
      );
    }
  }

  async remove(id: number, currentUserRole: string) {
    try {
      // Only admin/owner can delete users
      if (currentUserRole !== 'ADMIN' && currentUserRole !== 'OWNER') {
        throw new ForbiddenException('Only admins can delete users');
      }

      // Check if user exists
      const user = await (this.prisma as any).user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      const deletedUser = await (this.prisma as any).user.delete({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      return deletedUser;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to delete user'
      );
    }
  }
}
