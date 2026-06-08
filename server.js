import express from 'express';
import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Neon Database Connection
const pool = new Pool({
  connectionString: process.env.NEON_DB_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Initialize database table
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS emails (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database table initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err.message);
  }
}

// API endpoint to save email
app.post('/api/save-email', async (req, res) => {
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

    console.log('Email saved:', email);
    res.status(200).json({ success: true, message: 'Email saved successfully' });
  } catch (err) {
    console.error('Error saving email:', err.message);
    res.status(500).json({ error: 'Failed to save email: ' + err.message });
  }
});

// API endpoint to get email count
app.get('/api/get-email-count', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM emails');
    const count = result.rows[0].count;
    res.status(200).json({ count: parseInt(count) });
  } catch (err) {
    console.error('Error getting email count:', err.message);
    res.status(500).json({ error: 'Failed to get email count' });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`\n🚀 Server starting on http://localhost:${PORT}`);
  await initializeDatabase();
  if (!process.env.NEON_DB_URL) {
    console.warn('⚠️  WARNING: NEON_DB_URL not set in .env file!');
    console.warn('📝 Please add your Neon connection string to .env');
  } else {
    console.log('✅ Database connection string configured');
  }
});
