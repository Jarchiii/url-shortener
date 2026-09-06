import { generateCode } from '../../src/domain/generateCode.js';

describe('generateCode', () => {
  it('returns a 7-character string', () => {
    expect(generateCode()).toHaveLength(7);
  });

  it('uses only base62 characters (A-Z, a-z, 0-9)', () => {
    const samples = Array.from({ length: 100 }, () => generateCode());
    for (const code of samples) {
      expect(code).toMatch(/^[A-Za-z0-9]+$/);
    }
  });

  it('produces different codes on successive calls', () => {
    expect(generateCode()).not.toBe(generateCode());
  });
});
