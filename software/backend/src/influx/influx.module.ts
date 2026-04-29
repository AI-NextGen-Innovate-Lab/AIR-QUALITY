import { Module } from '@nestjs/common';
import { InfluxService } from './influx.service.js';
import { InfluxController } from './influx.controller.js';

@Module({
  providers: [InfluxService],
  controllers: [InfluxController]
})
export class InfluxModule {}
