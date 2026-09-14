import { createHash } from 'node:crypto';
import type { Redis } from 'ioredis';
import type { SafetyChecker, SafetyResult } from '../../domain/ports.js';
import { logger } from '../../logger.js';

const VERDICT_TTL_SECONDS = 60 * 60; // 1 hour

const verdictKey = (url: string): string => {
  const hash = createHash('sha256').update(url).digest('hex').slice(0, 16);
  return `safety:${hash}`;
};

const isSafetyResult = (value: string | null): value is SafetyResult =>
  value === 'safe' || value === 'unsafe';

export const createCachedSafetyChecker = (
  base: SafetyChecker,
  redis: Pick<Redis, 'get' | 'set'>,
): SafetyChecker => {
  return async (url) => {
    const key = verdictKey(url);

    try {
      const cached = await redis.get(key);
      if (isSafetyResult(cached)) return cached;
    } catch (err) {
      logger.warn({ err }, 'safety cache read failed');
      // fall through to base checker
    }

    const verdict = await base(url);

    try {
      await redis.set(key, verdict, 'EX', VERDICT_TTL_SECONDS);
    } catch (err) {
      logger.warn({ err }, 'safety cache write failed');
      // ignore — verdict is still returned
    }

    return verdict;
  };
};
