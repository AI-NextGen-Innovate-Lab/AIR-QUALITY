import { ConfigService } from '@nestjs/config';
export declare class InfluxService {
    private configService;
    private influxDB;
    constructor(configService: ConfigService);
    private escapeFluxString;
    getHealth(): {
        ok: boolean;
        service: string;
        time: string;
    };
    getReadings(query: {
        limit?: string;
        page?: string;
        hours?: string;
        sensorId?: string;
    }): Promise<unknown>;
}
