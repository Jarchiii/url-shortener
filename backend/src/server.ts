import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3000);
const databaseUrl = process.env.DATABASE_URL;
const redisUrl = process.env.REDIS_URL;
const publicBaseUrl = process.env.PUBLIC_BASE_URL ?? `http://localhost:${port}`;

if (!databaseUrl || !redisUrl) {
  console.error('DATABASE_URL and REDIS_URL are required.');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });
const redis = new Redis(redisUrl);

const app = createApp({ pool, redis, publicBaseUrl });

const server = app.listen(port, () => {
  console.log(`Server listening on ${publicBaseUrl}`);
});

const shutdown = async () => {
  console.log('Shutting down...');
  server.close();
  await pool.end();
  redis.disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
