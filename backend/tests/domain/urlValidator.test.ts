import { isValidUrl } from '../../src/domain/urlValidator.js';

describe('isValidUrl', () => {
  it('accepts a valid https URL', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
  });

  it('accepts a valid http URL', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
  });

  it('rejects a malformed URL', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
  });

  it('rejects a URL with only a scheme', () => {
    expect(isValidUrl('http://')).toBe(false);
  });

  it('rejects a javascript: URL', () => {
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects a URL longer than 2048 chars', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2048);
    expect(isValidUrl(longUrl)).toBe(false);
  });
});
