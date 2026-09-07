import { createCachedSafetyChecker } from '../../src/adapters/safety/cachedSafetyChecker.js';
import type { SafetyChecker } from '../../src/domain/ports.js';

const createFakeRedis = () => {
  const store = new Map<string, string>();
  return {
    get: async (key: string) => store.get(key) ?? null,
    set: async (key: string, value: string) => {
      store.set(key, value);
    },
    _store: store,
  };
};

describe('cachedSafetyChecker', () => {
  it('returns the base checker result on cache miss and stores it', async () => {
    const redis = createFakeRedis();
    let baseCalls = 0;
    const base: SafetyChecker = async () => {
      baseCalls++;
      return 'safe';
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const checker = createCachedSafetyChecker(base, redis as any);

    const result = await checker('https://example.com');

    expect(result).toBe('safe');
    expect(baseCalls).toBe(1);
    expect(redis._store.size).toBe(1);
  });

  it('serves subsequent calls from cache without hitting the base checker', async () => {
    const redis = createFakeRedis();
    let baseCalls = 0;
    const base: SafetyChecker = async () => {
      baseCalls++;
      return 'unsafe';
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const checker = createCachedSafetyChecker(base, redis as any);

    await checker('https://phishing.example.com');
    await checker('https://phishing.example.com');
    await checker('https://phishing.example.com');

    expect(baseCalls).toBe(1);
  });

  it('distinguishes verdicts across different URLs', async () => {
    const redis = createFakeRedis();
    const base: SafetyChecker = async (url) =>
      url.includes('bad') ? 'unsafe' : 'safe';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const checker = createCachedSafetyChecker(base, redis as any);

    expect(await checker('https://good.example.com')).toBe('safe');
    expect(await checker('https://bad.example.com')).toBe('unsafe');
  });
});
