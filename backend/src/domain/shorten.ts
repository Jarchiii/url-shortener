import { isValidUrl } from './urlValidator.js';
import type { CodeGenerator, UrlSaver, SafetyChecker } from './ports.js';

const MAX_ATTEMPTS = 5;

type ShortenDeps = {
  generateCode: CodeGenerator;
  save: UrlSaver;
  checkSafety: SafetyChecker;
};

export async function shorten(url: string, deps: ShortenDeps): Promise<{ code: string }> {
  if (!isValidUrl(url)) throw new Error('invalid url');

  const safety = await deps.checkSafety(url);
  if (safety === 'unsafe') throw new Error('unsafe url');

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = deps.generateCode();
    const result = await deps.save(code, url);
    if (result === 'saved') return { code };
  }
  throw new Error('could not generate unique code');
}
