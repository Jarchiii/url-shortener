type ResolveDeps = {
  getFromCache: (code: string) => Promise<string | null>;
  getFromDb: (code: string) => Promise<string | null>;
  setCache: (code: string, url: string) => Promise<void>;
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
