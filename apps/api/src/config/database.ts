import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('✅ Database connected');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
}

export async function getClient() {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const originalRelease = client.release.bind(client);

  // Monkey patch the query method to track queries
  client.query = (...args: any[]) => {
    const start = Date.now();
    return originalQuery(...args).then((res: any) => {
      const duration = Date.now() - start;
      console.log('Executed query', { duration, rows: res.rowCount });
      return res;
    });
  };

  // Monkey patch the release method to log
  client.release = () => {
    client.query = originalQuery;
    client.release = originalRelease;
    return originalRelease();
  };

  return client;
}

export default pool;
