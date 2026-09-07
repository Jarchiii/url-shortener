export type ShortenResult = {
  code: string;
  shortUrl: string;
};

export async function shortenUrl(url: string): Promise<ShortenResult> {
  const res = await fetch('/shorten', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (res.status === 429) {
    throw new Error('Too many requests. Please wait a minute and try again.');
  }
  if (res.status === 410) {
    throw new Error('This URL was flagged as unsafe and can no longer be used.');
  }
  if (res.status === 400) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (body.error === 'unsafe url') {
      throw new Error('This URL was flagged as unsafe (malware or phishing) and cannot be shortened.');
    }
    throw new Error(body.error === 'invalid url' ? 'Please enter a valid http:// or https:// URL.' : body.error ?? 'Invalid URL.');
  }
  if (!res.ok) {
    throw new Error('Something went wrong. Please try again.');
  }
  return (await res.json()) as ShortenResult;
}
