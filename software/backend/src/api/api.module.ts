import { Module } from '@nestjs/common';
import { ApiService } from './api.service.js';
import { ApiController } from './api.controller.js';

@Module({
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}
