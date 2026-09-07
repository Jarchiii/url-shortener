import { Router } from 'express';
import type { Request, Response } from 'express';
import { shorten } from '../../domain/shorten.js';
import { resolve } from '../../domain/resolve.js';
import type { CodeGenerator, SafetyChecker } from '../../domain/ports.js';
import type { createUrlRepository } from '../db/urlRepository.js';
import type { createUrlCache } from '../cache/urlCache.js';
import { renderUnsafePage } from './renderUnsafePage.js';

type RouterDeps = {
  repo: ReturnType<typeof createUrlRepository>;
  cache: ReturnType<typeof createUrlCache>;
  generateCode: CodeGenerator;
  checkSafety: SafetyChecker;
  publicBaseUrl: string;
};

export const createRouter = (deps: RouterDeps): Router => {
  const router = Router();

  router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  router.post('/shorten', async (req: Request, res: Response) => {
    const url = req.body?.url;
    if (typeof url !== 'string') {
      res.status(400).json({ error: 'url must be a string' });
      return;
    }
    try {
      const { code } = await shorten(url, {
        generateCode: deps.generateCode,
        save: deps.repo.save,
        checkSafety: deps.checkSafety,
      });
      res.status(201).json({
        code,
        shortUrl: `${deps.publicBaseUrl}/${code}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown';
      if (message === 'invalid url') {
        res.status(400).json({ error: 'invalid url' });
        return;
      }
      if (message === 'unsafe url') {
        res.status(400).json({ error: 'unsafe url' });
        return;
      }
      if (message === 'could not generate unique code') {
        res.status(500).json({ error: 'could not generate unique code' });
        return;
      }
      throw err;
    }
  });

  router.get<{ code: string }>('/:code', async (req, res) => {
    const url = await resolve(req.params.code, {
      getFromCache: deps.cache.get,
      getFromDb: deps.repo.findByCode,
      setCache: deps.cache.set,
    });
    if (!url) {
      res.status(404).json({ error: 'not found' });
      return;
    }

    const safety = await deps.checkSafety(url);
    if (safety === 'unsafe') {
      const acceptsHtml = req.accepts(['html', 'json']) === 'html';
      if (acceptsHtml) {
        res.status(410).type('html').send(renderUnsafePage(url));
        return;
      }
      res.status(410).json({ error: 'url flagged as unsafe' });
      return;
    }

    res.redirect(302, url);
  });

  return router;
};
