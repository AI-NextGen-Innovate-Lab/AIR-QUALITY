import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SensorsService } from './sensors.service.js';
import { CreateSensorDto } from './dto/create-sensor.dto.js';
import { UpdateSensorDto } from './dto/update-sensor.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Sensors')
@ApiBearerAuth('JWT')
@Controller('sensors')
export class SensorsController {
  constructor(
    private readonly sensorsService: SensorsService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('map-metadata')
  async mapMetadata(@Headers('authorization') authorization?: string) {
    let userId: number | undefined;
    let role: string | undefined;

    if (authorization?.startsWith('Bearer ')) {
      try {
        const payload = this.jwtService.verify(authorization.slice(7)) as {
          id?: number;
          role?: string;
        };
        userId = payload.id;
        role = payload.role;
      } catch {
        /* public metadata only */
      }
    }

    return this.sensorsService.findMapMetadataForUser(userId, role);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAll() {
    return this.sensorsService.findAll();
  }

  @Get('available')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAvailable(@Query('hours') hours?: string) {
    return this.sensorsService.findAvailable(Number(hours || '168'));
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  findMine(@Request() req: { user: { id: number } }) {
    return this.sensorsService.findMine(req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateSensorDto,
    @Request() req: { user: { id: number } },
  ) {
    return this.sensorsService.create(dto, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSensorDto,
    @Request() req: { user: { id: number } },
  ) {
    return this.sensorsService.update(+id, dto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(
    @Param('id') id: string,
    @Request() req: { user: { id: number } },
  ) {
    return this.sensorsService.remove(+id, req.user.id);
  }
}
