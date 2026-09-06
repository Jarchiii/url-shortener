import { readFile } from 'node:fs/promises';
import { Client } from 'pg';

const useTestDb = process.argv.includes('--test');
const databaseUrl = useTestDb ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(useTestDb ? 'TEST_DATABASE_URL is required.' : 'DATABASE_URL is required.');
  process.exit(1);
}

const client = new Client({ connectionString: databaseUrl });
await client.connect();

const sql = await readFile(new URL('../migrations/001_init.sql', import.meta.url), 'utf8');
await client.query(sql);
await client.end();

console.log(`Migration applied to ${useTestDb ? 'test' : 'dev'} database.`);
