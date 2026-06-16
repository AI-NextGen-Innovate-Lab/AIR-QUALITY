import { Module, forwardRef } from '@nestjs/common';
import { InfluxService } from './influx.service.js';
import { InfluxController } from './influx.controller.js';
import { ApiKeysModule } from '../api-keys/api-keys.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { SensorsModule } from '../sensors/sensors.module.js';
import { TieredAccessGuard } from '../access/tiered-access.guard.js';

@Module({
  imports: [ApiKeysModule, AuthModule, forwardRef(() => SensorsModule)],
  providers: [InfluxService, TieredAccessGuard],
  controllers: [InfluxController],
  exports: [InfluxService],
})
export class InfluxModule {}
