import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { InfluxService } from './influx.service.js';
import { TieredAccessGuard } from '../access/tiered-access.guard.js';
import { AccessTier, clampReadingsQuery } from '../access/tiered-access.types.js';

@Controller()
export class InfluxController {
  constructor(private readonly influxService: InfluxService) {}

  @Get('readings')
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
  getHealth() {
    return this.influxService.getHealth();
  }
}