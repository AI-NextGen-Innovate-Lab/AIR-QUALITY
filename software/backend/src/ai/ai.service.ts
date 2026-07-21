import { Injectable, InternalServerErrorException, BadRequestException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { labelFromTopic } from '../sensors/sensor-metadata.util.js';

const DEFAULT_AI_API_URL = 'https://airquality-ai.tlms.live/api';

const AI_SENSOR_SLUGS: Record<string, string> = {
  lands: 'lands-building',
  planning: 'planing-building',
};

const VALID_HISTORY_HOURS = [24, 168, 336, 720];

const PREDICT_CACHE_TTL_MS = 5 * 60 * 1000;
const RECOMMEND_CACHE_TTL_MS = 20 * 60 * 1000;
const HISTORY_CACHE_TTL_MS = 5 * 60 * 1000;

interface PollutantLevels {
  pm25: number;
  pm10: number;
  co2: number;
  no2: number;
  voc: number;
  humidity?: number;
  temperature?: number;
}

interface SensorPrediction {
  current_aqi: number;
  trend_direction: string;
  trend_confidence: number;
  forecast_6h: number[];
  pm25_forecast_6h?: number[];
  pm10_forecast_6h?: number[];
  pollutants: PollutantLevels;
  timestamp: string;
}

interface AllSensorsResponse {
  sensors: Record<string, SensorPrediction>;
}

export interface RecommendationResponse {
  advice: string;
  aqi: number;
  aqi_category: string;
  timestamp: string;
}

export interface SensorHistoryResponse {
  hours: number;
  freq: string;
  data: Array<{ timestamp: string; aqi: number | null; pm25: number | null; pm10: number | null; co2: number | null }>;
}

export interface PredictionsPayload {
  sensors: Array<{ key: string; topic: string; label: string } & SensorPrediction>;
}

@Injectable()
export class AiService {
  private readonly baseUrl: string;

  constructor(
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.baseUrl = (this.configService.get<string>('AI_API_URL') ?? DEFAULT_AI_API_URL).replace(/\/$/, '');
  }

  private async fetchJson<T>(path: string): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`);
    } catch (error) {
      throw new InternalServerErrorException({
        error: error instanceof Error ? error.message : String(error),
        suggestion: 'Could not reach the AI prediction service.',
      });
    }
    if (!res.ok) {
      throw new InternalServerErrorException({
        error: `AI service responded ${res.status}`,
        suggestion: 'The AI prediction service returned an error.',
      });
    }
    return res.json() as Promise<T>;
  }

  async getPredictions(): Promise<PredictionsPayload> {
    const cacheKey = 'ai:predict:all';
    const cached = await this.cacheManager.get<PredictionsPayload>(cacheKey);
    if (cached) return cached;

    const raw = await this.fetchJson<AllSensorsResponse>('/predict/all');
    const sensors = Object.entries(raw.sensors).map(([key, prediction]) => {
      const topic = AI_SENSOR_SLUGS[key] ?? key;
      return {
        key,
        topic,
        label: labelFromTopic(topic),
        ...prediction,
      };
    });

    const payload: PredictionsPayload = { sensors };
    await this.cacheManager.set(cacheKey, payload, PREDICT_CACHE_TTL_MS);
    return payload;
  }

  async getRecommendation(): Promise<RecommendationResponse> {
    const cacheKey = 'ai:recommend';
    const cached = await this.cacheManager.get<RecommendationResponse>(cacheKey);
    if (cached) return cached;

    const payload = await this.fetchJson<RecommendationResponse>('/recommend/');
    await this.cacheManager.set(cacheKey, payload, RECOMMEND_CACHE_TTL_MS);
    return payload;
  }

  async getHistory(hours: number): Promise<SensorHistoryResponse> {
    if (!VALID_HISTORY_HOURS.includes(hours)) {
      throw new BadRequestException(`hours must be one of ${VALID_HISTORY_HOURS.join(', ')}`);
    }

    const cacheKey = `ai:history:${hours}`;
    const cached = await this.cacheManager.get<SensorHistoryResponse>(cacheKey);
    if (cached) return cached;

    const payload = await this.fetchJson<SensorHistoryResponse>(`/history/sensor?hours=${hours}`);
    await this.cacheManager.set(cacheKey, payload, HISTORY_CACHE_TTL_MS);
    return payload;
  }
}
