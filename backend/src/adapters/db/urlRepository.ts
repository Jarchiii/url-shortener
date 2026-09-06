import type { Pool } from 'pg';

const UNIQUE_VIOLATION = '23505';

export const createUrlRepository = (pool: Pool) => ({
  save: async (code: string, url: string): Promise<'saved' | 'collision'> => {
    try {
      await pool.query('INSERT INTO urls (code, long_url) VALUES ($1, $2)', [code, url]);
      return 'saved';
    } catch (err) {
      if ((err as { code?: string }).code === UNIQUE_VIOLATION) return 'collision';
      throw err;
    }
  },

  findByCode: async (code: string): Promise<string | null> => {
    const result = await pool.query<{ long_url: string }>(
      'SELECT long_url FROM urls WHERE code = $1',
      [code],
    );
    return result.rows[0]?.long_url ?? null;
  },
});
