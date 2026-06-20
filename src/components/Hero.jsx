import React, { useState, useEffect, useRef } from 'react';
import { tmdb, IMG, GENRE_MAP } from '../utils/tmdb';
import { WORKER_URL } from '../utils/tmdb';

export default function Hero({ onOpen }) {
  const [items, setItems]   = useState([]);
  const [index, setIndex]   = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    Promise.all([
      fetch(`${WORKER_URL}/live-streams`).then(r => r.json()).catch(() => ({ streams: [] })),
      tmdb('/trending/all/day'),
    ]).then(([liveData, data]) => {
      const filtered = (data.results || []).filter(r => r.backdrop_path).slice(0, 8);
      const live = (liveData.streams || []).map(s => ({ ...s, isLive: true }));
      setItems([...live, ...filtered]);
      setLoading(false);
    });
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (!items.length) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setIndex(i => (i + 1) % items.length), 6000);
    return () => clearInterval(timerRef.current);
  }, [items]);

  if (loading) {
    return (
      <section className="hero">
        <div className="hero-content">
          <div className="hero-loader"><span/><span/><span/></div>
        </div>
      </section>
    );
  }

  const item = items[index];
  if (!item) return null;

  const type     = item.isLive ? 'live' : (item.media_type === 'tv' ? 'tv' : 'movie');
  const title    = item.isLive ? item.title : (item.title || item.name || '');
  const year     = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating   = item.vote_average ? item.vote_average.toFixed(1) : '';
  const overview = item.overview || '';
  const genres   = (item.genre_ids || []).slice(0, 3).map(id => GENRE_MAP[id]).filter(Boolean);

  return (
    <section className="hero">
      <div
        className="hero-bg"
        style={{ backgroundImage: `url(${item.isLive ? item.poster : IMG+'original'+item.backdrop_path})` }}
      />
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="hero-type-badge">
          {item.isLive ? '🔴 LIVE' : type === 'tv' ? '📺 Series' : '🎬 Movie'}
        </div>
        <h1 className="hero-title">{title}</h1>
        {item.isLive ? (
          <div className="hero-meta"><span className="hero-year">{item.time}</span></div>
        ) : (
          <>
            <div className="hero-meta">
              {rating && <span className="hero-rating">★ {rating}</span>}
              {year && <><span className="hero-dot"/><span className="hero-year">{year}</span></>}
            </div>
            {genres.length > 0 && (
              <div className="hero-genres">
                {genres.map(g => <span key={g} className="hero-genre-tag">{g}</span>)}
              </div>
            )}
            {overview && <p className="hero-overview">{overview}</p>}
          </>
        )}
        <div className="hero-btns">
          <button className="hero-play-btn" onClick={() => onOpen(item, type)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            {item.isLive ? 'Watch Live' : 'Watch Now'}
          </button>
          {!item.isLive && (
            <button className="hero-info-btn" onClick={() => onOpen(item, type)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              More Info
            </button>
          )}
        </div>
      </div>
      <div className="hero-dots">
        {items.map((_, i) => (
          <button
            key={i}
            className={`hero-dot-btn ${i === index ? 'active' : ''}`}
            onClick={() => { setIndex(i); clearInterval(timerRef.current); }}
          />
        ))}
      </div>
    </section>
  );
}
