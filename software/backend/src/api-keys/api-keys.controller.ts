import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service.js';
import { CreateApiKeyRequestDto } from './dto/create-api-key-request.dto.js';
import { RejectApiKeyRequestDto } from './dto/reject-api-key-request.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { ApiKeyRequestStatus, ApiKeyStatus } from '../../generated/prisma/client.js';

function parseRequestStatus(status?: string): ApiKeyRequestStatus | undefined {
  if (!status) return undefined;
  if (Object.values(ApiKeyRequestStatus).includes(status as ApiKeyRequestStatus)) {
    return status as ApiKeyRequestStatus;
  }
  return undefined;
}

function parseKeyStatus(status?: string): ApiKeyStatus | undefined {
  if (!status) return undefined;
  if (Object.values(ApiKeyStatus).includes(status as ApiKeyStatus)) {
    return status as ApiKeyStatus;
  }
  return undefined;
}

@Controller('api-keys')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post('requests')
  @HttpCode(HttpStatus.CREATED)
  createRequest(
    @Request() req: { user: { id: number } },
    @Body() dto: CreateApiKeyRequestDto,
  ) {
    return this.apiKeysService.createRequest(req.user.id, dto.purpose);
  }

  @Get('requests/mine')
  getMyRequests(@Request() req: { user: { id: number } }) {
    return this.apiKeysService.getMyRequests(req.user.id);
  }

  @Get('requests')
  @Roles('ADMIN', 'OWNER')
  getRequests(@Query('status') status?: string) {
    if (status === 'PENDING') {
      return this.apiKeysService.getPendingRequests();
    }
    return this.apiKeysService.getAllRequests(parseRequestStatus(status));
  }

  @Post('requests/:id/approve')
  @Roles('ADMIN', 'OWNER')
  approveRequest(
    @Param('id') id: string,
    @Request() req: { user: { id: number } },
  ) {
    return this.apiKeysService.approveRequest(+id, req.user.id);
  }

  @Post('requests/:id/reject')
  @Roles('ADMIN', 'OWNER')
  rejectRequest(
    @Param('id') id: string,
    @Request() req: { user: { id: number } },
    @Body() dto: RejectApiKeyRequestDto,
  ) {
    return this.apiKeysService.rejectRequest(+id, req.user.id, dto.reviewNote);
  }

  @Get('mine')
  getMyKeys(@Request() req: { user: { id: number } }) {
    return this.apiKeysService.getMyKeys(req.user.id);
  }

  @Get()
  @Roles('ADMIN', 'OWNER')
  getAllKeys(@Query('status') status?: string) {
    return this.apiKeysService.getAllKeys(parseKeyStatus(status));
  }

  @Post(':id/revoke')
  revokeKey(
    @Param('id') id: string,
    @Request() req: { user: { id: number; role: string } },
  ) {
    return this.apiKeysService.revokeKey(+id, req.user.id, req.user.role);
  }

  @Delete(':id')
  deleteKey(
    @Param('id') id: string,
    @Request() req: { user: { id: number; role: string } },
  ) {
    return this.apiKeysService.revokeKey(+id, req.user.id, req.user.role);
  }
}
