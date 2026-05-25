import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("CRITICAL ERROR: DATABASE_URL environment variable is not defined!");
  process.exit(1);
}

const maskedUrl = connectionString.replace(/:[^@:]+@/, ':****@');
console.log('Initializing Database Pool with:', maskedUrl.substring(0, 60) + '...');

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 500) {
      console.warn(`[DB] Slow query (${duration}ms):`, text.substring(0, 100));
    }
    return result;
  } catch (err: any) {
    console.error('Database Query Error:', {
      text,
      message: err.message,
      code: err.code
    });
    throw err;
  }
};

export default pool;
