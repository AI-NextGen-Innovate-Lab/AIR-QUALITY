# Air Quality Monitoring System

A full-stack **Environmental Intelligence Platform** for monitoring urban air quality in real time. It combines a public transparency dashboard, an interactive sensor map, role-based operational dashboards, a developer API ecosystem with tiered access, and per-sensor privacy controls.

Sensor telemetry (PM2.5, PM10, temperature, humidity, pressure, …) is streamed from LoRaWAN/TTN devices into **InfluxDB**; all relational data (users, sensors, API keys, audit logs) lives in **PostgreSQL**. A **NestJS** API serves both, and a **React (Vite)** single-page app is the front door.

---

## Table of contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Environment variables](#environment-variables)
- [Local development](#local-development)
- [Running with Docker](#running-with-docker)
- [API documentation (Swagger)](#api-documentation-swagger)
- [Tiered API access](#tiered-api-access)
- [API endpoint reference](#api-endpoint-reference)
- [Data model](#data-model)
- [Roles & access control](#roles--access-control)
- [Sensor privacy](#sensor-privacy)
- [Data export (reports)](#data-export-reports)
- [NPM scripts](#npm-scripts)
- [Troubleshooting](#troubleshooting)

---

## Features

**Public**
- Live home dashboard with current AQI, trends, and health guidance.
- Interactive **Leaflet map** of sensors with AQI-coloured markers.
- Per-sensor detail pages with historical charts.
- In-app API documentation page plus interactive **Swagger UI**.

**Authenticated users**
- Personal profile management and password change.
- **Analytics dashboard** — filter by sensor, time range, and measurement.
- **Reports / export** — download readings as **CSV, JSON, or PDF**, choosing a specific sensor, time range, and either specific measurements or the whole sensor.
- Request and manage **API keys** for programmatic access.

**Owners**
- Own one or more sensors and see their **private** sensor data (hidden from everyone else).

**Admins**
- **Operations center**: system health, user management, sensor registry, API-key request approvals, audit logs, and a system-report export.
- Register Influx topics as sensors, assign owners, and toggle **public/private** visibility.

**Platform**
- **Tiered API access** (public / JWT / API key) with per-tier rate limits, history windows, and row caps — all clamped server-side.
- Response **caching**, request **throttling**, and **helmet** security headers.
- **Audit logging** of auth and administrative actions.

---

## Architecture

```mermaid
flowchart TB
  subgraph clients [Clients]
    Web[React SPA]
    Dev[Developer integrations]
  end

  subgraph api [NestJS API]
    Guard[TieredAccessGuard]
    Cache[Response cache]
    Ctrls[Controllers]
    Privacy[SensorPrivacyService]
  end

  subgraph data [Data stores]
    PG[(PostgreSQL)]
    Influx[(InfluxDB)]
  end

  Web -->|no key: limited| Guard
  Web -->|JWT: elevated| Guard
  Dev -->|X-API-Key: full| Guard
  Guard --> Cache --> Ctrls
  Ctrls --> Privacy --> Influx
  Ctrls --> PG
```

- **Readings** flow from InfluxDB, filtered per caller by `SensorPrivacyService` so private-sensor rows only reach their owner.
- **Everything else** (users, sensors, API keys, audit logs) is in PostgreSQL via Prisma.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v4, React Router, TanStack Query, Radix UI, Leaflet / react-leaflet, Recharts, lucide-react, sonner |
| Backend | NestJS 11, TypeScript, Passport JWT, class-validator, cache-manager, @nestjs/throttler, helmet |
| Databases | PostgreSQL 16 (via Prisma 7 + `@prisma/adapter-pg`), InfluxDB (time-series readings) |
| API docs | OpenAPI / Swagger (`@nestjs/swagger`) |
| Deployment | Docker & Docker Compose |

---

## Repository structure

```
software/
├── backend/                # NestJS API
│   ├── src/
│   │   ├── auth/           # register/login/logout, JWT, guards, roles
│   │   ├── users/          # user CRUD, profile, audit logs (admin)
│   │   ├── sensors/        # registry, map metadata, ownership, privacy
│   │   ├── api-keys/       # API key request lifecycle & management
│   │   ├── influx/         # readings + health (InfluxDB)
│   │   ├── access/         # TieredAccessGuard + per-tier clamping
│   │   ├── prisma/         # Prisma service (seeds default admin)
│   │   └── main.ts         # bootstrap, validation, CORS, Swagger
│   └── prisma/schema.prisma
├── frontend/               # React + Vite SPA
│   └── src/app/            # pages, components, hooks, lib
├── docker-compose.yml
└── README.md
```

---

## Prerequisites

- **Node.js 20+** and npm
- **PostgreSQL 16** (or use the Docker Compose service)
- **InfluxDB** instance with a bucket of sensor readings, and an access token
- **Docker & Docker Compose** (optional, for containerised runs)

---

## Environment variables

Create `backend/.env`:

```env
# PostgreSQL
DATABASE_URL=postgresql://postgres:password@localhost:5434/air_quality

# Server
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8080

# Auth
JWT_SECRET=<a long random string>

# Seed admin (created on first boot if missing)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<strong password>
ADMIN_NAME=Administrator

# InfluxDB
INFLUX_URL=https://<your-influx-host>
INFLUX_TOKEN=<influx token>
INFLUX_ORG=<influx org>
INFLUX_BUCKET=<influx bucket>
```

Optional `frontend/.env` (defaults to the Vite dev proxy at `/backend/api` when unset):

```env
# Only needed if the API is not reachable via the dev proxy
VITE_API_URL=http://localhost:3000/api
```

> The frontend dev server proxies `/backend/*` → `http://localhost:3000/*`, so the SPA reaches the API at `/backend/api/...` during development with no extra config.

---

## Local development

**1. Databases** — start Postgres (Docker is easiest):

```bash
docker compose up -d postgres      # exposes Postgres on localhost:5434
```

**2. Backend**

```bash
cd backend
npm install                        # runs `prisma generate` via postinstall
npx prisma migrate deploy          # apply migrations (or `prisma db push` in dev)
npm run start:dev                  # watch mode on http://localhost:3000
```

On first boot the app seeds an admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

**3. Frontend**

```bash
cd frontend
npm install
npm run dev                        # http://localhost:5173 (or next free port)
```

Open the SPA, sign in with the seeded admin, and you're up.

---

## Running with Docker

`docker-compose.yml` builds and runs all three services. Provide the same variables (see above) via the shell environment or `backend/.env`, then:

```bash
docker compose up --build
```

Published ports:

| Service | Container | Host |
|---------|-----------|------|
| Frontend (nginx) | 80 | **http://localhost:8080** |
| Backend (NestJS) | 3000 | **http://localhost:3001** |
| PostgreSQL | 5432 | **localhost:5434** |

---

## API documentation (Swagger)

Interactive OpenAPI docs are served by the backend:

```
http://localhost:3000/api/docs         (local dev)
http://localhost:3001/api/docs         (Docker)
```

- Raw OpenAPI JSON: `GET /api/docs-json`
- Click **Authorize** to add credentials:
  - **JWT** — paste a token from `POST /api/auth/login` (Bearer).
  - **ApiKey** — paste an approved key in the `X-API-Key` header.

Operations are grouped by tag: **Auth, Readings, Sensors, API Keys, Users, Health**.

---

## Tiered API access

All read access is gated by `TieredAccessGuard`, which detects the caller and **clamps** query parameters server-side (clients can never exceed their tier):

| Caller | Auth | Rate limit* | History | Rows/request |
|--------|------|-------------|---------|--------------|
| Public | none | 30 req/min | 24h | 100 |
| Authenticated | `Authorization: Bearer <JWT>` | 30 req/min | 7d | 500 |
| API key | `X-API-Key: <key>` | 30 req/min | 30d | 5000 |

\* A global throttler currently applies 30 req/min; per-tier history and row caps are enforced in `clampReadingsQuery`. `GET /api/health` is always public.

---

## API endpoint reference

Base path: **`/api`**. See Swagger for full request/response schemas.

**Auth** (`/auth`)
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | Create account, returns JWT |
| POST | `/auth/login` | Returns `{ user, access_token }` |
| POST | `/auth/validate-token` | Validate a JWT |
| POST | `/auth/logout` | JWT; records audit event |

**Readings & health**
| Method | Path | Notes |
|---|---|---|
| GET | `/readings` | Tiered; params: `limit, page, hours, sensorId, measurement`. Private rows owner-only |
| GET | `/health` | Public health check |

**Sensors** (`/sensors`)
| Method | Path | Role |
|---|---|---|
| GET | `/sensors/map-metadata` | Public (adds owner's private sensors when JWT present) |
| GET | `/sensors` | ADMIN |
| GET | `/sensors/available` | ADMIN — Influx topics + registration state |
| GET | `/sensors/mine` | OWNER |
| POST | `/sensors` | ADMIN — register/mark public/private |
| PATCH | `/sensors/:id` | ADMIN |
| DELETE | `/sensors/:id` | ADMIN |

**API keys** (`/api-keys`, all require JWT)
| Method | Path | Role |
|---|---|---|
| POST | `/api-keys/requests` | any user |
| GET | `/api-keys/requests/mine` | any user |
| GET | `/api-keys/requests` | ADMIN |
| POST | `/api-keys/requests/:id/approve` | ADMIN |
| POST | `/api-keys/requests/:id/reject` | ADMIN |
| GET | `/api-keys/mine` · `/api-keys/mine/deliveries` | any user |
| GET | `/api-keys/:id/secret` | owner of key |
| GET | `/api-keys` | ADMIN |
| POST | `/api-keys/:id/revoke` · DELETE `/api-keys/:id` | owner/ADMIN |

**Users** (`/users`, all require JWT)
| Method | Path | Role |
|---|---|---|
| GET | `/users/me` · PATCH `/users/me` · PATCH `/users/me/password` | self |
| GET | `/users` · POST `/users` | ADMIN |
| GET | `/users/audit-logs` | ADMIN |
| GET/PATCH/DELETE | `/users/:id` · PATCH `/users/:id/role` | ADMIN |

---

## Data model

Managed by Prisma (`backend/prisma/schema.prisma`):

- **User** — `role: USER | ADMIN | OWNER`; owns sensors, API keys, requests, audit logs.
- **Sensor** — unique `topic` (Influx topic), optional `label`, coordinates, `visibility: PUBLIC | PRIVATE`, optional `ownerId`.
- **ApiKeyRequest** — `status: PENDING | APPROVED | REJECTED`, reviewer, note.
- **ApiKey** — hashed key (`keyPrefix` + `keyHash`), `status: ACTIVE | REVOKED | EXPIRED`, usage timestamps.
- **ActivityLog** — audit trail (`action`, `description`, `userId`, JSON `metadata`).

Time-series **readings** are **not** in Postgres — they are queried live from InfluxDB (tags: `topic` = sensor id, `name` = measurement).

---

## Roles & access control

- **USER** — view public data, manage own profile, request/manage API keys.
- **OWNER** — a USER who additionally owns sensors and can view their own **private** sensor data.
- **ADMIN** — full operational control: users, sensors, API-key approvals, audit logs, system reports.

Enforced by `JwtAuthGuard` + `RolesGuard` with the `@Roles()` decorator; readings additionally pass through `TieredAccessGuard`.

---

## Sensor privacy

When a sensor is marked **PRIVATE** and assigned an owner:

- Its readings are returned **only** to the owner — filtered by `SensorPrivacyService` on every `/readings` call (cache included).
- It is excluded from `/sensors/map-metadata` for non-owners, so it never appears on the map, analytics, or reports for anyone else.
- The SPA also clears the client-side query cache on login/logout, so cached data from one session can't surface in another on a shared browser.

Unregistered Influx topics default to **public**. To make a live sensor private, register it on its exact topic and set visibility in **Admin → Sensor Management**.

---

## Data export (reports)

From **Analytics & Reports**, users export readings by choosing:

1. **Sensor(s)** — the measurement list auto-narrows to what the selected sensor(s) actually report.
2. **Time range** — day / week / month / year (clamped to the API cap).
3. **Measurements** — pick specific ones or “Whole sensor”.
4. **Format** — **CSV** (UTF-8 BOM), **JSON**, or **PDF** (browser print-to-PDF).

Admins can additionally export a **System activity report** (audit logs) in the same formats from the admin **Reports** tab.

---

## NPM scripts

**Backend** (`backend/`)
| Script | Purpose |
|---|---|
| `npm run start:dev` | Watch-mode dev server |
| `npm run start:prod` | Run compiled `dist/main` |
| `npm run build` | Nest build |
| `npm run lint` | ESLint (autofix) |

**Frontend** (`frontend/`)
| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the build |
| `npm run lint` | ESLint |

---

## Troubleshooting

- **`INFLUX_ORG/INFLUX_BUCKET … must be configured`** — set the `INFLUX_*` variables in `backend/.env` and restart.
- **No readings / empty charts** — check `GET /api/health` and confirm the Influx token/bucket and that devices are reporting within the requested window.
- **CORS errors** — add your frontend origin to `ALLOWED_ORIGINS`.
- **401 after login** — the JWT expires after 24h; sign in again.
- **Swagger UI blank** — ensure you're on `/api/docs` (note the `/api` global prefix) and that the backend restarted after changes.
- **Private sensor still visible** — confirm it's registered on its **exact** Influx topic and marked PRIVATE with an owner; unregistered topics are public by default.

---

Built with NestJS, React, PostgreSQL, and InfluxDB.
