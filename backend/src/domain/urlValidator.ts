const MAX_URL_LENGTH = 2048;

export function isValidUrl(url: string): boolean {
  if (url.length > MAX_URL_LENGTH) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
