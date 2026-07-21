import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AiService } from './ai.service.js';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('predict')
  @ApiOperation({
    summary: 'ML predictions for all sensors (public)',
    description: 'Current AQI, trend, and 6-hour forecast per sensor, from the deployed AI service.',
  })
  predict() {
    return this.aiService.getPredictions();
  }

  @Get('recommend')
  @ApiOperation({
    summary: 'LLM-generated health recommendation (public)',
    description: 'Health advice based on the sensor with the worst current AQI. Can be slow (LLM call).',
  })
  recommend() {
    return this.aiService.getRecommendation();
  }

  @Get('history')
  @ApiOperation({
    summary: 'AI-aggregated AQI/pollutant history (public)',
    description: 'Bucketed AQI/PM/CO2 history computed by the AI service. hours must be 24, 168, 336, or 720.',
  })
  @ApiQuery({ name: 'hours', required: false, description: 'Look-back window: 24, 168, 336, or 720 (default 24)' })
  history(@Query('hours') hours?: string) {
    const parsed = hours ? Number(hours) : 24;
    return this.aiService.getHistory(parsed);
  }
}
