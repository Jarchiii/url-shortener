import type { Redis } from 'ioredis';

const CACHE_TTL_SECONDS = 24 * 60 * 60;
const cacheKey = (code: string) => `url:${code}`;

export const createUrlCache = (redis: Redis) => ({
  get: async (code: string): Promise<string | null> => redis.get(cacheKey(code)),

  set: async (code: string, url: string): Promise<void> => {
    await redis.set(cacheKey(code), url, 'EX', CACHE_TTL_SECONDS);
  },
});
