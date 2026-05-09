# Crypto Market Intelligence Platform

## Overview

A production-grade real-time SaaS platform that pulls live cryptocurrency prices from the CoinGecko API every 10 seconds, processes data through a background worker pipeline, and delivers actionable insights — live price updates, price alerts, portfolio P&L tracking, and market analytics — through a polished React dashboard over WebSocket.

---

## Tech Stack & Justification

| Layer | Technology | Why |
|-------|-----------|-----|
| **Backend** | Node.js + Express + TypeScript | Industry standard for real-time APIs, excellent Socket.io integration, typed codebase |
| **Database** | PostgreSQL (Neon) | Best for time-series price history, strong relational integrity for alerts/portfolios |
| **Cache** | Redis (Upstash) | Sub-millisecond cache for live prices — prevents redundant CoinGecko calls |
| **ORM** | Prisma | Type-safe queries, auto-migrations, connection pooling built-in |
| **Real-time** | Socket.io | Handles 100+ concurrent connections, rooms for per-user alert notifications |
| **Worker** | node-cron | Lightweight cron scheduler, runs price fetch cycle every 10s |
| **Frontend** | React + TypeScript + Vite | Fast HMR, strong typing, best ecosystem for this stack |
| **Styling** | TailwindCSS + shadcn/ui | Custom professional design, not Bootstrap |
| **Charts** | Recharts | Composable, TypeScript-native, works well with React |
| **State** | Zustand | Minimal boilerplate, perfect for global price + auth state |
| **Auth** | JWT + bcrypt(12) | Stateless, scales horizontally |
| **Validation** | Zod | Runtime + compile-time type safety on all endpoints |
| **Logging** | Winston | Structured JSON logs, file + console transports |
| **Testing** | Jest + Supertest | Integration tests against real DB, 18 test cases |

---

## Architecture

<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/54f5af54-d884-4bbd-a03f-681760193465" />

### Request Flow
```
User opens dashboard
  → Frontend calls GET /api/prices/live (cache-first response)
  → WebSocket connected with JWT auth token
  → Worker fetches CoinGecko every 10s → saves to DB → updates Redis
  → Socket.io broadcasts prices:update to all clients
  → Frontend Zustand store updated → UI re-renders (no page refresh)
```

### Alert Flow
```
User creates alert (BTC > $50,000)
  → POST /api/alerts saved to PostgreSQL
  → Worker cycle checks all active alerts against current prices
  → Condition met → alert marked triggered in DB
  → Socket.io emits alert:triggered to user:${userId} room
  → Frontend shows toast notification
```

---

## Setup Instructions

### Option 1 — Docker (Recommended, one command)

```bash
# Clone repo
git clone <repo-url>
cd crypto-platform

# Copy environment file
cp .env.example .env
# Edit .env — set JWT_SECRET to a long random string

# Start all services (auto-seeds demo user on first run)
docker-compose up
```

Application URLs:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **API Docs (Swagger):** http://localhost:4000/docs

### Option 2 — Local Development

**Prerequisites:** Node.js 20+, PostgreSQL, Redis

```bash
# Backend
cd backend
cp .env.example .env
# Fill in DATABASE_URL, REDIS_URL, JWT_SECRET
npm install
npx prisma db push
npx prisma generate
npm run seed
npm run dev

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

---

## Demo Credentials

```
Email:    demo@kuvaka.io
Password: demo123
```

---

## API Documentation

Swagger UI available at: **http://localhost:4000/docs**

### Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register user |
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| GET | `/api/prices/live` | ✅ | Live prices (10 coins) |
| GET | `/api/prices/history/:coinId` | ✅ | Price history (default 7 days) |
| GET | `/api/prices/analytics/volatility` | ✅ | Volatility ranking |
| GET | `/api/prices/analytics/correlations` | ✅ | Correlation matrix |
| POST | `/api/alerts` | ✅ | Create price alert |
| GET | `/api/alerts` | ✅ | List user alerts |
| DELETE | `/api/alerts/:id` | ✅ | Delete alert |
| POST | `/api/portfolio/positions` | ✅ | Add position |
| GET | `/api/portfolio` | ✅ | Portfolio with live P&L |
| DELETE | `/api/portfolio/positions/:id` | ✅ | Remove position |
| GET | `/api/admin/health` | ❌ | System health check |

### WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `prices:update` | Server → All clients | `{ prices: CoinPrice[], timestamp }` |
| `alert:triggered` | Server → User room | `{ alertId, coinId, condition, targetPrice, currentPrice }` |

Connect with auth: `io(URL, { auth: { token: 'Bearer ...' } })`

---

## Known Limitations

- CoinGecko free tier is rate-limited at 30 calls/min. During heavy server restarts the 429 guard activates (pauses fetch for the `Retry-After` duration, serves cache).
- Price history is only as old as when the server first ran — no historical data import from CoinGecko.
- Worker runs in the same process as the API server (same codebase, separate npm script available via `npm run worker`).
- No email notifications for alerts — WebSocket only.

---

## Time Breakdown

| Phase | Time |
|-------|------|
| Backend (API + Worker + WebSocket + Auth) | ~10h |
| Frontend (5 pages + real-time) | ~12h |
| Testing (18 test cases) | ~3h |
| Docker + Documentation | ~2h |
| **Total** | **~27h** |

---

## Video Walkthrough

[https://youtu.be/_eCXtEbgn2c](https://drive.google.com/file/d/1moUPaBKWPs9D_uhNEmuGE6sk6bLJmBUN/view?usp=sharing)
---

## Running Tests

```bash
cd backend
npm test
# Coverage report
npm run test:coverage
```
