const { createClient } = require('@neondatabase/serverless');

const client = createClient({ connectionString: process.env.NEON_DB_URL });

async function parseJsonBody(req) {
  if (req.body) return req.body;

  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  let body;
  try {
    body = req.body || await parseJsonBody(req);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid JSON body.' });
  }

  const { email } = body || {};
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  if (!process.env.NEON_DB_URL) {
    return res.status(500).json({ error: 'NEON_DB_URL is not configured on the server.' });
  }

  try {
    const result = await client.query(
      'INSERT INTO newsletter_subscribers (email, created_at) VALUES ($1, NOW()) RETURNING id',
      [email]
    );

    return res.status(200).json({ success: true, id: result.rows?.[0]?.id ?? null });
  } catch (error) {
    console.error('Subscribe error:', error);

    const message =
      error?.code === '23505' || /duplicate/i.test(error?.message)
        ? 'This email is already registered.'
        : error?.message || 'Unable to save email address.';

    return res.status(500).json({ error: message });
  }
}
