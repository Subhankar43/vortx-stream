import React, { useState, useEffect, useCallback } from 'react';
import { WORKER_URL } from '../utils/tmdb';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS || 'admin123';
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || 'vortx-admin-secret';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
async function adminFetch(path, options = {}) {
  const res = await fetch(`${WORKER_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': ADMIN_SECRET,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function formatTime(seconds) {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function timeAgo(ts) {
  if (!ts) return 'Never';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─────────────────────────────────────────────
// Password Gate
// ─────────────────────────────────────────────
function PasswordGate({ onAuth }) {
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [shake, setShake] = useState(false);

  function attempt() {
    if (pass === ADMIN_PASS) {
      sessionStorage.setItem('vx-admin-auth', '1');
      onAuth();
    } else {
      setErr('Wrong password');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }

  return (
    <div style={gateStyles.bg}>
      <div style={gateStyles.glow1} />
      <div style={gateStyles.glow2} />
      <div style={{ ...gateStyles.card, animation: shake ? 'vx-shake 0.4s ease' : 'none' }}>
        <div style={gateStyles.logo}>VORTX<span style={gateStyles.logoAccent}>ADMIN</span></div>
        <p style={gateStyles.sub}>Restricted Area — Authorised Access Only</p>
        <div style={gateStyles.shieldWrap}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent,#00c8e8)" strokeWidth="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <input
          type="password"
          placeholder="Admin Password"
          value={pass}
          onChange={e => { setPass(e.target.value); setErr(''); }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          style={gateStyles.input}
          autoFocus
        />
        {err && <p style={gateStyles.err}>{err}</p>}
        <button onClick={attempt} style={gateStyles.btn}>Enter Admin Panel →</button>
      </div>
      <style>{`
        @keyframes vx-shake {
          0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)}
        }
        @keyframes vx-pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
      `}</style>
    </div>
  );
}

const gateStyles = {
  bg: {
    position: 'fixed', inset: 0,
    background: 'linear-gradient(135deg, #060d1a 0%, #020509 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Outfit', sans-serif", padding: '16px',
  },
  glow1: {
    position: 'absolute', top: '20%', left: '15%',
    width: 400, height: 400, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,200,232,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  glow2: {
    position: 'absolute', bottom: '15%', right: '10%',
    width: 300, height: 300, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    width: '100%', maxWidth: 400, padding: '40px 32px',
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(0,200,232,0.2)',
    borderRadius: 20,
    boxShadow: '0 0 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
    textAlign: 'center',
  },
  logo: { fontFamily: "'Bebas Neue', cursive", fontSize: 36, letterSpacing: '0.1em', color: '#e8f4ff', marginBottom: 4 },
  logoAccent: { background: 'linear-gradient(135deg, #00c8e8, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginLeft: 6 },
  sub: { fontSize: 12, color: 'rgba(232,244,255,0.4)', marginBottom: 24 },
  shieldWrap: { display: 'flex', justifyContent: 'center', marginBottom: 28, animation: 'vx-pulse 2.5s ease infinite' },
  input: { width: '100%', padding: '12px 16px', background: 'rgba(0,200,232,0.06)', border: '1px solid rgba(0,200,232,0.25)', borderRadius: 10, color: '#e8f4ff', fontSize: 14, fontFamily: 'inherit', outline: 'none', marginBottom: 8, boxSizing: 'border-box' },
  err: { fontSize: 12, color: '#e50914', marginBottom: 10 },
  btn: { width: '100%', padding: '13px', background: 'linear-gradient(135deg, #00c8e8, #0ea5e9)', border: 'none', borderRadius: 10, color: '#060d1a', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 },
};

// ─────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = '#00c8e8' }) {
  return (
    <div style={panelStyles.statCard}>
      <div style={{ ...panelStyles.statIcon, color }}>{icon}</div>
      <div style={panelStyles.statVal}>{value ?? '—'}</div>
      <div style={panelStyles.statLabel}>{label}</div>
      {sub && <div style={panelStyles.statSub}>{sub}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────
// User Card (mobile)
// ─────────────────────────────────────────────
function UserCard({ u, onBan, onUnban, onDelete }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,200,232,0.1)', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#e8f4ff' }}>{u.name || '—'}</div>
          <div style={{ fontSize: 11, color: 'rgba(232,244,255,0.4)', marginTop: 2 }}>{u.email}</div>
        </div>
        {u.banned && <span style={{ fontSize: 10, background: 'rgba(229,9,20,0.15)', border: '1px solid rgba(229,9,20,0.3)', color: '#e50914', padding: '2px 8px', borderRadius: 20 }}>BANNED</span>}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(232,244,255,0.5)', marginBottom: 4 }}>
        {u.lastWatch ? `▶ ${u.lastWatch}` : 'No watch history'}
      </div>
      <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'rgba(232,244,255,0.4)', marginBottom: 10 }}>
        <span>⏱ {formatTime(u.watchSeconds)}</span>
        <span>•</span>
        <span>👁 {timeAgo(u.lastSeen)}</span>
        {u.createdAt && <><span>•</span><span>📅 {new Date(u.createdAt).toLocaleDateString()}</span></>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {u.banned ? (
          <button onClick={() => onUnban(u.email)} style={{ flex: 1, padding: '7px', borderRadius: 7, background: 'rgba(0,200,232,0.12)', border: '1px solid rgba(0,200,232,0.3)', color: '#00c8e8', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>✅ Unban</button>
        ) : (
          <select onChange={e => { if (e.target.value) onBan(u.email, Number(e.target.value)); e.target.value = ''; }}
            style={{ flex: 1, padding: '7px', borderRadius: 7, background: '#0a1628', border: '1px solid rgba(255,165,0,0.3)', color: '#f59e0b', fontSize: 12, cursor: 'pointer' }}>
            <option value="">⏸ Ban...</option>
            <option value="1">1 Hour</option>
            <option value="24">24 Hours</option>
            <option value="168">7 Days</option>
            <option value="-1">Permanent</option>
          </select>
        )}
        <button onClick={() => onDelete(u.email)} style={{ padding: '7px 12px', borderRadius: 7, background: 'rgba(229,9,20,0.12)', border: '1px solid rgba(229,9,20,0.2)', color: '#e50914', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>🗑</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Panel
// ─────────────────────────────────────────────
function AdminPanel({ onLogout }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [movies, setMovies] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [annText, setAnnText] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [delConfirm, setDelConfirm] = useState(null);
  const [banLoading, setBanLoading] = useState('');
  const [noticeText, setNoticeText] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [serverStatus, setServerStatus] = useState({});
  const [serverChecking, setServerChecking] = useState(false);
  const [liveStreams, setLiveStreams] = useState([]);
const [streamForm, setStreamForm] = useState({ poster: '', url: '', title: '', time: '' });

  // ── Resize listener ──
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadAll = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [statsData, usersData, moviesData, annData] = await Promise.allSettled([
        adminFetch('/admin/stats'),
        adminFetch('/admin/users'),
        adminFetch('/admin/movies'),
        adminFetch('/admin/announcements'),
      ]);
      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (usersData.status === 'fulfilled') setUsers(usersData.value.users || []);
      if (moviesData.status === 'fulfilled') setMovies(moviesData.value.movies || []);
      if (annData.status === 'fulfilled') setAnnouncements(annData.value.announcements || []);
      const noticeData = await adminFetch('/admin/homepage-notice').catch(() => ({ notice: '' }));
      if (noticeData.notice !== undefined) setNoticeText(noticeData.notice);
      const maintData = await adminFetch('/admin/maintenance').catch(() => ({ enabled: false }));
      if (maintData.enabled !== undefined) setMaintenance(maintData.enabled);
    const streamData = await adminFetch('/admin/live-streams').catch(() => ({ streams: [] }));
if (streamData.streams) setLiveStreams(streamData.streams);
    } catch (e) {
      setError('Failed to load data. Make sure your Worker has the admin endpoints deployed.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => loadAll(), 15000);
    return () => clearInterval(id);
  }, [autoRefresh, loadAll]);

  async function handleBanUser(email) {
    setBanLoading(email);
    try {
      await adminFetch('/admin/user/delete', { method: 'DELETE', body: JSON.stringify({ email }) });
      setUsers(prev => prev.filter(u => u.email !== email));
      showToast(`✅ User ${email} deleted`);
    } catch { showToast('❌ Failed to delete user'); }
    setBanLoading(''); setDelConfirm(null);
  }

  async function handleTempBan(email, hours) {
    try {
      await adminFetch('/admin/user/ban', { method: 'POST', body: JSON.stringify({ email, hours }) });
      setUsers(prev => prev.map(u => u.email === email ? { ...u, banned: true } : u));
      showToast(`✅ User banned ${hours === -1 ? 'permanently' : `for ${hours}h`}`);
    } catch { showToast('❌ Ban failed'); }
  }

  async function handleUnban(email) {
    try {
      await adminFetch('/admin/user/unban', { method: 'POST', body: JSON.stringify({ email }) });
      setUsers(prev => prev.map(u => u.email === email ? { ...u, banned: false } : u));
      showToast('✅ User unbanned');
    } catch { showToast('❌ Unban failed'); }
  }

  async function saveAnnouncements() {
    setSaving(true);
    try {
      const newList = annText.split('\n').map(s => s.trim()).filter(Boolean);
      await adminFetch('/admin/announcements/save', { method: 'POST', body: JSON.stringify({ announcements: newList }) });
      setAnnouncements(newList);
      showToast('✅ Announcements saved!');
    } catch { showToast('❌ Save failed'); }
    setSaving(false);
  }

  async function checkServers() {
    setServerChecking(true); setServerStatus({});
    const servers = [
      { id: 'videasy', url: 'https://player.videasy.to' },
      { id: 'vidking', url: 'https://www.vidking.net' },
      { id: 'vidfast', url: 'https://vidfast.pro' },
      { id: 'rive',    url: 'https://rivestream.ru' },
      { id: 'vidsrc',  url: 'https://vsembed.su' },
      { id: 'vidzen',  url: 'https://vidzen.fun' },
      { id: '111movies', url: 'https://111movies.net' },
      { id: 'vidapi',  url: 'https://vidapi.xyz' },
    ];
    const results = {};
    await Promise.all(servers.map(async s => {
      try { await fetch(s.url, { mode: 'no-cors', signal: AbortSignal.timeout(10000) }); results[s.id] = 'online'; }
      catch { results[s.id] = 'offline'; }
    }));
    setServerStatus(results); setServerChecking(false);
    const onlineCount = Object.values(results).filter(v => v === 'online').length;
    showToast(`✅ Check complete — ${onlineCount}/${servers.length} servers online`);
  }
  async function saveLiveStream() {
  if (!streamForm.poster || !streamForm.url || !streamForm.title) {
    showToast('❌ Poster, URL and Title required'); return;
  }
  let newList;
  if (streamForm.editId) {
    newList = liveStreams.map(s => s.id === streamForm.editId ? { ...streamForm, id: streamForm.editId } : s);
  } else {
    newList = [...liveStreams, { ...streamForm, id: Date.now() }];
  }
  try {
    await adminFetch('/admin/live-streams/save', { method: 'POST', body: JSON.stringify({ streams: newList }) });
    setLiveStreams(newList);
    setStreamForm({ poster: '', url: '', title: '', time: '' });
    showToast('✅ Live stream added!');
  } catch { showToast('❌ Save failed'); }
}

async function deleteLiveStream(id) {
  const newList = liveStreams.filter(s => s.id !== id);
  try {
    await adminFetch('/admin/live-streams/save', { method: 'POST', body: JSON.stringify({ streams: newList }) });
    setLiveStreams(newList);
    showToast('✅ Removed');
  } catch { showToast('❌ Failed'); }
}

  const tabs = [
    { id: 'dashboard',   label: '📊', fullLabel: '📊 Dashboard' },
    { id: 'users',       label: '👥', fullLabel: '👥 Users' },
    { id: 'movies',      label: '🎬', fullLabel: '🎬 Top Content' },
    { id: 'servers',     label: '🌐', fullLabel: '🌐 Servers' },
    { id: 'maintenance', label: '🔧', fullLabel: '🔧 Maintenance' },
    { id: 'announce',    label: '📢', fullLabel: '📢 Announcements' },
    { id: 'homepage',    label: '🏠', fullLabel: '🏠 Homepage Notice' },
    { id: 'sports', label: '⚽', fullLabel: '⚽ Sports' },
  ];

  const filteredUsers = users.filter(u =>
    !userSearch ||
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060d1a', fontFamily: "'Outfit', sans-serif", color: '#e8f4ff', flexDirection: isMobile ? 'column' : 'row' }}>
      {/* Toast */}
      {toast && <div style={panelStyles.toast}>{toast}</div>}

      {/* Delete confirm modal */}
      {delConfirm && (
        <div style={panelStyles.overlay}>
          <div style={panelStyles.confirmBox}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Delete User?</div>
            <div style={{ fontSize: 13, color: 'rgba(232,244,255,0.55)', marginBottom: 24 }}>
              <strong style={{ color: '#e50914' }}>{delConfirm}</strong> will be permanently removed.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDelConfirm(null)} style={{ ...panelStyles.btnSmall, background: 'rgba(255,255,255,0.08)' }}>Cancel</button>
              <button onClick={() => handleBanUser(delConfirm)} disabled={banLoading === delConfirm} style={{ ...panelStyles.btnSmall, background: '#e50914' }}>
                {banLoading === delConfirm ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SIDEBAR (desktop) / TOP NAV (mobile) ── */}
      {isMobile ? (
        // Mobile: top header + scrollable tab bar
        <div style={{ background: '#080f1e', borderBottom: '1px solid rgba(0,200,232,0.12)', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 20, display: 'flex', gap: 4 }}>
              <span style={{ color: '#e8f4ff' }}>VORTX</span>
              <span style={{ background: 'linear-gradient(135deg,#00c8e8,#0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ADMIN</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => loadAll()} style={{ padding: '6px 10px', borderRadius: 7, background: 'rgba(0,200,232,0.08)', border: '1px solid rgba(0,200,232,0.2)', color: '#00c8e8', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>↻</button>
              <button onClick={onLogout} style={{ padding: '6px 10px', borderRadius: 7, background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.2)', color: '#e50914', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Exit</button>
            </div>
          </div>
          {/* Scrollable tab bar */}
          <div style={{ display: 'flex', overflowX: 'auto', padding: '0 12px 10px', gap: 6, scrollbarWidth: 'none' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flexShrink: 0, padding: '7px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                background: tab === t.id ? 'rgba(0,200,232,0.15)' : 'rgba(255,255,255,0.05)',
                border: tab === t.id ? '1px solid rgba(0,200,232,0.4)' : '1px solid rgba(255,255,255,0.08)',
                color: tab === t.id ? '#00c8e8' : 'rgba(232,244,255,0.5)',
                cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}>
                {t.fullLabel}
              </button>
            ))}
          </div>
        </div>
      ) : (
        // Desktop: left sidebar
        <aside style={{ width: 220, flexShrink: 0, background: '#080f1e', borderRight: '1px solid rgba(0,200,232,0.12)', display: 'flex', flexDirection: 'column', padding: '24px 14px', position: 'sticky', top: 0, height: '100vh' }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 32, paddingLeft: 4 }}>
            <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, color: '#e8f4ff' }}>VORTX</span>
            <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, background: 'linear-gradient(135deg,#00c8e8,#0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ADMIN</span>
          </div>
          <nav style={{ flex: 1 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                ...panelStyles.sidebarBtn,
                ...(tab === t.id ? panelStyles.sidebarBtnActive : {}),
              }}>
                {t.fullLabel}
              </button>
            ))}
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: 'rgba(232,244,255,0.4)' }}>Auto-refresh</span>
            <div onClick={() => setAutoRefresh(o => !o)} style={{ width: 36, height: 20, borderRadius: 10, background: autoRefresh ? '#00c8e8' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: 2, left: autoRefresh ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => loadAll()} style={panelStyles.refreshBtn}>↻ Refresh</button>
            <button onClick={onLogout} style={panelStyles.logoutBtn}>Sign Out</button>
          </div>
        </aside>
      )}

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, padding: isMobile ? '16px' : '36px 40px', overflowY: 'auto', maxWidth: isMobile ? '100%' : 1100 }}>
        {loading ? (
          <div style={panelStyles.loadState}>
            <div style={panelStyles.spinner} />
            <p style={{ color: 'rgba(232,244,255,0.4)', marginTop: 16 }}>Loading admin data…</p>
          </div>
        ) : error ? (
          <div style={panelStyles.errorBox}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Worker not configured</div>
            <div style={{ fontSize: 13, color: 'rgba(232,244,255,0.55)', maxWidth: 480 }}>{error}</div>
          </div>
        ) : (
          <>
            {/* ─── DASHBOARD ─── */}
            {tab === 'dashboard' && (
              <div>
                <SectionHeader title="Dashboard" sub="Live overview of VortxStream" />
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 8 }}>
                  <StatCard icon={<UserIcon />} label="Total Users" value={stats?.totalUsers ?? users.length} sub="Registered accounts" />
                  <StatCard icon={<ActiveIcon />} label="Active Today" value={stats?.activeToday ?? '—'} sub="Last 24h" color="#7fffb0" />
                  <StatCard icon={<EyeIcon />} label="Total Views" value={stats?.totalViews ?? movies.reduce((a, m) => a + (m.views || 0), 0)} sub="All content" color="#f59e0b" />
                  <StatCard icon={<ClockIcon />} label="Watch Time" value={formatTime(stats?.totalWatchSeconds)} sub="All users" color="#a78bfa" />
                </div>

                <SectionHeader title="Recently Active" sub="Last seen activity" />
                {isMobile ? (
                  // Mobile: cards
                  users.slice(0, 5).map((u, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,200,232,0.1)', borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'rgba(232,244,255,0.4)' }}>{u.email}</div>
                      <div style={{ fontSize: 12, color: 'rgba(232,244,255,0.5)', marginTop: 6 }}>{u.lastWatch || 'No watch history'}</div>
                      <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 11, color: 'rgba(232,244,255,0.35)' }}>
                        <span>{timeAgo(u.lastSeen)}</span><span>•</span><span>{formatTime(u.watchSeconds)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={panelStyles.table}>
                    <div style={panelStyles.tableHeader}>
                      <span style={{ flex: 2 }}>User</span>
                      <span style={{ flex: 2 }}>Currently / Last Watching</span>
                      <span style={{ flex: 1 }}>Last Seen</span>
                      <span style={{ flex: 1 }}>Watch Time</span>
                    </div>
                    {users.length === 0 ? <div style={panelStyles.empty}>No user data yet</div> : (
                      users.slice(0, 8).map((u, i) => (
                        <div key={i} style={panelStyles.tableRow}>
                          <span style={{ flex: 2 }}>
                            <span style={panelStyles.userName}>{u.name || '—'}</span>
                            <span style={panelStyles.userEmail}>{u.email}</span>
                          </span>
                          <span style={{ flex: 2, color: u.currentWatch ? '#7fffb0' : 'rgba(232,244,255,0.4)', fontSize: 13 }}>{u.currentWatch || u.lastWatch || '—'}</span>
                          <span style={{ flex: 1, fontSize: 12, color: 'rgba(232,244,255,0.45)' }}>{timeAgo(u.lastSeen)}</span>
                          <span style={{ flex: 1, fontSize: 12, color: '#a78bfa' }}>{formatTime(u.watchSeconds)}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ─── USERS ─── */}
            {tab === 'users' && (
              <div>
                <SectionHeader
                  title={`All Users (${users.length})`}
                  sub="Manage registered accounts"
                  action={
                    <button onClick={() => {
                      const csv = ['Name,Email,Last Watch,Watch Time,Joined,Banned',
                        ...users.map(u => `${u.name},${u.email},${u.lastWatch || ''},${formatTime(u.watchSeconds)},${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''},${u.banned}`)
                      ].join('\n');
                      const a = document.createElement('a');
                      a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
                      a.download = 'vortxstream-users.csv'; a.click();
                    }} style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(0,200,232,0.1)', border: '1px solid rgba(0,200,232,0.25)', color: '#00c8e8', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                      ⬇ CSV
                    </button>
                  }
                />
                <input
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,200,232,0.05)', border: '1px solid rgba(0,200,232,0.15)', borderRadius: 9, color: '#e8f4ff', fontSize: 13, outline: 'none', marginBottom: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}
                />

                {isMobile ? (
                  // Mobile: user cards
                  filteredUsers.length === 0
                    ? <div style={panelStyles.empty}>No users found</div>
                    : filteredUsers.map((u, i) => (
                      <UserCard key={i} u={u} onBan={handleTempBan} onUnban={handleUnban} onDelete={(email) => setDelConfirm(email)} />
                    ))
                ) : (
                  // Desktop: table
                  <div style={panelStyles.table}>
                    <div style={panelStyles.tableHeader}>
                      <span style={{ flex: 2 }}>Name / Email</span>
                      <span style={{ flex: 2 }}>Watching</span>
                      <span style={{ flex: 1 }}>Last Seen</span>
                      <span style={{ flex: 1 }}>Watch Time</span>
                      <span style={{ flex: 1 }}>Joined</span>
                      <span style={{ width: 140 }}>Action</span>
                    </div>
                    {filteredUsers.length === 0
                      ? <div style={panelStyles.empty}>No users found</div>
                      : filteredUsers.map((u, i) => (
                        <div key={i} style={panelStyles.tableRow}>
                          <span style={{ flex: 2 }}>
                            <span style={panelStyles.userName}>{u.name || '—'}</span>
                            <span style={panelStyles.userEmail}>{u.email}</span>
                          </span>
                          <span style={{ flex: 2, fontSize: 13, color: u.currentWatch ? '#7fffb0' : 'rgba(232,244,255,0.35)' }}>{u.currentWatch || u.lastWatch || '—'}</span>
                          <span style={{ flex: 1, fontSize: 12, color: 'rgba(232,244,255,0.45)' }}>{timeAgo(u.lastSeen)}</span>
                          <span style={{ flex: 1, fontSize: 12, color: '#a78bfa' }}>{formatTime(u.watchSeconds)}</span>
                          <span style={{ flex: 1, fontSize: 12, color: 'rgba(232,244,255,0.45)' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</span>
                          <span style={{ display: 'flex', gap: 6, alignItems: 'center', width: 140 }}>
                            {u.banned ? (
                              <button onClick={() => handleUnban(u.email)} style={{ ...panelStyles.banBtn, background: 'rgba(0,200,232,0.12)', border: '1px solid rgba(0,200,232,0.3)', color: '#00c8e8' }}>✅ Unban</button>
                            ) : (
                              <select onChange={e => { if (e.target.value) handleTempBan(u.email, Number(e.target.value)); e.target.value = ''; }}
                                style={{ padding: '5px 6px', borderRadius: 7, background: '#0a1628', border: '1px solid rgba(255,165,0,0.3)', color: '#f59e0b', fontSize: 11, cursor: 'pointer' }}>
                                <option value="">⏸ Ban...</option>
                                <option value="1">1 Hour</option>
                                <option value="24">24 Hours</option>
                                <option value="168">7 Days</option>
                                <option value="-1">Permanent</option>
                              </select>
                            )}
                            <button onClick={() => setDelConfirm(u.email)} style={panelStyles.banBtn}>🗑</button>
                          </span>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            )}

            {/* ─── MOVIES ─── */}
            {tab === 'movies' && (
              <div>
                <SectionHeader title="Top Content" sub="Most watched movies & series" />
                {isMobile ? (
                  movies.length === 0
                    ? <div style={panelStyles.empty}>No watch data yet.</div>
                    : movies.map((m, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,200,232,0.1)', borderRadius: 12, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color: i < 3 ? '#f59e0b' : 'rgba(232,244,255,0.3)', minWidth: 28 }}>{i + 1}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{m.title}</div>
                          <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                            <span style={{ color: m.type === 'movie' ? '#00c8e8' : '#a78bfa' }}>{m.type === 'movie' ? '🎬 Movie' : '📺 Series'}</span>
                            <span style={{ color: '#f59e0b' }}>👁 {m.views?.toLocaleString()}</span>
                            <span style={{ color: '#a78bfa' }}>⏱ {formatTime(m.watchSeconds)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div style={panelStyles.table}>
                    <div style={panelStyles.tableHeader}>
                      <span style={{ width: 32 }}>#</span>
                      <span style={{ flex: 3 }}>Title</span>
                      <span style={{ flex: 1 }}>Type</span>
                      <span style={{ flex: 1 }}>Views</span>
                      <span style={{ flex: 1 }}>Watch Time</span>
                    </div>
                    {movies.length === 0 ? <div style={panelStyles.empty}>No watch data yet.</div> : (
                      movies.map((m, i) => (
                        <div key={i} style={panelStyles.tableRow}>
                          <span style={{ width: 32, color: i < 3 ? '#f59e0b' : 'rgba(232,244,255,0.3)', fontWeight: 700 }}>{i + 1}</span>
                          <span style={{ flex: 3, fontWeight: 500 }}>{m.title}</span>
                          <span style={{ flex: 1 }}>
                            <span style={{ ...panelStyles.badge, background: m.type === 'movie' ? 'rgba(0,200,232,0.15)' : 'rgba(167,139,250,0.15)', color: m.type === 'movie' ? '#00c8e8' : '#a78bfa' }}>
                              {m.type === 'movie' ? '🎬 Movie' : '📺 Series'}
                            </span>
                          </span>
                          <span style={{ flex: 1, color: '#f59e0b', fontWeight: 600 }}>{m.views?.toLocaleString()}</span>
                          <span style={{ flex: 1, color: '#a78bfa' }}>{formatTime(m.watchSeconds)}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ─── SERVERS ─── */}
            {tab === 'servers' && (
              <div>
                <SectionHeader title="Server Status" sub="Check streaming server availability" />
                <div style={{ marginBottom: 16 }}>
                  <button onClick={checkServers} disabled={serverChecking} style={{ padding: '10px 20px', borderRadius: 9, background: serverChecking ? 'rgba(0,200,232,0.15)' : 'linear-gradient(135deg,#00c8e8,#0ea5e9)', border: serverChecking ? '1px solid rgba(0,200,232,0.3)' : 'none', color: serverChecking ? '#00c8e8' : '#060d1a', fontSize: 13, fontWeight: 700, cursor: serverChecking ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {serverChecking ? (<><span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(0,200,232,0.3)', borderTop: '2px solid #00c8e8', display: 'inline-block', animation: 'vx-spin 0.7s linear infinite' }} />Checking…</>) : '🔍 Check All Servers'}
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
                  {['videasy','vidking','vidfast','rive','vidsrc','vidapi','111movies','vidzen'].map(s => (
                    <div key={s} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${serverChecking ? 'rgba(0,200,232,0.15)' : serverStatus[s] === 'online' ? 'rgba(127,255,176,0.2)' : serverStatus[s] === 'offline' ? 'rgba(229,9,20,0.2)' : 'rgba(0,200,232,0.1)'}`, borderRadius: 12, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border 0.3s' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{s}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: serverChecking ? 'rgba(0,200,232,0.4)' : serverStatus[s] === 'online' ? '#7fffb0' : serverStatus[s] === 'offline' ? '#e50914' : '#666' }}>
                        {serverChecking ? '○ …' : serverStatus[s] === 'online' ? '● Online' : serverStatus[s] === 'offline' ? '● Offline' : '○ Unknown'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── MAINTENANCE ─── */}
            {tab === 'maintenance' && (
              <div>
                <SectionHeader title="Maintenance Mode" sub="Take the site offline temporarily" />
                <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${maintenance ? 'rgba(229,9,20,0.3)' : 'rgba(0,200,232,0.1)'}`, borderRadius: 14, padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Site Status</div>
                      <div style={{ fontSize: 13, color: maintenance ? '#e50914' : '#7fffb0', fontWeight: 600 }}>{maintenance ? '🔴 Under Maintenance' : '🟢 Live'}</div>
                    </div>
                    <div onClick={async () => {
                      const next = !maintenance; setMaintenance(next);
                      try {
                        await adminFetch('/admin/maintenance', { method: 'POST', body: JSON.stringify({ enabled: next }) });
                        showToast(next ? '🔴 Maintenance ON' : '🟢 Site is Live');
                      } catch { showToast('❌ Failed'); setMaintenance(!next); }
                    }} style={{ width: 52, height: 28, borderRadius: 14, background: maintenance ? '#e50914' : '#00c8e8', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                      <div style={{ position: 'absolute', top: 3, left: maintenance ? 26 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(232,244,255,0.4)', lineHeight: 1.7 }}>
                    When enabled, all users will see a maintenance message. Admin panel remains accessible.
                  </div>
                </div>
              </div>
            )}

            {/* ─── ANNOUNCEMENTS ─── */}
            {tab === 'announce' && (
              <div>
                <SectionHeader title="Announcements" sub="These show on the login page & notice banner" />
                <div style={panelStyles.announceBox}>
                  <div style={{ fontSize: 13, color: 'rgba(232,244,255,0.45)', marginBottom: 8 }}>One announcement per line.</div>
                  <textarea
                    value={annText || announcements.join('\n')}
                    onChange={e => setAnnText(e.target.value)}
                    placeholder="Use Brave Browser 🦁 to avoid ads"
                    style={panelStyles.textarea} rows={8}
                  />
                  <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                    <button onClick={saveAnnouncements} disabled={saving} style={panelStyles.saveBtn}>{saving ? 'Saving…' : '💾 Save'}</button>
                    <button onClick={() => setAnnText(announcements.join('\n'))} style={{ ...panelStyles.saveBtn, background: 'rgba(255,255,255,0.06)', color: 'rgba(232,244,255,0.7)' }}>Reset</button>
                  </div>
                  <div style={{ marginTop: 24 }}>
                    <div style={{ fontSize: 12, color: '#00c8e8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Preview</div>
                    <div style={panelStyles.annPreview}>
                      <div style={{ fontSize: 13, color: '#00c8e8', marginBottom: 8 }}>🔔 Announcements</div>
                      <ul style={{ paddingLeft: 18, fontSize: 13, color: '#ccc', lineHeight: 1.7 }}>
                        {(annText || announcements.join('\n')).split('\n').filter(Boolean).map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── HOMEPAGE NOTICE ─── */}
            {tab === 'homepage' && (
              <div>
                <SectionHeader title="Homepage Notice Bar" sub="Single line shown in the notice banner" />
                <div style={panelStyles.announceBox}>
                  <div style={{ fontSize: 13, color: 'rgba(232,244,255,0.45)', marginBottom: 12 }}>This text appears in the green notice bar on the homepage.</div>
                  <input
                    value={noticeText}
                    onChange={e => setNoticeText(e.target.value)}
                    placeholder="Use Brave Browser 🦁 to avoid ads."
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,200,232,0.05)', border: '1px solid rgba(0,200,232,0.2)', borderRadius: 10, color: '#e8f4ff', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                    <button onClick={async () => {
                      setSaving(true);
                      try { await adminFetch('/admin/homepage-notice/save', { method: 'POST', body: JSON.stringify({ notice: noticeText }) }); showToast('✅ Saved!'); }
                      catch { showToast('❌ Save failed'); }
                      setSaving(false);
                    }} disabled={saving} style={panelStyles.saveBtn}>{saving ? 'Saving…' : '💾 Save Notice'}</button>
                    <button onClick={() => setNoticeText('')} style={{ ...panelStyles.saveBtn, background: 'rgba(255,255,255,0.06)', color: 'rgba(232,244,255,0.7)' }}>Clear</button>
                  </div>
                </div>
              </div>
            )}
            {tab === 'sports' && (
  <div>
    <SectionHeader title="Live Sports / TV" sub="Add live streams shown on homepage carousel" />
    <div style={panelStyles.announceBox}>
      <input value={streamForm.poster} onChange={e => setStreamForm({...streamForm, poster: e.target.value})}
        placeholder="Poster Image URL" style={{...panelStyles.textarea, height:42, marginBottom:10}} />
      <input value={streamForm.url} onChange={e => setStreamForm({...streamForm, url: e.target.value})}
        placeholder="M3U8 Stream URL" style={{...panelStyles.textarea, height:42, marginBottom:10}} />
      <input value={streamForm.title} onChange={e => setStreamForm({...streamForm, title: e.target.value})}
        placeholder="Title / Channel Name (e.g. FIFA World Cup Final)" style={{...panelStyles.textarea, height:42, marginBottom:10}} />
      <input value={streamForm.time} onChange={e => setStreamForm({...streamForm, time: e.target.value})}
        placeholder="Time (e.g. 9:00 PM)" style={{...panelStyles.textarea, height:42, marginBottom:14}} />
      <div style={{display:'flex', gap:10}}>
        <button onClick={saveLiveStream} style={panelStyles.saveBtn}>💾 Save</button>
        <button onClick={() => setStreamForm({poster:'',url:'',title:'',time:''})} style={{...panelStyles.saveBtn, background:'rgba(255,255,255,0.06)', color:'rgba(232,244,255,0.7)'}}>Cancel</button>
      </div>
    </div>
    <div style={{marginTop:20}}>
      {liveStreams.map(s => (
        <div key={s.id} style={{display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(0,200,232,0.1)', borderRadius:10, marginBottom:8}}>
          <img src={s.poster} style={{width:50, height:30, objectFit:'cover', borderRadius:5}} />
          <div style={{flex:1}}>
            <div style={{fontSize:13, fontWeight:600}}>{s.title}</div>
            <div style={{fontSize:11, color:'rgba(232,244,255,0.4)'}}>{s.time}</div>
          </div>
          <button onClick={() => setStreamForm({ poster: s.poster, url: s.url, title: s.title, time: s.time, editId: s.id })} style={{...panelStyles.banBtn, background:'rgba(0,200,232,0.12)', border:'1px solid rgba(0,200,232,0.3)', color:'#00c8e8'}}>✏️</button>
          <button onClick={() => deleteLiveStream(s.id)} style={panelStyles.banBtn}>🗑</button>
        </div>
      ))}
    </div>
  </div>
)}
          </>
        )}
      </main>

      <style>{`
        @keyframes vx-spin { to { transform: rotate(360deg); } }
        @keyframes vx-fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,200,232,0.2); border-radius: 4px; }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// Section Header
// ─────────────────────────────────────────────
function SectionHeader({ title, sub, action }) {
  return (
    <div style={{ marginBottom: 20, animation: 'vx-fadein 0.3s ease', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e8f4ff', marginBottom: 4 }}>{title}</h2>
        <p style={{ fontSize: 13, color: 'rgba(232,244,255,0.4)' }}>{sub}</p>
      </div>
      {action && <div style={{ marginTop: 4 }}>{action}</div>}
    </div>
  );
}

// ── SVG Icons ──
const UserIcon = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="7" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>);
const ActiveIcon = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>);
const EyeIcon = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>);
const ClockIcon = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);

// ─────────────────────────────────────────────
// Panel Styles (static — no isMobile here)
// ─────────────────────────────────────────────
const panelStyles = {
  sidebarBtn: { display: 'block', width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500, color: 'rgba(232,244,255,0.5)', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', marginBottom: 4, transition: 'all 0.18s', fontFamily: 'inherit' },
  sidebarBtnActive: { color: '#00c8e8', background: 'rgba(0,200,232,0.1)', boxShadow: 'inset 0 0 0 1px rgba(0,200,232,0.2)' },
  refreshBtn: { padding: '9px', borderRadius: 8, background: 'rgba(0,200,232,0.08)', border: '1px solid rgba(0,200,232,0.2)', color: '#00c8e8', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  logoutBtn: { padding: '9px', borderRadius: 8, background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.2)', color: '#e50914', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  statCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,200,232,0.12)', borderRadius: 16, padding: '18px 16px', animation: 'vx-fadein 0.4s ease' },
  statIcon: { marginBottom: 10 },
  statVal: { fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 },
  statLabel: { fontSize: 12, color: 'rgba(232,244,255,0.6)', fontWeight: 500 },
  statSub: { fontSize: 11, color: 'rgba(232,244,255,0.3)', marginTop: 4 },
  table: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,200,232,0.1)', borderRadius: 14, overflow: 'hidden', animation: 'vx-fadein 0.3s ease' },
  tableHeader: { display: 'flex', alignItems: 'center', padding: '12px 20px', background: 'rgba(0,200,232,0.06)', borderBottom: '1px solid rgba(0,200,232,0.1)', fontSize: 11, fontWeight: 600, color: 'rgba(232,244,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', gap: 8 },
  tableRow: { display: 'flex', alignItems: 'center', padding: '12px 20px', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 13, transition: 'background 0.15s' },
  userName: { display: 'block', fontWeight: 500, fontSize: 13 },
  userEmail: { display: 'block', fontSize: 11, color: 'rgba(232,244,255,0.35)', marginTop: 1 },
  banBtn: { padding: '5px 10px', borderRadius: 7, background: 'rgba(229,9,20,0.12)', border: '1px solid rgba(229,9,20,0.2)', color: '#e50914', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  badge: { display: 'inline-block', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500 },
  empty: { padding: '32px 20px', textAlign: 'center', color: 'rgba(232,244,255,0.3)', fontSize: 13 },
  loadState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' },
  spinner: { width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(0,200,232,0.15)', borderTop: '3px solid #00c8e8', animation: 'vx-spin 0.8s linear infinite' },
  errorBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' },
  announceBox: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,200,232,0.1)', borderRadius: 14, padding: 24, animation: 'vx-fadein 0.3s ease' },
  textarea: { width: '100%', padding: '14px 16px', background: 'rgba(0,200,232,0.05)', border: '1px solid rgba(0,200,232,0.2)', borderRadius: 10, color: '#e8f4ff', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', lineHeight: 1.8, boxSizing: 'border-box' },
  saveBtn: { padding: '11px 22px', borderRadius: 9, background: 'linear-gradient(135deg, #00c8e8, #0ea5e9)', border: 'none', color: '#060d1a', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  annPreview: { background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 16, border: '1px solid rgba(0,200,232,0.12)' },
  toast: { position: 'fixed', bottom: 24, right: 16, padding: '12px 20px', borderRadius: 10, background: '#0a1628', border: '1px solid rgba(0,200,232,0.3)', fontSize: 13, zIndex: 9999, animation: 'vx-fadein 0.2s ease', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', maxWidth: 'calc(100vw - 32px)' },
  overlay: { position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: '16px' },
  confirmBox: { background: '#0a1628', border: '1px solid rgba(229,9,20,0.3)', borderRadius: 16, padding: '32px 28px', textAlign: 'center', width: '100%', maxWidth: 320 },
  btnSmall: { flex: 1, padding: '10px', borderRadius: 8, border: 'none', color: '#e8f4ff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
};

// ─────────────────────────────────────────────
// Root Export
// ─────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('vx-admin-auth') === '1');
  function logout() { sessionStorage.removeItem('vx-admin-auth'); setAuthed(false); }
  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;
  return <AdminPanel onLogout={logout} />;
}