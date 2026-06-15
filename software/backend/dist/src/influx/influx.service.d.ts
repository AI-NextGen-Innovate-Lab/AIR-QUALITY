import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import { AccessTier, ClampedReadingsQuery } from '../access/tiered-access.types.js';
export declare class InfluxService {
    private configService;
    private cacheManager;
    private influxDB;
    constructor(configService: ConfigService, cacheManager: Cache);
    private escapeFluxString;
    private rowToReading;
    getHealth(): {
        ok: boolean;
        service: string;
        time: string;
    };
    getReadings(query: ClampedReadingsQuery, tier?: AccessTier): Promise<unknown>;
}
