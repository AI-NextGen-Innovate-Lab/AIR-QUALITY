import { InfluxService } from './influx.service.js';
export declare class InfluxController {
    private readonly influxService;
    constructor(influxService: InfluxService);
    fetchData(limit?: string, page?: string, hours?: string, sensorId?: string, sensor?: string): Promise<unknown>;
    getHealth(): {
        ok: boolean;
        service: string;
        time: string;
    };
}
