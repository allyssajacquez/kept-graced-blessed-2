// api/bible.js — Vercel serverless function
// Acts as a proxy between the app and bolls.life to bypass CORS

export default async function handler(req, res) {
  // Allow requests from our own app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { book, chapter, verse } = req.query;

  if (!book || !chapter) {
    return res.status(400).json({ error: 'Missing book or chapter' });
  }

  try {
    const url = `https://bolls.life/get-text/NKJV/${book}/${chapter}/`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`bolls.life returned ${response.status}`);
    }

    const data = await response.json();

    // If a specific verse is requested, filter to just that one
    if (verse) {
      const verseNum = parseInt(verse);
      const found = data.find(v => v.verse === verseNum);
      return res.status(200).json(found ? [found] : data.slice(0, 1));
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Bible proxy error:', err);
    return res.status(500).json({ error: 'Failed to fetch scripture', message: err.message });
  }
}
