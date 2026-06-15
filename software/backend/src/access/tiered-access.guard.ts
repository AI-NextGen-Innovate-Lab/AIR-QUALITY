import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiKeysService } from '../api-keys/api-keys.service.js';
import { AccessTier } from './tiered-access.types.js';

@Injectable()
export class TieredAccessGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private apiKeysService: ApiKeysService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKeyHeader =
      request.headers['x-api-key'] ?? request.headers['X-API-Key'];

    let tier: AccessTier = 'PUBLIC';
    let apiKeyRecord: { id: number; userId: number } | null = null;

    if (apiKeyHeader && typeof apiKeyHeader === 'string') {
      const validated = await this.apiKeysService.validateKey(apiKeyHeader);
      if (!validated) {
        throw new UnauthorizedException('Invalid or revoked API key');
      }
      tier = 'API_KEY';
      apiKeyRecord = { id: validated.id, userId: validated.userId };
      request.apiKey = validated;
    } else {
      const token = this.extractBearer(request.headers.authorization);
      if (token) {
        try {
          request.user = this.jwt.verify(token);
          tier = 'AUTHENTICATED';
        } catch {
          // Ignore invalid JWT for public tier access.
        }
      }
    }

    request.accessTier = tier;
    request.apiKeyRecord = apiKeyRecord;
    return true;
  }

  private extractBearer(authHeader?: string): string | null {
    if (!authHeader) return null;
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) return null;
    return token;
  }
}
