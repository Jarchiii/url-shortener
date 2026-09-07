import { resolve } from '../../src/domain/resolve.js';

describe('resolve', () => {
  it('returns URL from cache and does not query the DB on cache hit', async () => {
    let dbCalls = 0;
    const deps = {
      getFromCache: async () => 'https://example.com',
      getFromDb: async () => {
        dbCalls++;
        return null;
      },
      setCache: async () => {},
    };
    const result = await resolve('abc1234', deps);
    expect(result).toBe('https://example.com');
    expect(dbCalls).toBe(0);
  });

  it('falls back to DB on cache miss and populates the cache', async () => {
    const cacheWrites: Array<{ code: string; url: string }> = [];
    const deps = {
      getFromCache: async () => null,
      getFromDb: async () => 'https://example.com',
      setCache: async (code: string, url: string) => {
        cacheWrites.push({ code, url });
      },
    };
    const result = await resolve('abc1234', deps);
    expect(result).toBe('https://example.com');
    expect(cacheWrites).toEqual([{ code: 'abc1234', url: 'https://example.com' }]);
  });

  it('returns null when the code exists in neither cache nor DB', async () => {
    const cacheWrites: Array<{ code: string; url: string }> = [];
    const deps = {
      getFromCache: async () => null,
      getFromDb: async () => null,
      setCache: async (code: string, url: string) => {
        cacheWrites.push({ code, url });
      },
    };
    const result = await resolve('missing', deps);
    expect(result).toBeNull();
    expect(cacheWrites).toEqual([]);
  });

  it('returns the URL even if the cache write fails after a DB hit', async () => {
    const deps = {
      getFromCache: async () => null,
      getFromDb: async () => 'https://example.com',
      setCache: async () => {
        throw new Error('redis down');
      },
    };
    const result = await resolve('abc1234', deps);
    expect(result).toBe('https://example.com');
  });
});
