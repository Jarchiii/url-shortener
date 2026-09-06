import { shorten } from '../../src/domain/shorten.js';

const deps = {
  generateCode: () => 'abc1234',
  save: async () => 'saved' as const,
};

describe('shorten', () => {
  it('rejects an invalid URL', async () => {
    await expect(shorten('not-a-url', deps)).rejects.toThrow();
  });

  it('returns the generated code when save succeeds', async () => {
    const result = await shorten('https://example.com', deps);
    expect(result).toEqual({ code: 'abc1234' });
  });

  it('retries on collision and returns the successful code', async () => {
    const codes = ['first00', 'second0'];
    const saveResults: Array<'collision' | 'saved'> = ['collision', 'saved'];
    let genIdx = 0;
    let saveIdx = 0;
    const retryDeps = {
      generateCode: () => codes[genIdx++]!,
      save: async () => saveResults[saveIdx++]!,
    };
    const result = await shorten('https://example.com', retryDeps);
    expect(result).toEqual({ code: 'second0' });
  });

  it('gives up after 5 collisions', async () => {
    let saveCalls = 0;
    const collidingDeps = {
      generateCode: () => 'always00',
      save: async () => {
        saveCalls++;
        return 'collision' as const;
      },
    };
    await expect(shorten('https://example.com', collidingDeps)).rejects.toThrow();
    expect(saveCalls).toBe(5);
  });
});
