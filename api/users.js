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

    // 🔥 Parse safely
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Invalid JSON:', text.slice(0, 200));
      return res.status(500).json({ error: 'Invalid API response' });
    }

    // 🔥 FILTER: only players active in last 30 days
    const now = new Date();
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const filtered = data.filter(user => {
      const u = user.current || {};

      if (!u.lastLogin) return false;

      const lastLoginDate = new Date(u.lastLogin);

      // Remove invalid dates
      if (isNaN(lastLoginDate.getTime())) return false;

      return lastLoginDate >= cutoff;
    });

    // Optional debug
    console.log(`Original: ${data.length}, Active (30d): ${filtered.length}`);

    // ✅ Return filtered data
    res.status(200).json(filtered);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Proxy failed' });
  }
}
