import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto.js';
import { UpdateAuthDto } from './dto/update-auth.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  private async logAuthActivity(
    userId: number,
    action: string,
    success: boolean,
    metadata: any = {},
  ) {
    try {
      const prisma = this.prisma as any;
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
    } catch (error) {
      console.error('Failed to log auth activity:', error);
    }
  }

  async register(createAuthDto: CreateAuthDto) {
    try {
      const { email, password, name } = createAuthDto;

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
          role: 'USER',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      await this.logAuthActivity(user.id, 'REGISTER', true);

      // Generate tokens
      const access_token = this.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        user,
        access_token,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Registration failed');
    }
  }

  async login(email: string, password: string) {
    try {
      // Find user
      const user = await (this.prisma as any).user.findUnique({
        where: { email },
      });

      if (!user) {
        await this.logAuthActivity(0, 'LOGIN', false, { email });
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        await this.logAuthActivity(user.id, 'LOGIN', false, { email });
        throw new UnauthorizedException('Invalid credentials');
      }

      await this.logAuthActivity(user.id, 'LOGIN', true, { email });

      // Generate tokens
      const access_token = this.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        access_token,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Login failed');
    }
  }

  async validateToken(token: string) {
    try {
      const decoded = this.jwt.verify(token);
      return decoded;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  create(createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
