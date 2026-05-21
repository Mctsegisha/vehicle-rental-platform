import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:s1vWMxYX0kX9yL3g@db.qymlehvrmuhldctdhrcr.supabase.co:5432/postgres";

if (connectionString) {
  const maskedUrl = connectionString.replace(/:[^@:]+@/, ':****@');
  console.log('Initializing Database Pool with:', maskedUrl.substring(0, 50) + '...');
}

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
