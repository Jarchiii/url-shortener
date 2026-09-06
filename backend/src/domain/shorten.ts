import { isValidUrl } from './urlValidator.js';

const MAX_ATTEMPTS = 5;

type ShortenDeps = {
  generateCode: () => string;
  save: (code: string, url: string) => Promise<'saved' | 'collision'>;
};

export async function shorten(url: string, deps: ShortenDeps): Promise<{ code: string }> {
  if (!isValidUrl(url)) throw new Error('invalid url');
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = deps.generateCode();
    const result = await deps.save(code, url);
    if (result === 'saved') return { code };
  }
  throw new Error('could not generate unique code');
}
