var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Injectable, InternalServerErrorException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InfluxDB } from '@influxdata/influxdb-client';
import { TIER_LIMITS, } from '../access/tiered-access.types.js';
let InfluxService = class InfluxService {
    configService;
    cacheManager;
    influxDB;
    constructor(configService, cacheManager) {
        this.configService = configService;
        this.cacheManager = cacheManager;
        const rawUrl = this.configService.get('INFLUX_URL') ?? this.configService.get('DB_URL');
        const token = this.configService.get('INFLUX_TOKEN') ?? this.configService.get('DB_TOKEN');
        let url = rawUrl;
        if (rawUrl) {
            try {
                const parsed = new URL(rawUrl);
                url = parsed.origin;
            }
            catch {
                url = rawUrl;
            }
        }
        if (!url || !token) {
            throw new InternalServerErrorException('INFLUX_URL/INFLUX_TOKEN (or DB_URL/DB_TOKEN) must be configured');
        }
        this.influxDB = new InfluxDB({
            url,
            token,
        });
    }
    escapeFluxString(value) {
        return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }
    rowToReading(row) {
        const influxField = String(row._field ?? '').trim();
        if (influxField === 'unit')
            return null;
        const id = String(row.topic ?? row.id ?? '').trim();
        if (!id)
            return null;
        const metricName = String(row.name ?? '').trim();
        const measurement = metricName ||
            (influxField !== 'value' ? influxField : '') ||
            String(row._measurement ?? '').trim();
        if (!measurement)
            return null;
        const raw = row._value ?? row.value;
        let value = null;
        if (raw !== undefined && raw !== null) {
            const n = Number(raw);
            value = Number.isFinite(n) ? n : String(raw);
        }
        return {
            id,
            measurement,
            value,
            time: row._time ?? row.time,
        };
    }
    getHealth() {
        return {
            ok: true,
            service: 'air-quality-api',
            time: new Date().toISOString(),
        };
    }
    async getReadings(query, tier = 'PUBLIC') {
        const cacheKey = `readings:${tier}:${query.hours}:${query.sensorId ?? 'all'}:${query.page}:${query.limit}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return cached;
        }
        const org = this.configService.get('INFLUX_ORG') ?? this.configService.get('DB_ORG');
        const bucket = this.configService.get('INFLUX_BUCKET') ?? this.configService.get('DB_BUCKET');
        if (!org || !bucket) {
            throw new InternalServerErrorException('INFLUX_ORG/INFLUX_BUCKET (or DB_ORG/DB_BUCKET) must be configured');
        }
        const queryApi = this.influxDB.getQueryApi(org);
        const safeLimit = query.limit;
        const safePage = query.page;
        const safeHours = query.hours;
        const offset = (safePage - 1) * safeLimit;
        const topicFilter = query.sensorId
            ? `\n        |> filter(fn: (r) => r.topic == "${this.escapeFluxString(query.sensorId)}")`
            : '';
        const fluxQuery = `
      from(bucket: "${bucket}")
        |> range(start: -${safeHours}h)${topicFilter}
        |> filter(fn: (r) => exists r.topic and r.topic != "")
        |> filter(fn: (r) => exists r.name and r.name != "")
        |> filter(fn: (r) => r._field == "value")
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: ${safeLimit}, offset: ${offset})
    `;
        const results = [];
        const toReading = (row) => this.rowToReading(row);
        return new Promise((resolve, reject) => {
            queryApi.queryRows(fluxQuery, {
                next: (row, tableMeta) => {
                    const data = tableMeta.toObject(row);
                    const reading = toReading(data);
                    if (reading)
                        results.push(reading);
                },
                error: (error) => {
                    const msg = error?.message ?? String(error);
                    reject(new InternalServerErrorException({
                        error: msg,
                        suggestion: 'Influx query failed. Restart the backend after code changes, or reduce hours/limit.',
                    }));
                },
                complete: async () => {
                    const payload = {
                        data: results,
                        pagination: {
                            limit: safeLimit,
                            page: safePage,
                            hours: safeHours,
                            count: results.length,
                            tier,
                        },
                    };
                    await this.cacheManager.set(cacheKey, payload, TIER_LIMITS[tier].cacheTtlMs);
                    resolve(payload);
                },
            });
        });
    }
};
InfluxService = __decorate([
    Injectable(),
    __param(1, Inject(CACHE_MANAGER)),
    __metadata("design:paramtypes", [ConfigService, Object])
], InfluxService);
export { InfluxService };
//# sourceMappingURL=influx.service.js.map