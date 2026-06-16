import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { ApiKeyRequestStatus, ApiKeyStatus } from '../../generated/prisma/client.js';

const KEY_PREFIX_LABEL = 'aqm_';
const KEY_RANDOM_BYTES = 24;
const KEY_EXPIRY_DAYS = 90;

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  private async logActivity(
    userId: number,
    action: string,
    description: string,
    metadata: Record<string, unknown> = {},
  ) {
    try {
      await this.prisma.activityLog.create({
        data: {
          action: `API_KEY_${action}`,
          description,
          userId,
          metadata: {
            timestamp: new Date().toISOString(),
            ...metadata,
          },
        },
      });
    } catch (error) {
      console.error('Failed to log API key activity:', error);
    }
  }

  private generateRawKey() {
    const random = randomBytes(KEY_RANDOM_BYTES).toString('base64url');
    return `${KEY_PREFIX_LABEL}${random}`;
  }

  private displayPrefix(rawKey: string) {
    return rawKey.slice(0, 12);
  }

  async createRequest(userId: number, purpose: string) {
    const pending = await this.prisma.apiKeyRequest.findFirst({
      where: { userId, status: ApiKeyRequestStatus.PENDING },
    });

    if (pending) {
      throw new BadRequestException('You already have a pending API access request');
    }

    const request = await this.prisma.apiKeyRequest.create({
      data: { userId, purpose },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await this.logActivity(userId, 'REQUEST', 'API access requested', {
      requestId: request.id,
      purpose,
    });

    return request;
  }

  async getMyRequests(userId: number) {
    return this.prisma.apiKeyRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        apiKey: {
          select: {
            id: true,
            keyPrefix: true,
            status: true,
            createdAt: true,
            lastUsedAt: true,
            expiresAt: true,
          },
        },
      },
    });
  }

  async getPendingRequests() {
    return this.prisma.apiKeyRequest.findMany({
      where: { status: ApiKeyRequestStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  async getAllRequests(status?: ApiKeyRequestStatus) {
    const where = status ? { status } : {};
    return this.prisma.apiKeyRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        apiKey: {
          select: {
            id: true,
            keyPrefix: true,
            status: true,
            createdAt: true,
            lastUsedAt: true,
          },
        },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async approveRequest(requestId: number, reviewerId: number) {
    const request = await this.prisma.apiKeyRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== ApiKeyRequestStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }

    const rawKey = this.generateRawKey();
    const keyPrefix = this.displayPrefix(rawKey);
    const keyHash = await bcrypt.hash(rawKey, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + KEY_EXPIRY_DAYS);

    const [updatedRequest, apiKey] = await this.prisma.$transaction(async (tx) => {
      const approved = await tx.apiKeyRequest.update({
        where: { id: requestId },
        data: {
          status: ApiKeyRequestStatus.APPROVED,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        },
      });

      const key = await tx.apiKey.create({
        data: {
          userId: request.userId,
          requestId: request.id,
          keyPrefix,
          keyHash,
          label: request.purpose.slice(0, 80),
          expiresAt,
        },
      });

      return [approved, key];
    });

    await this.logActivity(reviewerId, 'APPROVE', 'API access request approved', {
      requestId,
      userId: request.userId,
      apiKeyId: apiKey.id,
    });

    await this.logActivity(request.userId, 'ISSUED', 'API key issued', {
      requestId,
      apiKeyId: apiKey.id,
      keyPrefix,
    });

    return {
      request: updatedRequest,
      apiKey: {
        id: apiKey.id,
        keyPrefix: apiKey.keyPrefix,
        status: apiKey.status,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      },
      key: rawKey,
    };
  }

  async rejectRequest(requestId: number, reviewerId: number, reviewNote?: string) {
    const request = await this.prisma.apiKeyRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== ApiKeyRequestStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }

    const updated = await this.prisma.apiKeyRequest.update({
      where: { id: requestId },
      data: {
        status: ApiKeyRequestStatus.REJECTED,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNote: reviewNote ?? null,
      },
    });

    await this.logActivity(reviewerId, 'REJECT', 'API access request rejected', {
      requestId,
      userId: request.userId,
      reviewNote,
    });

    return updated;
  }

  async getMyKeys(userId: number) {
    return this.prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        keyPrefix: true,
        label: true,
        status: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
        revokedAt: true,
      },
    });
  }

  async getAllKeys(status?: ApiKeyStatus) {
    const where = status ? { status } : {};
    return this.prisma.apiKey.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  async revokeKey(keyId: number, actorId: number, actorRole: string) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id: keyId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    const isAdmin = actorRole === 'ADMIN';
    if (!isAdmin) {
      throw new ForbiddenException('Only administrators can revoke API keys');
    }

    if (apiKey.status === ApiKeyStatus.REVOKED) {
      throw new BadRequestException('API key is already revoked');
    }

    const updated = await this.prisma.apiKey.update({
      where: { id: keyId },
      data: {
        status: ApiKeyStatus.REVOKED,
        revokedAt: new Date(),
        revokedBy: actorId,
      },
    });

    await this.logActivity(actorId, 'REVOKE', 'API key revoked', {
      apiKeyId: keyId,
      ownerId: apiKey.userId,
    });

    return updated;
  }

  async validateKey(rawKey: string) {
    if (!rawKey.startsWith(KEY_PREFIX_LABEL)) {
      return null;
    }

    const keyPrefix = this.displayPrefix(rawKey);
    const candidates = await this.prisma.apiKey.findMany({
      where: { keyPrefix, status: ApiKeyStatus.ACTIVE },
    });

    for (const candidate of candidates) {
      const match = await bcrypt.compare(rawKey, candidate.keyHash);
      if (!match) continue;

      if (candidate.expiresAt && candidate.expiresAt < new Date()) {
        await this.prisma.apiKey.update({
          where: { id: candidate.id },
          data: { status: ApiKeyStatus.EXPIRED },
        });
        return null;
      }

      await this.prisma.apiKey.update({
        where: { id: candidate.id },
        data: { lastUsedAt: new Date() },
      });

      return candidate;
    }

    return null;
  }
}
