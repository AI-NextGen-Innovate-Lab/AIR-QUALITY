import express from "express";
import { InfluxDB } from "@influxdata/influxdb-client";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = 3000;

// Increase timeout to prevent "Request timed out"
const client = new InfluxDB({ 
  url: process.env.DB_URL, 
  token: process.env.DB_TOKEN,
  timeout: 60000   // 60 seconds
});

const queryApi = client.getQueryApi(process.env.DB_ORG);

app.get("/", async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const page  = parseInt(req.query.page)  || 1;

  const query = `
    import "types"
    import "strings"

    from(bucket: "${process.env.DB_BUCKET}")
      |> range(start: -1h)
      |> filter(fn: (r) => r["_measurement"] == "ardhi")

      // Safe conversion - keep " 0:25" style strings, convert numbers to float
      |> map(fn: (r) => {
          v = r._value
          return { r with 
            _value: if exists v then
                      if types.isType(v: v, type: "string") then
                        if strings.containsStr(v: string(v: v), substr: ":") then
                          v                          // keep time strings
                        else
                          float(v: v)                // try numeric strings
                      else
                        float(v: v)                  // numbers → float
                    else
                      v
          }
        })

      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")

      // Keep only rows that have an "id" column (from your original sample)
      |> filter(fn: (r) => exists r.id and r.id != "")

      // Keep the columns you actually want
      |> keep(columns: ["_time", "id", "measurement", "value"])

      |> sort(columns: ["_time"], desc: true)
      |> limit(n: ${limit}, offset: ${(page - 1) * limit})
  `;

  const results = [];
  let counter = 1;

  queryApi.queryRows(query, {
    next(row, tableMeta) {
      const data = tableMeta.toObject(row);
      data.id = counter++;                    // optional sequential id
      results.push(data);
    },
    error(error) {
      console.error("Query Error:", error);
      res.status(500).json({ error: error.message });
    },
    complete() {
      res.json({
        data: results,
        pagination: { limit, page, count: results.length }
      });
    }
  });
});

app.listen(port, () => 
  console.log(`Server running on http://localhost:${port}`)
);