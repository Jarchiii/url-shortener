import request from 'supertest';
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import type { Express } from 'express';
import { createApp } from '../../src/app.js';

const DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:55432/url_shortener_test';
const REDIS_URL = process.env.TEST_REDIS_URL ?? 'redis://localhost:56379/1';

let pool: Pool;
let redis: Redis;
let app: Express;

beforeAll(() => {
  pool = new Pool({ connectionString: DATABASE_URL });
  redis = new Redis(REDIS_URL);
  app = createApp({ pool, redis, publicBaseUrl: 'http://test.local' });
});

afterAll(async () => {
  await pool.end();
  redis.disconnect();
});

beforeEach(async () => {
  await pool.query('TRUNCATE urls');
  await redis.flushdb();
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
});
