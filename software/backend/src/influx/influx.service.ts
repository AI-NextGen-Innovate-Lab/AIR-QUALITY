import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InfluxDB } from '@influxdata/influxdb-client';

@Injectable()
export class InfluxService {
  private influxDB: InfluxDB;

  constructor(private configService: ConfigService) {
    const rawUrl =
      this.configService.get<string>('INFLUX_URL') ?? this.configService.get<string>('DB_URL');
    const token =
      this.configService.get<string>('INFLUX_TOKEN') ?? this.configService.get<string>('DB_TOKEN');

    let url = rawUrl;
    if (rawUrl) {
      try {
        const parsed = new URL(rawUrl);
        // Influx client expects server base URL, not "/orgs/<id>" path URLs.
        url = parsed.origin;
      } catch {
        url = rawUrl;
      }
    }

    if (!url || !token) {
      throw new InternalServerErrorException(
        'INFLUX_URL/INFLUX_TOKEN (or DB_URL/DB_TOKEN) must be configured',
      );
    }

    this.influxDB = new InfluxDB({
      url,
      token,
    });
  }

  private escapeFluxString(value: string) {
    return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  getHealth() {
    return {
      ok: true,
      service: 'air-quality-api',
      time: new Date().toISOString(),
    };
  }

  async getReadings(query: {
    limit?: string;
    page?: string;
    hours?: string;
    sensorId?: string;
  }) {
    const org = this.configService.get<string>('INFLUX_ORG') ?? this.configService.get<string>('DB_ORG');
    const bucket =
      this.configService.get<string>('INFLUX_BUCKET') ?? this.configService.get<string>('DB_BUCKET');

    if (!org || !bucket) {
      throw new InternalServerErrorException(
        'INFLUX_ORG/INFLUX_BUCKET (or DB_ORG/DB_BUCKET) must be configured',
      );
    }

    const queryApi = this.influxDB.getQueryApi(org);

    const limitRaw = Number.parseInt(query.limit ?? '500', 10);
    const pageRaw = Number.parseInt(query.page ?? '1', 10);
    const hoursRaw = Number.parseInt(query.hours ?? '24', 10);
    const safeLimit = Math.min(Math.max(Number.isNaN(limitRaw) ? 500 : limitRaw, 1), 5000);
    const safePage = Math.max(Number.isNaN(pageRaw) ? 1 : pageRaw, 1);
    const safeHours = Math.min(Math.max(Number.isNaN(hoursRaw) ? 24 : hoursRaw, 1), 24 * 30);
    const offset = (safePage - 1) * safeLimit;
    const topicFilter = query.sensorId
      ? `\n      |> filter(fn: (r) => r.id == "${this.escapeFluxString(query.sensorId)}")`
      : '';

    const fluxQuery = `
      from(bucket: "${bucket}")
        |> range(start: -${safeHours}h)
        |> map(fn: (r) => ({
            id: r.topic,
            measurement: if exists r._field then r._field else r._measurement,
            value: if exists r.value then r.value else r._value,
            time: r._time
        }))
        |> filter(fn: (r) => exists r.id and r.id != "")${topicFilter}
        |> sort(columns: ["time"], desc: true)
        |> limit(n: ${safeLimit}, offset: ${offset})
    `;

    const results: Array<Record<string, unknown>> = [];

    return new Promise((resolve, reject) => {
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
          const data = tableMeta.toObject(row);
          results.push(data);
        },
        error(error) {
          reject(
            new InternalServerErrorException({
              error: error.message,
              suggestion: 'Try reducing the time range or hours parameter',
            }),
          );
        },
        complete() {
          resolve({
            data: results,
            pagination: {
              limit: safeLimit,
              page: safePage,
              hours: safeHours,
              count: results.length,
            },
          });
        },
      });
    });
  }
}