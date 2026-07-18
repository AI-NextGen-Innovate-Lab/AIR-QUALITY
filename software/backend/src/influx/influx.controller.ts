import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiSecurity,
  ApiQuery,
} from '@nestjs/swagger';
import { InfluxService } from './influx.service.js';
import { TieredAccessGuard } from '../access/tiered-access.guard.js';
import { AccessTier, clampReadingsQuery } from '../access/tiered-access.types.js';

@ApiTags('Readings')
@Controller()
export class InfluxController {
  constructor(private readonly influxService: InfluxService) {}

  @Get('readings')
  @ApiOperation({
    summary: 'Fetch air quality readings (tiered access)',
    description:
      'Public callers get up to 100 rows / 24h. JWT: 500 rows / 7d. API key: 5000 rows / 30d. ' +
      'Private-sensor readings are only returned to their owner. Params are clamped server-side.',
  })
  @ApiBearerAuth('JWT')
  @ApiSecurity('ApiKey')
  @ApiQuery({ name: 'limit', required: false, description: 'Max rows (clamped per tier)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (1-based)' })
  @ApiQuery({ name: 'hours', required: false, description: 'Look-back window in hours (clamped per tier)' })
  @ApiQuery({ name: 'sensorId', required: false, description: 'Filter by exact sensor topic' })
  @ApiQuery({ name: 'sensor', required: false, description: 'Alias for sensorId' })
  @ApiQuery({ name: 'measurement', required: false, description: 'Comma-separated measurement names (e.g. PM2.5,PM10)' })
  @UseGuards(TieredAccessGuard)
  async fetchData(
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('hours') hours?: string,
    @Query('sensorId') sensorId?: string,
    @Query('sensor') sensor?: string,
    @Query('measurement') measurement?: string,
    @Request() req?: {
      accessTier?: AccessTier;
      user?: { id: number };
      apiKey?: { userId: number };
    },
  ) {
    const tier = req?.accessTier ?? 'PUBLIC';
    const userId = req?.user?.id ?? req?.apiKey?.userId;
    const clamped = clampReadingsQuery(
      { limit, page, hours, sensorId: sensorId ?? sensor, measurement },
      tier,
    );
    return this.influxService.getReadings(clamped, tier, userId);
  }

  @Get('health')
  @ApiTags('Health')
  @ApiOperation({ summary: 'Service and InfluxDB connectivity check (public)' })
  getHealth() {
    return this.influxService.getHealth();
  }
}