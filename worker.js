// vortxstream-auth — Cloudflare Worker
// Bind KV namespace: VORTX_USERS

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret',
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

// ── Admin secret check ─────────────────────────────────────────────
// Add ADMIN_SECRET as an Environment Variable in your Cloudflare Worker settings
// It must match VITE_ADMIN_SECRET in your React .env
function isAdmin(request) {
  const secret = request.headers.get('x-admin-secret');
  return secret && secret === ADMIN_SECRET;
}

async function handleRequest(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  const url  = new URL(request.url);
  const path = url.pathname;
  let body   = {};

  try { body = await request.json(); } catch {}

  // ══════════════════════════════════════════════════════════════
  // EXISTING ENDPOINTS — unchanged
  // ══════════════════════════════════════════════════════════════

  // ── POST /signup ──
  if (path === '/signup' && request.method === 'POST') {
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return json({ status: false, msg: 'All fields are required' });
    }

    const existing = await VORTX_USERS.get(email);
    if (existing) {
      return json({ status: false, msg: 'Account already exists with this email' });
    }

    const userData = {
      name,
      email,
      password: btoa(password),
      watchlist: [],
      progress: {},
      createdAt: Date.now(),
      lastSeen: Date.now(),
      watchSeconds: 0,
      lastWatch: null,
    };

    await VORTX_USERS.put(email, JSON.stringify(userData));

    // Track in admin userlist
    const allUsersRaw = await VORTX_USERS.get('__admin:userlist__');
    const allUsers = allUsersRaw ? JSON.parse(allUsersRaw) : [];
    if (!allUsers.includes(email)) {
      allUsers.push(email);
      await VORTX_USERS.put('__admin:userlist__', JSON.stringify(allUsers));
    }

    return json({ status: true, msg: 'Account created', user: { name, email } });
  }

  // ── POST /login ──
  if (path === '/login' && request.method === 'POST') {
    const { email, password } = body;

    if (!email || !password) {
      return json({ status: false, msg: 'All fields are required' });
    }

    const raw = await VORTX_USERS.get(email);
    if (!raw) {
      return json({ status: false, msg: 'No account found with this email' });
    }

    const user = JSON.parse(raw);
    if (user.password !== btoa(password)) {
      return json({ status: false, msg: 'Incorrect password' });
    }
    if (user.banned && (!user.bannedUntil || user.bannedUntil > Date.now())) {
  return json({ status: false, msg: '🚫 Account banned by Admin.' });
}
    // Update last seen
    user.lastSeen = Date.now();
    await VORTX_USERS.put(email, JSON.stringify(user));

    // Auto-add existing users to admin userlist on login
    const allUsersRaw = await VORTX_USERS.get('__admin:userlist__');
    const allUsers = allUsersRaw ? JSON.parse(allUsersRaw) : [];
    if (!allUsers.includes(email)) {
      allUsers.push(email);
      await VORTX_USERS.put('__admin:userlist__', JSON.stringify(allUsers));
    }

    return json({ status: true, msg: 'Login successful', user: { name: user.name, email } });
  }

  // ── POST /watchlist/save ──
  if (path === '/watchlist/save' && request.method === 'POST') {
    const { email, watchlist } = body;
    const raw = await VORTX_USERS.get(email);
    if (!raw) return json({ status: false, msg: 'User not found' });
    const user = JSON.parse(raw);
    user.watchlist = watchlist;
    await VORTX_USERS.put(email, JSON.stringify(user));
    return json({ status: true });
  }

  // ── POST /watchlist/get ──
  if (path === '/watchlist/get' && request.method === 'POST') {
    const { email } = body;
    const raw = await VORTX_USERS.get(email);
    if (!raw) return json({ status: false, msg: 'User not found' });
    const user = JSON.parse(raw);
    return json({ status: true, watchlist: user.watchlist || [] });
  }

  // ── POST /progress/save ──
  if (path === '/progress/save' && request.method === 'POST') {
    const { email, progress } = body;
    const raw = await VORTX_USERS.get(email);
    if (!raw) return json({ status: false, msg: 'User not found' });
    const user = JSON.parse(raw);
    user.progress = progress;
    await VORTX_USERS.put(email, JSON.stringify(user));
    return json({ status: true });
  }

  // ── POST /progress/get ──
  if (path === '/progress/get' && request.method === 'POST') {
    const { email } = body;
    const raw = await VORTX_USERS.get(email);
    if (!raw) return json({ status: false, msg: 'User not found' });
    const user = JSON.parse(raw);
    return json({ status: true, progress: user.progress || {} });
  }

  // ── POST /update-profile ──
  if (path === '/update-profile' && request.method === 'POST') {
    const { email, name, avatar } = body;
    const raw = await VORTX_USERS.get(email);
    if (!raw) return json({ status: false, msg: 'User not found' });
    const user = JSON.parse(raw);
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    await VORTX_USERS.put(email, JSON.stringify(user));
    return json({ status: true, user: { name: user.name, email, avatar: user.avatar } });
  }

  if (path === '/auth/check' && request.method === 'POST') {
  const { email } = body;
  const raw = await VORTX_USERS.get(email);
  if (!raw) return json({ status: false, msg: 'User not found' });
  const user = JSON.parse(raw);
  if (user.banned && (!user.bannedUntil || user.bannedUntil > Date.now())) {
    return json({ status: false, banned: true, msg: '🚫 Account banned by admin.' });
  }
  // Auto-unban if time expired
  if (user.banned && user.bannedUntil && user.bannedUntil <= Date.now()) {
    user.banned = false;
    user.bannedUntil = null;
    await VORTX_USERS.put(email, JSON.stringify(user));
  }
  return json({ status: true, banned: false });
}
  // ══════════════════════════════════════════════════════════════
  // NEW: WATCH TRACKING
  // Call POST /track/watch from DetailPage.jsx when user plays something
  // ══════════════════════════════════════════════════════════════

  if (path === '/track/watch' && request.method === 'POST') {
    const { email, movieId, title, type, watchSeconds = 0 } = body;
    if (!email || !movieId) return json({ status: false, msg: 'Missing fields' });

    try {
      // Update user's last seen + last watched
      const raw = await VORTX_USERS.get(email);
      if (raw) {
        const user = JSON.parse(raw);
        user.lastSeen     = Date.now();
        user.lastWatch    = title;
        user.watchSeconds = (user.watchSeconds || 0) + watchSeconds;
        await VORTX_USERS.put(email, JSON.stringify(user));
      }

      // Update per-movie stats
      const movieKey = `__movie__:${type}:${movieId}`;
      const movieRaw = await VORTX_USERS.get(movieKey);
      const movie    = movieRaw ? JSON.parse(movieRaw) : { movieId, title, type, views: 0, watchSeconds: 0 };
      const lastViewKey = `__lastview__:${email}:${type}:${movieId}`;
const lastView = await VORTX_USERS.get(lastViewKey);
const todayStart = new Date().setHours(0,0,0,0);
const shouldCountView = !lastView || Number(lastView) < todayStart;
movie.views = shouldCountView ? (movie.views || 0) + 1 : (movie.views || 0);
if (shouldCountView) await VORTX_USERS.put(lastViewKey, String(Date.now()));
      movie.watchSeconds = (movie.watchSeconds || 0) + watchSeconds;
      movie.title        = title;
      await VORTX_USERS.put(movieKey, JSON.stringify(movie));

      // Update global top movies list
      const topRaw  = await VORTX_USERS.get('__admin:topmovies__');
      let topMovies = topRaw ? JSON.parse(topRaw) : [];
      const idx     = topMovies.findIndex(m => m.movieId === movieId && m.type === type);
      if (idx > -1) topMovies[idx] = movie;
      else topMovies.push(movie);
      topMovies.sort((a, b) => b.views - a.views);
      topMovies = topMovies.slice(0, 50);
      await VORTX_USERS.put('__admin:topmovies__', JSON.stringify(topMovies));

      return json({ status: true });
    } catch (e) {
      return json({ status: false, msg: e.message });
    }
  }

    if (path === '/review/save' && request.method === 'POST') {
  const { email, movieId, type, rating, text } = body;
  if (!email || !movieId || !rating) return json({ status: false, msg: 'Missing fields' });
  const key = `__review__:${movieId}:${email}`;
  await VORTX_USERS.put(key, JSON.stringify({ email, movieId, type, rating, text, ts: Date.now() }));
  return json({ status: true });
}

if (path === '/review/get' && request.method === 'GET') {
  const movieId = url.searchParams.get('movieId');
  if (!movieId) return json({ status: false, msg: 'Missing movieId' });
  const list = await VORTX_USERS.list({ prefix: `__review__:${movieId}:` });
  const reviews = await Promise.all(list.keys.map(k => VORTX_USERS.get(k.name).then(v => JSON.parse(v))));
  return json({ status: true, reviews });
}

  // ══════════════════════════════════════════════════════════════
  // ADMIN ENDPOINTS — all protected by x-admin-secret header
  // ══════════════════════════════════════════════════════════════

  if (path.startsWith('/admin/')) {
    if (!isAdmin(request)) {
      return json({ status: false, msg: 'Unauthorized' }, 401);
    }

    // GET /admin/stats
    if (path === '/admin/stats' && request.method === 'GET') {
      const allUsersRaw = await VORTX_USERS.get('__admin:userlist__');
      const allUsers    = allUsersRaw ? JSON.parse(allUsersRaw) : [];
      const dayAgo      = Date.now() - 86400000;

      let activeToday       = 0;
      let totalWatchSeconds = 0;

      for (const email of allUsers) {
        const raw = await VORTX_USERS.get(email);
        if (!raw) continue;
        const u = JSON.parse(raw);
        if (u.lastSeen && u.lastSeen > dayAgo) activeToday++;
        totalWatchSeconds += u.watchSeconds || 0;
      }

      const topRaw    = await VORTX_USERS.get('__admin:topmovies__');
      const topMovies = topRaw ? JSON.parse(topRaw) : [];
      const totalViews = topMovies.reduce((a, m) => a + (m.views || 0), 0);

      return json({ status: true, totalUsers: allUsers.length, activeToday, totalWatchSeconds, totalViews });
    }

    // GET /admin/users
    if (path === '/admin/users' && request.method === 'GET') {
      const allUsersRaw = await VORTX_USERS.get('__admin:userlist__');
      const allUsers    = allUsersRaw ? JSON.parse(allUsersRaw) : [];
      const users       = [];

      for (const email of allUsers) {
        const raw = await VORTX_USERS.get(email);
        if (!raw) continue;
        const u = JSON.parse(raw);
        users.push({
          name:         u.name,
          email:        u.email,
          lastSeen:     u.lastSeen || null,
          lastWatch:    u.lastWatch || null,
          watchSeconds: u.watchSeconds || 0,
          createdAt:    u.createdAt || null,
          banned:       u.banned || false, 
        });
      }

      users.sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
      return json({ status: true, users });
    }

    // GET /admin/movies
    if (path === '/admin/movies' && request.method === 'GET') {
      const topRaw = await VORTX_USERS.get('__admin:topmovies__');
      return json({ status: true, movies: topRaw ? JSON.parse(topRaw) : [] });
    }

    // GET /admin/announcements
    if (path === '/admin/announcements' && request.method === 'GET') {
      const raw = await VORTX_USERS.get('__admin:announcements__');
      const announcements = raw ? JSON.parse(raw) : [
        'Use Brave Browser 🦁 to avoid ads',
        'Watchlist feature available',
        'Track your progress',
        'Streaming speed improved',
        'Multiple server added to improve the performance',
        'All the data taken from third party websites',
      ];
      return json({ status: true, announcements });
    }

    // POST /admin/announcements/save
    if (path === '/admin/announcements/save' && request.method === 'POST') {
      const { announcements } = body;
      if (!Array.isArray(announcements)) return json({ status: false, msg: 'Must be array' });
      await VORTX_USERS.put('__admin:announcements__', JSON.stringify(announcements));
      return json({ status: true });
    }

    // DELETE /admin/user/delete
    if (path === '/admin/user/delete' && request.method === 'DELETE') {
      const { email } = body;
      if (!email) return json({ status: false, msg: 'Missing email' });

      await VORTX_USERS.delete(email);

      const allUsersRaw = await VORTX_USERS.get('__admin:userlist__');
      const allUsers    = allUsersRaw ? JSON.parse(allUsersRaw) : [];
      await VORTX_USERS.put('__admin:userlist__', JSON.stringify(allUsers.filter(e => e !== email)));

      return json({ status: true, deleted: email });
    }
if (path === '/admin/user/ban' && request.method === 'POST') {
  const { email, hours } = body;
  if (!email) return json({ status: false, msg: 'Missing email' });
  const raw = await VORTX_USERS.get(email);
  if (!raw) return json({ status: false, msg: 'User not found' });
  const user = JSON.parse(raw);
  user.banned = true;
  user.bannedUntil = hours === -1 ? null : Date.now() + (hours * 60 * 60 * 1000);
  user.bannedAt = Date.now();
  await VORTX_USERS.put(email, JSON.stringify(user));
  return json({ status: true });
}

if (path === '/admin/user/unban' && request.method === 'POST') {
  const { email } = body;
  if (!email) return json({ status: false, msg: 'Missing email' });
  const raw = await VORTX_USERS.get(email);
  if (!raw) return json({ status: false, msg: 'User not found' });
  const user = JSON.parse(raw);
  user.banned = false;
  user.bannedUntil = null;
  await VORTX_USERS.put(email, JSON.stringify(user));
  return json({ status: true });
}

// GET /admin/homepage-notice
if (path === '/admin/homepage-notice' && request.method === 'GET') {
  const text = await VORTX_USERS.get('__homepage_notice__') || '';
  return json({ status: true, notice: text });
}

// POST /admin/homepage-notice/save
if (path === '/admin/homepage-notice/save' && request.method === 'POST') {
  const { notice } = body;
  await VORTX_USERS.put('__homepage_notice__', notice || '');
  return json({ status: true });
}
// GET /admin/maintenance
if (path === '/admin/maintenance' && request.method === 'GET') {
  const raw = await VORTX_USERS.get('__maintenance__') || 'false';
  return json({ status: true, enabled: raw === 'true' });
}

// POST /admin/maintenance
if (path === '/admin/maintenance' && request.method === 'POST') {
  const { enabled } = body;
  await VORTX_USERS.put('__maintenance__', String(!!enabled));
  return json({ status: true });
}

// GET /admin/live-streams
if (path === '/admin/live-streams' && request.method === 'GET') {
  const raw = await VORTX_USERS.get('__live_streams__') || '[]';
  return json({ status: true, streams: JSON.parse(raw) });
}

// POST /admin/live-streams/save
if (path === '/admin/live-streams/save' && request.method === 'POST') {
  const { streams } = body;
  if (!Array.isArray(streams)) return json({ status: false, msg: 'Must be array' });
  await VORTX_USERS.put('__live_streams__', JSON.stringify(streams));
  return json({ status: true });
}

    return json({ status: false, msg: 'Unknown admin endpoint' }, 404);
  }
// GET /homepage-notice — public
if (path === '/homepage-notice' && request.method === 'GET') {
  const text = await VORTX_USERS.get('__homepage_notice__') || '';
  return json({ notice: text });
}

if (path === '/public/announcements' && request.method === 'GET') {
  const raw = await VORTX_USERS.get('__admin:announcements__');
  const announcements = raw ? JSON.parse(raw) : [];
  return json({ announcements });
}
if (path === '/' && request.method === 'GET') {
  return new Response(`<!DOCTYPE html>
<html>
<head>
  <title>VortxStream API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #060d1a; color: #e8f4ff; font-family: 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { text-align: center; padding: 40px; background: rgba(0,200,232,0.06); border: 1px solid rgba(0,200,232,0.2); border-radius: 20px; max-width: 420px; }
    h1 { font-size: 42px; letter-spacing: 0.1em; background: linear-gradient(135deg, #e8f4ff, #00c8e8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; }
    p { color: rgba(232,244,255,0.45); font-size: 14px; margin-bottom: 24px; }
    .badge { display: inline-block; background: rgba(0,200,232,0.15); border: 1px solid rgba(0,200,232,0.3); border-radius: 20px; padding: 6px 18px; font-size: 12px; color: #00c8e8; margin-bottom: 20px; }
    .dot { display: inline-block; width: 8px; height: 8px; background: #7fffb0; border-radius: 50%; margin-right: 6px; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
    .footer { font-size: 12px; color: rgba(232,244,255,0.25); margin-top: 20px; }
    .footer a { color: #00c8e8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>VORTX</h1>
    <p>Backend API - Cloudflare Worker</p>
    <div class="badge"><span class="dot"></span>All Systems Operational</div>
    <div class="footer">Made by <a href="https://www.instagram.com/vortx_43" target="_blank">Subhankar</a></div>
  </div>
</body>
</html>`, {
    status: 200,
    headers: { 'Content-Type': 'text/html', ...CORS }
  });
}

if (path === '/maintenance' && request.method === 'GET') {
  const raw = await VORTX_USERS.get('__maintenance__') || 'false';
  return json({ enabled: raw === 'true' });
}
// GET /live-streams — public
if (path === '/live-streams' && request.method === 'GET') {
  const raw = await VORTX_USERS.get('__live_streams__') || '[]';
  return json({ streams: JSON.parse(raw) });
}

  return json({ status: false, msg: 'Bhaag Bhosdike' }, 404);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}