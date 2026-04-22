import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InfluxModule } from './influx/influx.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    InfluxModule,
  ],
})
export class AppModule {}