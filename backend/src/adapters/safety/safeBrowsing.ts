import type { SafetyChecker, SafetyResult } from '../../domain/ports.js';
import { logger } from '../../logger.js';

const SAFE_BROWSING_ENDPOINT = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

export const createSafeBrowsingChecker = (apiKey: string): SafetyChecker => {
  return async (url: string): Promise<SafetyResult> => {
    try {
      const response = await fetch(`${SAFE_BROWSING_ENDPOINT}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { clientId: 'url-shortener', clientVersion: '0.1.0' },
          threatInfo: {
            threatTypes: [
              'MALWARE',
              'SOCIAL_ENGINEERING',
              'UNWANTED_SOFTWARE',
              'POTENTIALLY_HARMFUL_APPLICATION',
            ],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }],
          },
        }),
      });

      if (!response.ok) {
        logger.warn({ status: response.status }, 'safe browsing check failed');
        return 'safe';
      }

      const data = (await response.json()) as { matches?: unknown[] };
      return data.matches && data.matches.length > 0 ? 'unsafe' : 'safe';
    } catch (err) {
      logger.warn({ err }, 'safe browsing check errored');
      return 'safe';
    }
  };
};

export const alwaysSafe: SafetyChecker = async () => 'safe';
