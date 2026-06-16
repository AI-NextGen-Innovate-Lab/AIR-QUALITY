import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SensorsService } from './sensors.service.js';
import { CreateSensorDto } from './dto/create-sensor.dto.js';
import { UpdateSensorDto } from './dto/update-sensor.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('sensors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SensorsController {
  constructor(private readonly sensorsService: SensorsService) {}

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.sensorsService.findAll();
  }

  @Get('available')
  @Roles('ADMIN')
  findAvailable(@Query('hours') hours?: string) {
    return this.sensorsService.findAvailable(Number(hours || '168'));
  }

  @Get('mine')
  @Roles('OWNER')
  findMine(@Request() req: { user: { id: number } }) {
    return this.sensorsService.findMine(req.user.id);
  }

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateSensorDto,
    @Request() req: { user: { id: number } },
  ) {
    return this.sensorsService.create(dto, req.user.id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSensorDto,
    @Request() req: { user: { id: number } },
  ) {
    return this.sensorsService.update(+id, dto, req.user.id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(
    @Param('id') id: string,
    @Request() req: { user: { id: number } },
  ) {
    return this.sensorsService.remove(+id, req.user.id);
  }
}
