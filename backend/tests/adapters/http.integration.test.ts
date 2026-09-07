import request from 'supertest';
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import type { Express } from 'express';
import { createApp } from '../../src/app.js';
import { alwaysSafe } from '../../src/adapters/safety/safeBrowsing.js';
import type { SafetyChecker } from '../../src/domain/ports.js';

const DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:55432/url_shortener_test';
const REDIS_URL = process.env.TEST_REDIS_URL ?? 'redis://localhost:56379/1';

let pool: Pool;
let redis: Redis;
let app: Express;
let currentSafetyVerdict: 'safe' | 'unsafe' = 'safe';

const configurableSafetyChecker: SafetyChecker = async () => currentSafetyVerdict;

beforeAll(() => {
  pool = new Pool({ connectionString: DATABASE_URL });
  redis = new Redis(REDIS_URL);
  app = createApp({
    pool,
    redis,
    publicBaseUrl: 'http://test.local',
    checkSafety: configurableSafetyChecker,
  });
});

afterAll(async () => {
  await pool.end();
  redis.disconnect();
});

beforeEach(async () => {
  await pool.query('TRUNCATE urls');
  await redis.flushdb();
  currentSafetyVerdict = 'safe';
});

describe('HTTP integration', () => {
  it('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('POST /shorten creates a short URL', async () => {
    const res = await request(app).post('/shorten').send({ url: 'https://example.com' });
    expect(res.status).toBe(201);
    expect(res.body.code).toMatch(/^[A-Za-z0-9]{7}$/);
    expect(res.body.shortUrl).toBe(`http://test.local/${res.body.code}`);
  });

  it('POST /shorten rejects an invalid URL with 400', async () => {
    const res = await request(app).post('/shorten').send({ url: 'not-a-url' });
    expect(res.status).toBe(400);
  });

  it('POST /shorten rejects a missing URL with 400', async () => {
    const res = await request(app).post('/shorten').send({});
    expect(res.status).toBe(400);
  });

  it('GET /:code redirects (302) to the long URL', async () => {
    const created = await request(app)
      .post('/shorten')
      .send({ url: 'https://example.com/path' });
    const code = created.body.code;

    const res = await request(app).get(`/${code}`);
    expect(res.status).toBe(302);
    expect(res.header.location).toBe('https://example.com/path');
  });

  it('GET /:code returns 404 for unknown code', async () => {
    const res = await request(app).get('/unknown');
    expect(res.status).toBe(404);
  });

  it('GET /:code returns 410 JSON when the URL is now flagged as unsafe', async () => {
    const created = await request(app)
      .post('/shorten')
      .send({ url: 'https://example.com/was-safe-at-creation' });
    const code = created.body.code;

    // The safety verdict flips to unsafe after creation.
    currentSafetyVerdict = 'unsafe';
    await redis.flushdb(); // clear the verdict cache so the checker is asked again

    const res = await request(app).get(`/${code}`).set('Accept', 'application/json');
    expect(res.status).toBe(410);
    expect(res.body).toEqual({ error: 'url flagged as unsafe' });
  });

  it('GET /:code returns 410 HTML interstitial when a browser requests it', async () => {
    const created = await request(app)
      .post('/shorten')
      .send({ url: 'https://example.com/was-safe-at-creation' });
    const code = created.body.code;

    currentSafetyVerdict = 'unsafe';
    await redis.flushdb();

    const res = await request(app).get(`/${code}`).set('Accept', 'text/html');
    expect(res.status).toBe(410);
    expect(res.header['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('Safety warning');
  });

  it('returns a clean JSON 500 when the database is unreachable', async () => {
    const brokenPool = new Pool({ connectionString: DATABASE_URL });
    await brokenPool.end(); // any subsequent query throws
    const brokenApp = createApp({
      pool: brokenPool,
      redis,
      publicBaseUrl: 'http://test.local',
      checkSafety: alwaysSafe,
    });

    const res = await request(brokenApp)
      .post('/shorten')
      .send({ url: 'https://example.com/db-down' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'internal server error' });
    expect(res.header['content-type']).toMatch(/application\/json/);
    expect(res.text).not.toContain('at Pool'); // no stacktrace leaked
  });
});
