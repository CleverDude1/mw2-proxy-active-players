export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const response = await fetch('https://martiangames.com/api/players', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',

        // Required headers
        'Origin': 'https://martiangames.com',
        'Referer': 'https://martiangames.com/portal/game/lookup',

        // 🔥 Use fresh token (this one may expire!)
        'Authorization': 'Bearer 7d8de215-66d0-46f6-8e1c-98242026b97c'
      },

      // Adjust if needed (depends on API behavior)
      body: 'page=1&limit=1000'
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return res.status(500).json({
        error: 'Invalid API response',
        preview: text.slice(0, 200)
      });
    }

    if (!Array.isArray(data)) {
      return res.status(500).json({
        error: 'Unexpected API format',
        preview: data
      });
    }

    // 🔥 FILTER: last 30 days only
    const now = new Date();
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const filtered = data.filter(user => {
      const lastLogin = user.current?.lastLogin;

      if (!lastLogin) return false;

      const date = new Date(lastLogin);
      if (isNaN(date.getTime())) return false;

      return date >= cutoff;
    });

    console.log(`Original: ${data.length}, Active (30d): ${filtered.length}`);

    res.status(200).json(filtered);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Proxy failed' });
  }
}
