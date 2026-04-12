import express from "express";
import cors from "cors";
import { InfluxDB } from "@influxdata/influxdb-client";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
const port = 3000;

const client = new InfluxDB({
  url: process.env.DB_URL,
  token: process.env.DB_TOKEN,
  timeout: 160000,
});

const queryApi = client.getQueryApi(process.env.DB_ORG);

function escapeFluxString(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function buildReadingsQuery(query) {
  const limit = parseInt(query.limit, 10) || 50;
  const page = parseInt(query.page, 10) || 1;
  const hours = parseInt(query.hours, 10) || 24;
  const sensorId = query.sensorId || query.sensor || "";

  const safeLimit = Math.min(Math.max(limit, 1), 5000);
  const safePage = Math.max(page, 1);
  const safeHours = Math.min(Math.max(hours, 1), 24 * 30);
  const offset = (safePage - 1) * safeLimit;

  const topicFilter = sensorId
    ? `\n      |> filter(fn: (r) => r.id == "${escapeFluxString(sensorId)}")`
    : "";

  const flux = `
    from(bucket: "${process.env.DB_BUCKET}")
      |> range(start: -${safeHours}h)
      |> map(fn: (r) => ({
          id: r.topic,
          measurement: r._measurement,
          value: r.value,
          time: r._time
      }))
      |> filter(fn: (r) => exists r.id and r.id != "")${topicFilter}
      |> sort(columns: ["time"], desc: true)
      |> limit(n: ${safeLimit}, offset: ${offset})
  `;

  return {
    flux,
    pagination: { limit: safeLimit, page: safePage, hours: safeHours },
  };
}

function runReadingsFlux(res, flux, pagination) {
  const results = [];

  queryApi.queryRows(flux, {
    next(row, tableMeta) {
      results.push(tableMeta.toObject(row));
    },
    error(error) {
      console.error("Query Error:", error);
      res.status(500).json({
        error: error.message,
        suggestion: "Try reducing the time range or hours parameter",
      });
    },
    complete() {
      res.json({
        data: results,
        pagination: {
          limit: pagination.limit,
          page: pagination.page,
          hours: pagination.hours,
          count: results.length,
        },
      });
    },
  });
}

function readingsHandler(req, res) {
  const { flux, pagination } = buildReadingsQuery(req.query);
  runReadingsFlux(res, flux, pagination);
}

app.get("/api/readings", readingsHandler);

app.get("/", readingsHandler);

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "air-quality-api",
    time: new Date().toISOString(),
  });
});

app.listen(port, () =>
  console.log(`Server running on http://localhost:${port}`)
);
