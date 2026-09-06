import { useState } from 'react';
import type { FormEvent } from 'react';
import { shortenUrl, type ShortenResult } from '@/api/shortener';
import { CopyButton } from '@/components/CopyButton';

export const ShortenerForm = () => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<ShortenResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const shortened = await shortenUrl(url.trim());
      setResult(shortened);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="url"
          inputMode="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://your-very-long-url.example.com/..."
          required
          className="flex-1 rounded-md border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="URL to shorten"
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="rounded-md bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {loading ? 'Shortening…' : 'Shorten'}
        </button>
      </form>

      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Your short URL</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              href={result.shortUrl}
              target="_blank"
              rel="noreferrer"
              className="break-all text-lg font-medium text-indigo-700 hover:underline"
            >
              {result.shortUrl}
            </a>
            <CopyButton text={result.shortUrl} />
          </div>
        </div>
      ) : null}
    </div>
  );
};
