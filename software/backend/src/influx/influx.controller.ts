import { Controller, Get, Query } from '@nestjs/common';
import { InfluxService } from './influx.service.js';

@Controller()
export class InfluxController {
  constructor(private readonly influxService: InfluxService) {}

  @Get('readings')
  async fetchData(
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('hours') hours?: string,
    @Query('sensorId') sensorId?: string,
    @Query('sensor') sensor?: string,
  ) {
    return this.influxService.getReadings({
      limit,
      page,
      hours,
      sensorId: sensorId ?? sensor,
    });
  }

  @Get('health')
  getHealth() {
    return this.influxService.getHealth();
  }
}