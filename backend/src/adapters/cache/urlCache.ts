import type { Redis } from 'ioredis';
import type { CacheGetter, CacheSetter } from '../../domain/ports.js';

const CACHE_TTL_SECONDS = 24 * 60 * 60;
const cacheKey = (code: string) => `url:${code}`;

export const createUrlCache = (redis: Redis): { get: CacheGetter; set: CacheSetter } => ({
  get: async (code) => redis.get(cacheKey(code)),

  set: async (code, url) => {
    await redis.set(cacheKey(code), url, 'EX', CACHE_TTL_SECONDS);
  },
});
