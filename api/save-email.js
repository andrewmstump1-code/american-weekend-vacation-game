import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.NEON_DB_URL,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO emails (email) VALUES ($1) ON CONFLICT (email) DO NOTHING RETURNING *',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    res.status(200).json({ success: true, message: 'Email saved successfully' });
  } catch (err) {
    console.error('Error saving email:', err.message);
    res.status(500).json({ error: 'Failed to save email' });
  }
}
