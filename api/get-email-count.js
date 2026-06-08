import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.NEON_DB_URL,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM emails');
    const count = result.rows[0].count;
    res.status(200).json({ count: parseInt(count) });
  } catch (err) {
    console.error('Error getting email count:', err.message);
    res.status(500).json({ error: 'Failed to get email count' });
  }
}
