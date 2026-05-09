# Architecture — Crypto Market Intelligence Platform

## System Design Diagram

```
                         ┌──────────────────────┐
                         │    CoinGecko API      │
                         │  (External, rate       │
                         │   limited 30/min)      │
                         └──────────┬────────────┘
                                    │ HTTPS GET /simple/price
                                    │ every 10 seconds
                         ┌──────────▼────────────┐
                         │   Background Worker    │
                         │   (node-cron, 10s)     │
                         │                        │
                         │  1. fetchAndCache()    │
                         │  2. persist to DB      │
                         │  3. update Redis cache │
                         │  4. checkAlerts()      │
                         │  5. broadcast via WS   │
                         └───┬──────────┬─────────┘
                             │          │
                    Prisma   │          │  Redis SET (TTL 25s)
                    $transaction        │
                             │          │
              ┌──────────────▼──┐  ┌───▼────────────────┐
              │   PostgreSQL    │  │   Redis Cache       │
              │   (Neon)        │  │   (Upstash)         │
              │                 │  │                     │
              │  • CoinPrice    │  │  prices:live (25s)  │
              │  • Alert        │  │                     │
              │  • Portfolio    │  └───────────┬─────────┘
              │  • User         │              │ cache-first read
              └────────┬────────┘              │
                       │                       │
                       └──────────┬────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │     Express REST API        │
                    │     + Socket.io Server      │
                    │                             │
                    │  Middleware stack:           │
                    │  cors → rateLimit → json    │
                    │  → JWT auth → Zod validate  │
                    │  → controller → response    │
                    │                             │
                    │  Socket.io rooms:            │
                    │  • broadcast: prices:update │
                    │  • room user:{id}: alerts   │
                    └─────────────┬───────────────┘
                                  │
                          HTTP + WebSocket
                                  │
                    ┌─────────────▼───────────────┐
                    │      React Frontend          │
                    │   Vite + TS + Tailwind       │
                    │                             │
                    │  Zustand stores:            │
                    │  • useAuthStore (JWT)       │
                    │  • usePriceStore (live data)│
                    │  • useSocketStore (WS conn) │
                    │                             │
                    │  Pages:                     │
                    │  /dashboard  /coins/:id     │
                    │  /alerts     /portfolio     │
                    │  /analytics  /login         │
                    └─────────────────────────────┘
```

---

## Database Schema

```
User ──────────── Alert
  │                 (coinId, condition, targetPrice,
  │                  isActive, isTriggered, triggeredAt)
  │
  └─────────────── Portfolio
                    (coinId, symbol, name,
                     quantity, purchasePrice)

CoinPrice  (time-series — one row per coin per fetch cycle)
  (coinId, symbol, name, price, marketCap, volume, change24h)
  Indexes: [coinId], [createdAt], [coinId, createdAt]
```

---

## Key Design Decisions

### 1. Rate Limit Strategy
- Worker fetches every 10s = **6 calls/min** (well under 30/min limit)
- Redis cache TTL 25s — API calls served from cache between cycles
- On 429: reads `Retry-After` header, blocks further API calls until window expires
- Overlap guard: if previous cycle is still running, next tick is skipped

### 2. WebSocket Architecture
- Single Socket.io server instance (singleton exported from `websocket/socket.ts`)
- All clients receive `prices:update` broadcast
- Each authenticated client joins room `user:{userId}` for private alert notifications
- Auth token passed in Socket.io handshake — no second HTTP request needed

### 3. Alert System
- Worker checks all `isActive=true, isTriggered=false` alerts after every price fetch
- Batch update with `updateMany` — single DB write for all triggered alerts
- Notification emitted to `user:{userId}` room before DB write (optimistic)

### 4. Caching Strategy
```
Request → Redis cache hit? → Return cached data (fast)
                  ↓ miss
             PostgreSQL (latest snapshot per coin via DISTINCT)
                  ↓
             Return + background worker will refresh cache
```

### 5. Security
- bcrypt cost factor 12 (production standard)
- Generic error message on login (anti-enumeration)
- JWT expiry: 7 days
- Auth rate limit: 20 req / 15 min per IP
- API rate limit: 120 req / min per IP
- Body size limit: 10kb

---

## Folder Structure

```
crypto-platform/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # DB models
│   │   ├── seed.ts                # Demo user seeder
│   │   └── migrations/
│   ├── src/
│   │   ├── config/
│   │   │   ├── prisma.ts          # Prisma singleton
│   │   │   ├── redis.ts           # Redis with fallback
│   │   │   └── swagger.ts         # OpenAPI spec
│   │   ├── controllers/           # Route handlers
│   │   ├── middleware/            # auth, validate, error, rateLimit
│   │   ├── routes/                # Express routers
│   │   ├── services/
│   │   │   ├── coingecko.service.ts  # API + cache
│   │   │   └── alert.service.ts      # Alert trigger logic
│   │   ├── types/index.ts         # Shared TS interfaces
│   │   ├── utils/
│   │   │   ├── logger.ts          # Winston
│   │   │   ├── retry.ts           # Exponential backoff
│   │   │   └── analytics.ts       # Volatility, correlation
│   │   ├── websocket/socket.ts    # Socket.io singleton
│   │   ├── workers/price.worker.ts # Cron job
│   │   ├── tests/                 # Jest integration tests
│   │   ├── app.ts                 # Express app
│   │   └── index.ts               # Server entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/                 # 5 main pages
│   │   ├── components/            # Reusable UI components
│   │   ├── store/                 # Zustand stores
│   │   ├── services/              # Axios API client
│   │   ├── hooks/                 # Custom hooks
│   │   └── App.tsx
│   └── Dockerfile
├── docker-compose.yml
├── README.md
├── ARCHITECTURE.md
└── .env.example
```
