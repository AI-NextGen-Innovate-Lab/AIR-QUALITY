import { InfluxService } from './influx.service.js';
import { AccessTier } from '../access/tiered-access.types.js';
export declare class InfluxController {
    private readonly influxService;
    constructor(influxService: InfluxService);
    fetchData(limit?: string, page?: string, hours?: string, sensorId?: string, sensor?: string, measurement?: string, req?: {
        accessTier?: AccessTier;
    }): Promise<unknown>;
    getHealth(): {
        ok: boolean;
        service: string;
        time: string;
    };
}
