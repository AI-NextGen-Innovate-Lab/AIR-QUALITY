var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
let AuthService = class AuthService {
    prisma;
    jwt;
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    async logAuthActivity(userId, action, success, metadata = {}) {
        try {
            const prisma = this.prisma;
            if (prisma.activityLog && typeof prisma.activityLog.create === 'function') {
                await prisma.activityLog.create({
                    data: {
                        action: `AUTH_${action}`,
                        description: `${action} attempt ${success ? 'succeeded' : 'failed'}`,
                        userId,
                        metadata: {
                            success,
                            timestamp: new Date().toISOString(),
                            ...metadata,
                        },
                    },
                });
            }
        }
        catch (error) {
            console.error('Failed to log auth activity:', error);
        }
    }
    async register(createAuthDto) {
        try {
            const { email, password, name } = createAuthDto;
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
                    role: 'USER',
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                },
            });
            const access_token = this.jwt.sign({
                id: user.id,
                email: user.email,
                role: user.role,
            });
            await this.logAuthActivity(user.id, 'REGISTER', true, { email });
            return {
                user,
                access_token,
            };
        }
        catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.error('Registration error details:', error);
            if (error && typeof error === 'object' && 'code' in error) {
                const prismaError = error;
                if (prismaError.code === 'P2002') {
                    throw new ConflictException('Email already exists');
                }
            }
            throw new BadRequestException(error instanceof Error ? error.message : 'Registration failed');
        }
    }
    async login(email, password) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { email },
            });
            if (!user) {
                console.warn(`AUTH_LOGIN failed for unknown email: ${email}`);
                throw new UnauthorizedException('Invalid credentials');
            }
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                await this.logAuthActivity(user.id, 'LOGIN', false, { email });
                throw new UnauthorizedException('Invalid credentials');
            }
            const access_token = this.jwt.sign({
                id: user.id,
                email: user.email,
                role: user.role,
            });
            const { password: _, ...userWithoutPassword } = user;
            await this.logAuthActivity(user.id, 'LOGIN', true, { email });
            return {
                user: userWithoutPassword,
                access_token,
            };
        }
        catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new BadRequestException('Login failed');
        }
    }
    async validateToken(token) {
        try {
            const decoded = this.jwt.verify(token);
            return decoded;
        }
        catch {
            throw new UnauthorizedException('Invalid token');
        }
    }
    async logout(userId, email) {
        await this.logAuthActivity(userId, 'LOGOUT', true, { email: email ?? null });
        return { ok: true };
    }
    create(createAuthDto) {
        return 'This action adds a new auth';
    }
    findAll() {
        return `This action returns all auth`;
    }
    findOne(id) {
        return `This action returns a #${id} auth`;
    }
    update(id, updateAuthDto) {
        return `This action updates a #${id} auth`;
    }
    remove(id) {
        return `This action removes a #${id} auth`;
    }
};
AuthService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        JwtService])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map