import { Module } from '@nestjs/common';
import { InfluxService } from './influx.service.js';
import { InfluxController } from './influx.controller.js';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { TieredAccessGuard } from '../access/tiered-access.guard.js';

@Module({
  imports: [ApiKeysModule, AuthModule],
  providers: [InfluxService, TieredAccessGuard],
  controllers: [InfluxController],
})
export class InfluxModule {}
