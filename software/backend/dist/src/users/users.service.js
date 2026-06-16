var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, BadRequestException, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async logUserActivity(actorUserId, action, description, metadata = {}) {
        try {
            await this.prisma.activityLog.create({
                data: {
                    action: `USER_${action}`,
                    description,
                    userId: actorUserId,
                    metadata: {
                        timestamp: new Date().toISOString(),
                        ...metadata,
                    },
                },
            });
        }
        catch (error) {
            console.error('Failed to log user activity:', error);
        }
    }
    async create(createUserDto) {
        try {
            const { email, password, name, role = 'USER' } = createUserDto;
            const existingUser = await this.prisma.user.findUnique({
                where: { email },
            });
            if (existingUser) {
                throw new ConflictException('Email already in use');
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await this.prisma.user.create({
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
        }
        catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            throw new BadRequestException(error instanceof Error ? error.message : 'Failed to create user');
        }
    }
    async findAll() {
        try {
            const users = await this.prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                },
                orderBy: { id: 'desc' },
            });
            return users;
        }
        catch (error) {
            throw new BadRequestException(error instanceof Error ? error.message : 'Failed to fetch users');
        }
    }
    async findOne(id) {
        try {
            const user = await this.prisma.user.findUnique({
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
        }
        catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(error instanceof Error ? error.message : 'Failed to fetch user');
        }
    }
    async updateMe(id, updateUserDto) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id },
            });
            if (!user) {
                throw new NotFoundException(`User with ID ${id} not found`);
            }
            const updateData = {};
            if (updateUserDto.name)
                updateData.name = updateUserDto.name;
            if (!Object.keys(updateData).length) {
                return this.findOne(id);
            }
            const updated = await this.prisma.user.update({
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
            await this.logUserActivity(id, 'UPDATE_PROFILE', 'User updated own profile', {
                updatedFields: Object.keys(updateData),
            });
            return updated;
        }
        catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(error instanceof Error ? error.message : 'Failed to update profile');
        }
    }
    async update(id, updateUserDto, currentUserRole, actorUserId) {
        try {
            if (currentUserRole !== 'ADMIN' && currentUserRole !== 'OWNER') {
                throw new ForbiddenException('Only admins can update users');
            }
            const user = await this.prisma.user.findUnique({
                where: { id },
            });
            if (!user) {
                throw new NotFoundException(`User with ID ${id} not found`);
            }
            const updateData = {};
            if (updateUserDto.name)
                updateData.name = updateUserDto.name;
            if (updateUserDto.role)
                updateData.role = updateUserDto.role.toUpperCase();
            if (updateUserDto.password) {
                updateData.password = await bcrypt.hash(updateUserDto.password, 10);
            }
            const updatedUser = await this.prisma.user.update({
                where: { id },
                data: updateData,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                },
            });
            await this.logUserActivity(actorUserId, 'UPDATE', 'Admin updated user', {
                targetUserId: id,
                updatedFields: Object.keys(updateData),
            });
            return updatedUser;
        }
        catch (error) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException) {
                throw error;
            }
            throw new BadRequestException(error instanceof Error ? error.message : 'Failed to update user');
        }
    }
    async updateRole(id, role, currentUserRole, actorUserId) {
        try {
            if (currentUserRole !== 'ADMIN' && currentUserRole !== 'OWNER') {
                throw new ForbiddenException('Only admins can update user roles');
            }
            if (!['USER', 'ADMIN', 'OWNER'].includes(role.toUpperCase())) {
                throw new BadRequestException('Invalid role');
            }
            const user = await this.prisma.user.findUnique({
                where: { id },
            });
            if (!user) {
                throw new NotFoundException(`User with ID ${id} not found`);
            }
            const updatedUser = await this.prisma.user.update({
                where: { id },
                data: { role: role.toUpperCase() },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                },
            });
            await this.logUserActivity(actorUserId, 'UPDATE_ROLE', 'Admin changed user role', {
                targetUserId: id,
                role: role.toUpperCase(),
            });
            return updatedUser;
        }
        catch (error) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(error instanceof Error ? error.message : 'Failed to update user role');
        }
    }
    async remove(id, currentUserRole, actorUserId) {
        try {
            if (currentUserRole !== 'ADMIN' && currentUserRole !== 'OWNER') {
                throw new ForbiddenException('Only admins can delete users');
            }
            const user = await this.prisma.user.findUnique({
                where: { id },
            });
            if (!user) {
                throw new NotFoundException(`User with ID ${id} not found`);
            }
            const deletedUser = await this.prisma.user.delete({
                where: { id },
                select: {
                    id: true,
                    email: true,
                    name: true,
                },
            });
            await this.logUserActivity(actorUserId, 'DELETE', 'Admin deleted user', {
                targetUserId: id,
                targetEmail: deletedUser.email,
            });
            return deletedUser;
        }
        catch (error) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException) {
                throw error;
            }
            throw new BadRequestException(error instanceof Error ? error.message : 'Failed to delete user');
        }
    }
    async getAuditLogs(limit = 100, actorRole) {
        if (actorRole !== 'ADMIN' && actorRole !== 'OWNER') {
            throw new ForbiddenException('Only admins can access audit logs');
        }
        const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
        return this.prisma.activityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: safeLimit,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
    }
};
UsersService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], UsersService);
export { UsersService };
//# sourceMappingURL=users.service.js.map