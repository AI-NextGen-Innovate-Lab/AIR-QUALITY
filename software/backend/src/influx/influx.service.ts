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

  /**
   * Map Influx row → API reading.
   * TTN/Telegraf schema: tag `topic` = sensor id, tag `name` = metric (PM2.5, PM10, …),
   * `_field` = "value" | "unit" (Influx field key, not the metric name).
   */
  private rowToReading(row: Record<string, unknown>) {
    const influxField = String(row._field ?? '').trim();
    // "unit" rows hold strings like "µg/m³" — skip them
    if (influxField === 'unit') return null;

    const id = String(row.topic ?? row.id ?? '').trim();
    if (!id) return null;

    const metricName = String(row.name ?? '').trim();
    const measurement =
      metricName ||
      (influxField !== 'value' ? influxField : '') ||
      String(row._measurement ?? '').trim();

    if (!measurement) return null;

    const raw = row._value ?? row.value;
    let value: number | string | null = null;
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
      ? `\n        |> filter(fn: (r) => r.topic == "${this.escapeFluxString(query.sensorId)}")`
      : '';

    // Never use map() to merge r.value (string) and r._value (float) — that panics Influx.
    const fluxQuery = `
      from(bucket: "${bucket}")
        |> range(start: -${safeHours}h)${topicFilter}
        |> filter(fn: (r) => exists r.topic and r.topic != "")
        |> filter(fn: (r) => exists r.name and r.name != "")
        |> filter(fn: (r) => r._field == "value")
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: ${safeLimit}, offset: ${offset})
    `;

    const results: Array<{
      id: string;
      measurement: string;
      value: number | string | null;
      time: unknown;
    }> = [];

    const toReading = (row: Record<string, unknown>) => this.rowToReading(row);

    return new Promise((resolve, reject) => {
      queryApi.queryRows(fluxQuery, {
        next: (row, tableMeta) => {
          const data = tableMeta.toObject(row) as Record<string, unknown>;
          const reading = toReading(data);
          if (reading) results.push(reading);
        },
        error: (error) => {
          const msg = error?.message ?? String(error);
          reject(
            new InternalServerErrorException({
              error: msg,
              suggestion:
                'Influx query failed. Restart the backend after code changes, or reduce hours/limit.',
            }),
          );
        },
        complete: () => {
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