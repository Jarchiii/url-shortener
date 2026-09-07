# URL Shortener

A small, honest URL shortener. Paste a long URL, get a short one, hit the short URL to be redirected.

Built to be simple to read, easy to run, and reasonable about production concerns.

---

## Quick start

You need Docker and Node 22+ installed. From the project root:

```bash
# 1. Install everything
npm run install:all

# 2. Start Postgres + Redis
npm run docker:up

# 3. Apply migrations (dev + test databases)
cp backend/.env.example backend/.env
npm run migrate
npm run migrate:test

# 4. Run backend + frontend together
npm run dev
```

- Backend on `http://localhost:3000`
- Frontend on `http://localhost:5173`

Open the frontend, paste a URL, click **Shorten**, copy the result.

To stop the local services: `Ctrl-C` on the dev command, then `npm run docker:down`.

Running the tests:

```bash
npm test                 # unit tests (no Docker required)
npm run test:integration # integration tests (needs Postgres + Redis up)
```

---

## What's inside

| Layer | Choice |
| --- | --- |
| Frontend | React 19 + TypeScript, Vite, Tailwind CSS 4 |
| Backend | Node 22 + TypeScript (ESM), Express 5 |
| Database | PostgreSQL 16 |
| Cache & rate limiter | Redis 7 |
| Short code | `nanoid`, 7 chars, base62 |
| Tests | Jest + Supertest (SWC transformer) |
| Local dev | Docker Compose |

Two independent packages, no workspace tool. Each has its own `package.json` you install and run.

---

## Architecture (lightweight hexagonal)

```
                    ┌──────────────────────────────────────┐
                    │            src/domain/               │
                    │  isValidUrl • generateCode           │
    HTTP request ──►│         shorten • resolve            │◄── Business logic
                    │  (pure functions, no external deps)  │
                    └──────────────────────────────────────┘
                              ▲                    ▲
                              │                    │
                     ┌────────┘                    └────────┐
                     │                                      │
              ┌──────────────┐                     ┌───────────────┐
              │  adapters/   │                     │   adapters/   │
              │  http (Express) │                  │ db (pg) │ cache (Redis) │
              └──────────────┘                     └───────────────┘
                     │                                      │
                     ▼                                      ▼
                  Network                            Postgres + Redis
```

The domain is a set of pure functions. Adapters depend on the domain, never the other way around. Deps are injected as plain objects (`{ generateCode, save }`), which makes the domain trivial to unit-test with in-memory fakes.

No interfaces where a single implementation is expected. TypeScript's structural typing is enough — the adapters just have to expose the right shape.

---

## Key technical decisions

### Domain

- **URL validation**: uses the native `URL` constructor + a length cap of 2048. Only `http:` and `https:` schemes are accepted, which blocks `javascript:`, `data:`, `file:`, etc.
- **Code generation**: `nanoid.customAlphabet` with a 7-character base62 alphabet → ~3.5 × 10¹² combinations. Codes are non-guessable and don't leak the total number of URLs (unlike encoding a sequential ID).
- **Retry on collision**: the `shorten` use case catches the DB `UNIQUE` violation and retries up to 5 times before giving up. In practice this virtually never triggers, but it's the correct guard.
- **Idempotency**: shortening the same URL twice returns two different codes. This avoids the "who owns this code?" question and matches how consumer services behave.

### Read path & caching

- **Cache-aside on `GET /:code`**: check Redis first, fall back to Postgres on miss, then populate Redis.
- **Why it's a huge win here**: URLs are immutable, so we never invalidate the cache — we only rely on a 24h TTL to evict cold entries. This gives us the biggest scaling optimization for essentially free.

### Write path & rate limiting

- **Rate limit**: 10 requests/minute/IP on `POST /shorten`, backed by Redis (`rate-limiter-flexible`). Because it's in Redis and not in-process memory, the limit stays correct if we scale the backend horizontally.
- **No rate limit on redirects**: `GET /:code` must be fast and cacheable. DDoS on redirects is a job for a CDN/WAF.

### HTTP

- **`302` on redirects, not `301`**: keeps the door open for click tracking or URL updates without being blocked by browsers/proxies caching a permanent redirect forever.
- **Simple error mapping**: the domain throws generic `Error` with clear messages; the HTTP layer maps `'invalid url'` → 400, exhausted retries → 500. No custom error classes yet — the mapping is small and readable.

### Database

- Raw `pg` client, no ORM. Only three queries total (INSERT, SELECT, TRUNCATE for tests) — an ORM would be pure overhead.
- Single migration file, applied by a 15-line Node script. No migration tool.
- `code VARCHAR(16) PRIMARY KEY` — the primary key gives us uniqueness and a B-tree index in one constraint.

### Local dev experience

- Postgres exposed on `55432` and Redis on `56379` (non-standard ports) to avoid clashing with anything already running locally.
- `docker-entrypoint-initdb.d` creates a **separate `url_shortener_test` database** at first startup, so integration tests (`TRUNCATE`, `FLUSHDB`) can't wipe your dev data.

---

## Testing strategy

- **Unit tests** live in `backend/tests/domain/` and cover the four domain pieces (`isValidUrl`, `generateCode`, `shorten`, `resolve`). They inject fake in-memory dependencies — no Docker needed. Written test-first, in tight red/green/refactor cycles.
- **Integration tests** live in `backend/tests/adapters/http.integration.test.ts`. They use `supertest` against a real Express app wired to a real Postgres and a real Redis (`DB 1` on the same instance). `TRUNCATE urls` + `FLUSHDB` before each test guarantees isolation.
- **Frontend tests**: none in this scope. The frontend is a single form; the effort is better spent on UX. Tests would be added if the frontend grew (routing, multiple flows).
- The tests are split via an `INTEGRATION=1` env var, so `npm test` stays fast and Docker-free while `npm run test:integration` is opt-in.

---

## Scaling & production readiness

What's already in place:

- **Stateless backend** → scales horizontally behind a load balancer.
- **Redis cache-aside** on the read path → most redirects never touch Postgres after a warm-up.
- **Distributed rate limiter** on Redis → correct under horizontal scaling.
- **Unique index on `code`** + collision retry → robust up to billions of URLs.
- **Graceful shutdown** on SIGINT/SIGTERM.
- **Body size cap** (10kb JSON) to prevent memory abuse.

What I would add next, in priority order:

1. **Postgres read replicas** for the residual read traffic after the cache.
2. **Edge redirects** — move `GET /:code` to a Cloudflare Worker (or equivalent) reading directly from a KV store synced from Postgres. Redirects then never hit the backend at all.
3. **Async click analytics** — fire-and-forget writes to a queue (SQS/Kafka), aggregate in a warehouse. Never block the redirect on analytics.
4. **Partitioning / archival** on the `urls` table when it grows past a comfortable size.
5. **Multi-region** deployment with geo-DNS and replicated storage for global latency.

---

## Security considerations

Implemented:

- **Strict scheme allow-list** (`http`, `https` only) — blocks `javascript:`, `data:`, `file:`, etc.
- **Google Safe Browsing check** on `POST /shorten` — the URL is checked against Google's threat database (malware, social engineering, unwanted software) before being stored. Unsafe URLs return 400. The integration is optional and fails open: without a `SAFE_BROWSING_API_KEY`, the check is skipped so the project runs out of the box.
- **Parameterized SQL** everywhere. No string concatenation.
- **Rate limiting** to slow down abuse and enumeration.
- **`trust proxy`** correctly set so the rate limiter uses the real client IP behind a load balancer.
- **Non-guessable short codes** — you can't enumerate the URL space by incrementing.
- **No server-side fetching** of user URLs → no SSRF.

Not implemented, would add for production:

- **Additional threat feeds**: complement Safe Browsing with PhishTank, URLhaus, Cloudflare Radar.
- **Warning interstitial** on redirect for fresh or suspicious URLs (page with "Continue to X, are you sure?" button).
- **Abuse reporting endpoint** + workflow to soft-delete reported links.
- **HTTPS everywhere** via TLS termination at the load balancer.
- **Security headers** — `helmet` middleware for HSTS, CSP, X-Content-Type-Options, referrer policy.
- **Strict CORS** if the API is opened to external consumers.
- **Audit logging** for shortening/resolving activity, with request IDs.

---

## Next steps (product & tech)

Product:

- **URL expiration** — add an `expires_at` column, let users pick a TTL, purge with a cron.
- **Custom aliases** (`/my-link`) — reserve some short paths for authenticated users.
- **Click analytics** — count and display redirect counts per code.
- **Authentication** — anonymous shortening is fine as a demo, but production wants per-user history and quotas.

Tech:

- **CI pipeline** (GitHub Actions) — run lint, unit tests, integration tests (with a docker-compose service) on every PR.
- **Structured logging** (pino) with request IDs and correlation.
- **Observability** — Prometheus metrics on cache hit rate, DB latency, rate-limit hits.
- **Configuration** — replace `.env` with a proper secrets manager (SSM, Vault, etc.).
- **Custom error classes** — if the error space grows beyond the current two cases, replace the message-string matching with typed error classes.

---

## AI usage

This project was built with an AI assistant (Kiro/Claude). I paired with the assistant throughout:

- Design discussions (stack, architecture trade-offs, where to draw the hexagonal line).
- TDD cycles on the domain — every domain function was written test-first with the assistant, then implemented.
- Boilerplate scaffolding (Vite, docker-compose, TypeScript configuration).
- README and code explanations.

Every line of code was reviewed and I can walk through any of it. When we hit friction (Jest × nanoid ESM, Postgres unique-violation code, the `beforeEach` accidentally wiping the dev DB), we diagnosed and fixed the actual root cause rather than papering over it.
