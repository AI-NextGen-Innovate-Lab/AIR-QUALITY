import { Module, forwardRef } from '@nestjs/common';
import { SensorsService } from './sensors.service.js';
import { SensorsController } from './sensors.controller.js';
import { SensorPrivacyService } from './sensor-privacy.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { InfluxModule } from '../influx/influx.module.js';

@Module({
  imports: [PrismaModule, AuthModule, forwardRef(() => InfluxModule)],
  controllers: [SensorsController],
  providers: [SensorsService, SensorPrivacyService],
  exports: [SensorPrivacyService, SensorsService],
})
export class SensorsModule {}
