import type { CacheGetter, CacheSetter, UrlLoader } from './ports.js';

type ResolveDeps = {
  getFromCache: CacheGetter;
  getFromDb: UrlLoader;
  setCache: CacheSetter;
};

export async function resolve(code: string, deps: ResolveDeps): Promise<string | null> {
  const cached = await deps.getFromCache(code);
  if (cached !== null) return cached;

  const fromDb = await deps.getFromDb(code);
  if (fromDb === null) return null;

  deps.setCache(code, fromDb).catch((err) => {
    console.warn('cache write failed', err);
  });

  return fromDb;
}
