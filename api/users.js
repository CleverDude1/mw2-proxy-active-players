export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const response = await fetch('https://martiangames.com/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'https://martiangames.com',
        'Referer': 'https://martiangames.com/portal/game/leaderboard',
        'Authorization': 'Bearer d58566b4-d72c-44ef-a931-d9fa9c899106'
      },
      body: 'page=1&limit=10000'
    });

    const text = await response.text();

    // 🔍 DEBUG: log first part of response
    console.log('RAW RESPONSE:', text.slice(0, 300));

    let data;

    try {
      data = JSON.parse(text);
    } catch (e) {
      // ❌ Instead of crashing, return the raw response
      return res.status(500).json({
        error: 'Invalid API response',
        preview: text.slice(0, 200)
      });
    }

    // 🔥 Ensure it's an array
    if (!Array.isArray(data)) {
      return res.status(500).json({
        error: 'Unexpected API format',
        preview: data
      });
    }

    // 🔥 FILTER: last 30 days
    const now = new Date();
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const filtered = data.filter(user => {
      const u = user.current || {};

      if (!u.lastLogin) return false;

      const lastLoginDate = new Date(u.lastLogin);
      if (isNaN(lastLoginDate.getTime())) return false;

      return lastLoginDate >= cutoff;
    });

    console.log(`Original: ${data.length}, Active (30d): ${filtered.length}`);

    res.status(200).json(filtered);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Proxy failed' });
  }
}
