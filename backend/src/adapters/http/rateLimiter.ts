import type { Request, Response, NextFunction } from 'express';
import type { Redis } from 'ioredis';
import { RateLimiterRedis } from 'rate-limiter-flexible';

const POINTS = 10;
const DURATION_SECONDS = 60;

export const createRateLimiter = (redis: Redis) => {
  const limiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'rl:shorten',
    points: POINTS,
    duration: DURATION_SECONDS,
  });

  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip ?? 'unknown';
    try {
      await limiter.consume(ip);
      next();
    } catch {
      res.status(429).json({ error: 'too many requests' });
    }
  };
};
