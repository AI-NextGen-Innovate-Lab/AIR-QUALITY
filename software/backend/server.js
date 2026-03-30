import express from "express"
import { InfluxDB } from "@influxdata/influxdb-client"
import dotenv from "dotenv"

dotenv.config()

// config
const url = process.env.DB_URL
const token = process.env.DB_TOKEN
const org = process.env.DB_ORG
const bucket = process.env.DB_BUCKET
const port = process.env.PORT || 3000

// create client
const client = new InfluxDB({ url, token })
const queryApi = client.getQueryApi(org)

const app = express()

app.get("/", (req, res) => {
  const query = `
    from(bucket: "${bucket}")
      |> range(start: -1h)
      |> limit(n: 10)
  `

  let id = 1
  const results = []

  queryApi.queryRows(query, {
    next(row, tableMeta) {
      const data = tableMeta.toObject(row)

      results.push({
        id: id++,
        measurement: data._measurement,
        value: data._value,
        time: data._time
      })
    },

    error(error) {
      console.error("Error:", error)
      res.status(500).json({ error: error.message })
    },

    complete() {
      res.json(results)
    }
  })
})

// start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})