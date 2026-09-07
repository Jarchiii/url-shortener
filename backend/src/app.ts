import express from 'express';
import type { Express } from 'express';
import type { Pool } from 'pg';
import type { Redis } from 'ioredis';
import { createUrlRepository } from './adapters/db/urlRepository.js';
import { createUrlCache } from './adapters/cache/urlCache.js';
import { createRouter } from './adapters/http/routes.js';
import { createRateLimiter } from './adapters/http/rateLimiter.js';
import { generateCode } from './domain/generateCode.js';

type AppDeps = {
  pool: Pool;
  redis: Redis;
  publicBaseUrl: string;
  checkSafety: (url: string) => Promise<'safe' | 'unsafe'>;
};

export const createApp = (deps: AppDeps): Express => {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '10kb' }));

  const repo = createUrlRepository(deps.pool);
  const cache = createUrlCache(deps.redis);
  const rateLimit = createRateLimiter(deps.redis);

  app.post('/shorten', rateLimit);
  app.use(
    createRouter({
      repo,
      cache,
      generateCode,
      checkSafety: deps.checkSafety,
      publicBaseUrl: deps.publicBaseUrl,
    }),
  );

  return app;
};
