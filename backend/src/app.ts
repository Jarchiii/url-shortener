import { randomUUID } from 'node:crypto';
import express from 'express';
import type { Express, Request, Response } from 'express';
import type { Pool } from 'pg';
import type { Redis } from 'ioredis';
import { pinoHttp } from 'pino-http';
import { createUrlRepository } from './adapters/db/urlRepository.js';
import { createUrlCache } from './adapters/cache/urlCache.js';
import { createRouter } from './adapters/http/routes.js';
import { createRateLimiter } from './adapters/http/rateLimiter.js';
import { createCachedSafetyChecker } from './adapters/safety/cachedSafetyChecker.js';
import { generateCode } from './domain/generateCode.js';
import type { CacheSetter, SafetyChecker } from './domain/ports.js';
import { logger } from './logger.js';

type AppDeps = {
  pool: Pool;
  redis: Redis;
  publicBaseUrl: string;
  checkSafety: SafetyChecker;
};

export const createApp = (deps: AppDeps): Express => {
  const app = express();
  app.set('trust proxy', true);

  app.use(
    pinoHttp({
      logger,
      genReqId: (req: Request, res: Response) => {
        const existing = req.headers['x-request-id'];
        const id = typeof existing === 'string' ? existing : randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },
    }),
  );

  app.use(express.json({ limit: '10kb' }));

  const repo = createUrlRepository(deps.pool);
  const cache = createUrlCache(deps.redis);
  const rateLimit = createRateLimiter(deps.redis);
  const cachedCheckSafety = createCachedSafetyChecker(deps.checkSafety, deps.redis);

  const safeCacheSet: CacheSetter = async (code, url) => {
    try {
      await cache.set(code, url);
    } catch (err) {
      logger.warn({ err, code }, 'cache write failed');
    }
  };

  app.post('/shorten', rateLimit);
  app.use(
    createRouter({
      repo,
      cache: { get: cache.get, set: safeCacheSet },
      generateCode,
      checkSafety: cachedCheckSafety,
      publicBaseUrl: deps.publicBaseUrl,
    }),
  );

  return app;
};
