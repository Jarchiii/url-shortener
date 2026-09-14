import { useEffect, useState } from 'react';
import { fetchAd, type Ad as AdData } from '@/api/ads';

type Props = { width: number; height: number };

type Status = 'loading' | 'loaded' | 'error';

export const Ad = ({ width, height }: Props) => {
  const [ad, setAd] = useState<AdData | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setAd(null);
    fetchAd(width, height)
      .then((data) => {
        if (!cancelled) {
          setAd(data);
          setStatus('loaded');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [width, height]);

  if (status === 'error') return null;

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] uppercase tracking-widest text-slate-400">Sponsored</span>
      {status === 'loading' || !ad ? (
        <div
          role="status"
          aria-label="Loading advertisement"
          className="animate-pulse rounded-lg bg-slate-200 max-w-full"
          style={{ width: `${width}px`, aspectRatio: `${width} / ${height}` }}
        />
      ) : (
        <a
          href={ad.link}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Advertisement"
          className="block overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
        >
          <img
            src={ad.imageUrl}
            width={ad.width}
            height={ad.height}
            alt="Sponsored"
            loading="lazy"
            className="block max-w-full h-auto"
          />
        </a>
      )}
    </div>
  );
};
