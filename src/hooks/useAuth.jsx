import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WORKER_URL } from '../utils/tmdb';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem('vx-session');
      if (s) {
        const u = JSON.parse(s);
        setUser(u);
        syncFromKV(u.email);
          // Ban check on page load/refresh
      fetch(`${WORKER_URL}/auth/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u.email }),
      }).then(r => r.json()).then(data => {
        if (!data.status && data.banned) {
          localStorage.removeItem('vx-session');
          setUser(null);
        }
      }).catch(() => {});
      }
    } catch {}
  }, []);

  async function syncFromKV(email) {
    try {
      const banRes = await fetch(`${WORKER_URL}/auth/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const banData = await banRes.json();
    if (banData.banned) { logout(); return; }

      const [wlRes, prRes] = await Promise.all([
      fetch(`${WORKER_URL}/watchlist/get`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email }),
}),
fetch(`${WORKER_URL}/progress/get`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email }),
}),
         ]);
      if (wlRes.ok) {
        const wl = await wlRes.json();
        if (wl.watchlist) localStorage.setItem(`vx-watchlist-${email}`, JSON.stringify(wl.watchlist));
      }
      if (prRes.ok) {
        const pr = await prRes.json();
        if (pr.progress) localStorage.setItem(`vx-progress-${email}`, JSON.stringify(pr.progress));
      }
    } catch (e) {
      console.warn('KV sync failed:', e);
    }
  }

  function login(u) {
    setUser(u);
    localStorage.setItem('vx-session', JSON.stringify(u));
    syncFromKV(u.email);
  }

  function logout() {
    setUser(null);
    localStorage.removeItem('vx-session');
  }

  // Watchlist
  function getWatchlist() {
    if (!user) return [];
    try { return JSON.parse(localStorage.getItem(`vx-watchlist-${user.email}`) || '[]'); } catch { return []; }
  }

  async function saveWatchlist(list) {
    if (!user) return;
    localStorage.setItem(`vx-watchlist-${user.email}`, JSON.stringify(list));
    try {
      await fetch(`${WORKER_URL}/watchlist/save`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, watchlist: list }),
      });
    } catch {}
  }

  function isInWatchlist(id, type) {
    return getWatchlist().some(i => i.id === id && i.type === type);
  }

  function toggleWatchlist(item, type) {
    const list = getWatchlist();
    const idx  = list.findIndex(i => i.id === item.id && i.type === type);
    if (idx > -1) { list.splice(idx, 1); }
    else {
      list.push({
        id: item.id, type,
        title: item.title || item.name,
        poster_path: item.poster_path,
        vote_average: item.vote_average,
        release_date: item.release_date || item.first_air_date,
      });
    }
    saveWatchlist(list);
    return idx === -1; // returns true if added
  }

  // Progress
  function getProgressData() {
    if (!user) return {};
    try { return JSON.parse(localStorage.getItem(`vx-progress-${user.email}`) || '{}'); } catch { return {}; }
  }

  const saveProgressData = useCallback(async (data) => {
    if (!user) return;
    localStorage.setItem(`vx-progress-${user.email}`, JSON.stringify(data));
    const now = Date.now();
    if (!saveProgressData._last || now - saveProgressData._last > 10000) {
      saveProgressData._last = now;
      try {
        await fetch(`${WORKER_URL}/progress/save`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, progress: data }),
        });
      } catch {}
    }
  }, [user]);

  function saveProgress(id, type, pct, season = null, episode = null) {
    if (!user) return;
    const prog = getProgressData();
    prog[`${type}-${id}`] = { id, type, pct: Math.min(pct, 100), season, episode, ts: Date.now() };
    saveProgressData(prog);
  }

  function getProgress(id, type) {
    if (!user) return 0;
    return getProgressData()[`${type}-${id}`]?.pct || 0;
  }
useEffect(() => {
  if (!user) return;
  const id = setInterval(async () => {
    try {
      const res = await fetch(`${WORKER_URL}/auth/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (data.banned) logout();
    } catch {}
  }, 60000);
  return () => clearInterval(id);
}, [user]);

  return (
    <AuthContext.Provider value={{
      user, login, logout,
      getWatchlist, isInWatchlist, toggleWatchlist,
      getProgressData, saveProgress, getProgress,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
