import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import CardRow from '../components/CardRow';
import { useAuth } from '../hooks/useAuth';
import { tmdb, IMG, SERVERS, GENRE_MAP, getAllServers, WORKER_URL } from '../utils/tmdb';

export default function DetailPage({ item, type, onBack, onOpen }) {
  const { user, isInWatchlist, toggleWatchlist, saveProgress, getProgress } = useAuth();
  const [detail,    setDetail]    = useState(null);
  const [cast,      setCast]      = useState([]);
  const [similar,   setSimilar]   = useState([]);
  const [seasons,   setSeasons]   = useState([]);
  const [episodes,  setEpisodes]  = useState([]);
  const [selSeason, setSelSeason] = useState(1);
  const [selEp,     setSelEp]     = useState(1);
  const [epSearch,  setEpSearch]  = useState('');
  const [server,    setServer]    = useState('videasy');
  const [playing,   setPlaying]   = useState(false);
  const [iframeUrl, setIframeUrl] = useState('');
  const [inWl,      setInWl]      = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [trailerKey, setTrailerKey] = useState(null);
const [trailerOpen, setTrailerOpen] = useState(false);
const [reviews, setReviews]       = useState([]);
const [myRating, setMyRating]     = useState(0);
const [reviewText, setReviewText] = useState('');
const [submitting, setSubmitting] = useState(false);
const [allServers, setAllServers] = useState(SERVERS);

useEffect(() => { if (item) loadReviews(); }, [item?.id]);
  useEffect(() => {
    if (!item) return;
    setLoading(true);
    setPlaying(false);
    setIframeUrl('');
    setEpSearch('');
    window.scrollTo(0, 0);
    loadDetail();
  }, [item?.id, type]);


  useEffect(() => {
    if (detail && type === 'tv') loadEpisodes(selSeason);
  }, [selSeason, detail]);

useEffect(() => {
  getAllServers().then(setAllServers);
}, []);

  // ✅ ADD THIS — Watch tracking (paste exactly here, after line 36)
  useEffect(() => {
    if (!user || !item || !playing) return;
    fetch(`${WORKER_URL}/track/watch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, movieId: item.id, title: item.title || item.name, type, watchSeconds: 0 }),
    }).catch(() => {});
    const interval = setInterval(() => {
      fetch(`${WORKER_URL}/track/watch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, movieId: item.id, title: item.title || item.name, type, watchSeconds: 60 }),
      }).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, [playing, item?.id]);

  async function loadDetail() {
    const [det, credits, sim] = await Promise.all([
      tmdb(`/${type}/${item.id}`),
      tmdb(`/${type}/${item.id}/credits`),
      tmdb(`/${type}/${item.id}/similar`),
    ]);
    const videos = await tmdb(`/${type}/${item.id}/videos`);
const trailer = (videos.results || []).find(v => v.type === 'Trailer' && v.site === 'YouTube');
setTrailerKey(trailer?.key || null);
    setDetail(det);
    setCast((credits.cast || []).filter(c => c.profile_path).slice(0, 20));
    setSimilar((sim.results || []).filter(r => r.poster_path).slice(0, 20));
    if (type === 'tv' && det.seasons) {
      const realSeasons = det.seasons.filter(s => s.season_number > 0);
      setSeasons(realSeasons);
      setSelSeason(realSeasons[0]?.season_number || 1);
    }
    setInWl(isInWatchlist(item.id, type));
    setLoading(false);
  }

  async function loadReviews() {
  try {
    const res = await fetch(`${WORKER_URL}/review/get?movieId=${item.id}`);
    const data = await res.json();
    setReviews(data.reviews || []);
    const mine = (data.reviews || []).find(r => r.email === user?.email);
    if (mine) { setMyRating(mine.rating); setReviewText(mine.text || ''); }
  } catch {}
}

async function submitReview() {
  if (!myRating) return;
  setSubmitting(true);
  await fetch(`${WORKER_URL}/review/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, movieId: item.id, type, rating: myRating, text: reviewText }),
  }).catch(() => {});
  await loadReviews();
  setSubmitting(false);
}

  async function loadEpisodes(seasonNum) {
    const data = await tmdb(`/tv/${item.id}/season/${seasonNum}`);
    setEpisodes(data.episodes || []);
  }

  async function getEmbedUrl(srv, s, e) {
  const serverObj = allServers.find(sv => sv.id === srv);
  if (!serverObj) return '';
  if (type === 'movie') return await serverObj.movie(item.id);
  return await serverObj.tv(item.id, s, e);
}

  async function playNow() {
  const url = await getEmbedUrl(server, selSeason, selEp);
  setIframeUrl(url);
    setPlaying(true);
    if (user) saveProgress(item.id, type, 5, type === 'tv' ? selSeason : null, type === 'tv' ? selEp : null);
    setTimeout(() => document.getElementById('playerWrap')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }

  async function playEpisode(season, episode) {
    setSelSeason(season);
    setSelEp(episode);
    const url = await getEmbedUrl(server, season, episode);
    setIframeUrl(url);
    setPlaying(true);
    if (user) saveProgress(item.id, type, 5, season, episode);
  }

  async function handleServerChange(srv) {
  setServer(srv);
  if (playing) {
    const url = await getEmbedUrl(srv, selSeason, selEp);
    setIframeUrl(url);
  }
}

  function handleWl() {
    const added = toggleWatchlist(detail || item, type);
    setInWl(added);
  }

  if (!item) return null;

  const title    = detail?.title || detail?.name || item.title || item.name || '';
  const backdrop = detail?.backdrop_path || item.backdrop_path;
  const poster   = detail?.poster_path || item.poster_path;
  const year     = (detail?.release_date || detail?.first_air_date || item.release_date || item.first_air_date || '').slice(0, 4);
  const rating   = detail?.vote_average?.toFixed(1) || '';
  const overview = detail?.overview || item.overview || '';
  const genres   = (detail?.genres || []).map(g => g.name);
  const runtime  = detail?.runtime ? `${detail.runtime}m` : detail?.episode_run_time?.[0] ? `${detail.episode_run_time[0]}m/ep` : '';
  const seasonCount = detail?.number_of_seasons;

  const filteredEps = episodes.filter(ep =>
    !epSearch || ep.name?.toLowerCase().includes(epSearch.toLowerCase())
  );

  return (
    <div className="page">
      {/* Hero */}
      <div className="detail-hero">
        <button className="detail-back" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        {backdrop && <div className="detail-hero-bg" style={{ backgroundImage: `url(${IMG}original${backdrop})` }} />}
        <div className="detail-hero-overlay" />
        <div className="detail-hero-content">
          <h1 className="detail-title">{title}</h1>
          <div className="detail-meta">
            {rating && <span className="detail-rating">★ {rating}</span>}
            {year && <><span className="meta-dot"/><span className="detail-year">{year}</span></>}
            {runtime && <><span className="meta-dot"/><span className="detail-runtime">{runtime}</span></>}
            {seasonCount && <><span className="meta-dot"/><span className="detail-seasons">{seasonCount} Season{seasonCount > 1 ? 's' : ''}</span></>}
          </div>
          {genres.length > 0 && (
            <div className="detail-genres">
              {genres.map(g => <span key={g} className="detail-genre-tag">{g}</span>)}
            </div>
          )}
          {overview && <p className="detail-overview">{overview}</p>}
          <div className="detail-btns">
            <button className="d-btn d-btn-play" onClick={playNow}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              {type === 'tv' ? `Play S${selSeason} E${selEp}` : 'Watch Now'}
            </button>
            {trailerKey && (
  <button className="d-btn d-btn-wl" onClick={() => setTrailerOpen(true)}>
    ▷ Watch Trailer
  </button>
)}
            <button className={`d-btn d-btn-wl ${inWl ? 'added' : ''}`} onClick={handleWl}>
              {inWl ? '✓ In Watchlist' : '+ Watchlist'}
            </button>
          </div>
        </div>
      </div>

      <div className="detail-content-wrap">

        {/* Player */}
        <div className="detail-player-section" id="playerWrap">
          <div className="player-label">Now Playing</div>

          {/* Server Dropdown */}
          <div className="server-select-wrap">
            <span className="server-label">Server:</span>
            <select
              className="server-select"
              value={server}
              onChange={e => handleServerChange(e.target.value)}
            >
              {allServers.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <span className="server-status">● Live</span>
            {type === 'movie' && (
  <button className="ep-play-btn" onClick={playNow}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
    Play Movie
  </button>
)}
          </div>

          {/* TV episode bar */}
          {type === 'tv' && seasons.length > 0 && (
            <div className="ep-bar">
              <select className="ep-select" value={selSeason} onChange={e => { setSelSeason(Number(e.target.value)); setSelEp(1); }}>
                {seasons.map(s => <option key={s.season_number} value={s.season_number}>Season {s.season_number}</option>)}
              </select>
              <select className="ep-select" value={selEp} onChange={e => setSelEp(Number(e.target.value))}>
                {Array.from({ length: seasons.find(s => s.season_number === selSeason)?.episode_count || 24 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Episode {i + 1}</option>
                ))}
              </select>
              <button className="ep-play-btn" onClick={playNow}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Play Episode
              </button>
            </div>
          )}

          {playing && iframeUrl ? (
            <div className="player-frame-wrap">
              <iframe
                src={iframeUrl}
                allowFullScreen
                allow="autoplay; fullscreen; encrypted-media"
                scrolling="no"
                title="player"
              />
            </div>
          ) : (
            <div
              style={{
                width: '100%', aspectRatio: '16/9', borderRadius: 'var(--radius-lg)',
                background: 'var(--bg3)', border: '1px solid var(--border2)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 16, cursor: 'pointer',
              }}
              onClick={playNow}
            >
              {poster && (
                <img src={`${IMG}w300${poster}`} alt={title} style={{ width: 120, borderRadius: 8, opacity: 0.5 }} />
              )}
              <div style={{ fontSize: 14, color: 'var(--text3)' }}>Click to play</div>
            </div>
          )}
        </div>
{/* Download API*/}
<div className="detail-section" style={{ textAlign: 'center' }}>
  <h3 className="detail-section-title" style={{ justifyContent: 'center' }}><span className="title-bar"/>Download your favourite movie /series </h3>
  {type === 'movie' ? (
    <a href={`https://rivestream.ru/download?type=movie&id=${item.id}`} target="_blank" rel="noreferrer"
      style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'11px 24px', borderRadius:10, background:'var(--surface2)', border:'1px solid var(--accent-border)', color:'var(--accent)', fontWeight:700, fontSize:14, textDecoration:'none' }}>
      ⬇ Download Movie
    </a>
  ) : (
    <a href={`https://rivestream.ru/download?type=tv&id=${item.id}&season=${selSeason}&episode=${selEp}`} target="_blank" rel="noreferrer"
      style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'11px 24px', borderRadius:10, background:'var(--surface2)', border:'1px solid var(--accent-border)', color:'var(--accent)', fontWeight:700, fontSize:14, textDecoration:'none' }}>
      ⬇ Download S{selSeason} E{selEp}
    </a>
  )}
</div>
<div className="detail-section">
  <h3 className="detail-section-title"><span className="title-bar"/>Ratings & Reviews</h3>
  
  {/* Average */}
  {reviews.length > 0 && (
    <div style={{ marginBottom: 16, fontSize: 14, color: 'var(--text2)' }}>
      ⭐ {(reviews.reduce((a,r) => a + r.rating, 0) / reviews.length).toFixed(1)} / 5 &nbsp;·&nbsp; {reviews.length} review{reviews.length > 1 ? 's' : ''}
    </div>
  )}

  {/* Write review */}
  {user && (
    <div style={{ marginBottom: 24, padding: 16, background: 'var(--bg3)', borderRadius: 12 }}>
      <div style={{ marginBottom: 8, fontSize: 13, color: 'var(--text2)' }}>Your Rating:</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[1,2,3,4,5].map(s => (
          <span key={s} onClick={() => setMyRating(s)}
            style={{ fontSize: 24, cursor: 'pointer', color: s <= myRating ? '#f59e0b' : 'var(--text3)' }}>★</span>
        ))}
      </div>
      <textarea
        placeholder="Write your review (optional)..."
        value={reviewText}
        onChange={e => setReviewText(e.target.value)}
        style={{ width: '100%', padding: '10px 12px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text1)', fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }}
        rows={3}
      />
      <button onClick={submitReview} disabled={!myRating || submitting}
        style={{ marginTop: 10, padding: '9px 20px', background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
        {submitting ? 'Saving...' : 'Submit Review'}
      </button>
    </div>
  )}

  {/* Reviews list */}
  {reviews.filter(r => r.text).map((r, i) => (
    <div key={i} style={{ padding: '12px 16px', marginBottom: 10, background: 'var(--bg3)', borderRadius: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{r.email.split('@')[0]}</span>
        <span style={{ color: '#f59e0b', fontSize: 13 }}>{'★'.repeat(r.rating)}</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text2)' }}>{r.text}</div>
    </div>
  ))}
</div>
        {/* Cast */}
        {cast.length > 0 && (
          <div className="detail-section">
            <h3 className="detail-section-title"><span className="title-bar" />Actors</h3>
            <div className="cast-grid">
              {cast.map(c => (
                <div key={c.id} className="cast-card">
                  <img className="cast-img" src={`${IMG}w185${c.profile_path}`} alt={c.name} loading="lazy" />
                  <div className="cast-name">{c.name}</div>
                  <div className="cast-char">{c.character}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Episodes */}
        {type === 'tv' && seasons.length > 0 && (
          <div className="detail-section">
            <div className="ep-header">
              <h3 className="detail-section-title"><span className="title-bar" />Episodes</h3>
              <div className="ep-controls">
                <select className="ep-select" value={selSeason} onChange={e => { setSelSeason(Number(e.target.value)); setEpSearch(''); }}>
                  {seasons.map(s => <option key={s.season_number} value={s.season_number}>Season {s.season_number}</option>)}
                </select>
                <div className="ep-search-wrap">
                  <svg className="ep-search-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input className="ep-search-input" placeholder="Search episode..." value={epSearch} onChange={e => setEpSearch(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="ep-list">
              {filteredEps.map(ep => (
                <div
                  key={ep.id}
                  className={`ep-item ${playing && selSeason === ep.season_number && selEp === ep.episode_number ? 'active' : ''}`}
                  onClick={() => playEpisode(ep.season_number, ep.episode_number)}
                >
                  {ep.still_path && (
                    <div className="ep-thumb">
                      <img src={`${IMG}w300${ep.still_path}`} alt={ep.name} loading="lazy" />
                    </div>
                  )}
                  <span className="ep-num">E{ep.episode_number}</span>
                  <div className="ep-info">
                    <div className="ep-name">{ep.name}</div>
                    {ep.overview && <div className="ep-desc">{ep.overview}</div>}
                  </div>
                  {ep.runtime && <span className="ep-runtime">{ep.runtime}m</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similar */}
        {similar.length > 0 && (
          <div className="detail-section">
            <h3 className="detail-section-title"><span className="title-bar" />Similar</h3>
            <CardRow items={similar} type={type} loading={false} onOpen={onOpen} />
          </div>
        )}
        {trailerOpen && trailerKey && (
  <div className="modal-overlay active" onClick={() => setTrailerOpen(false)}>
    <div style={{ width:'100%', maxWidth:800, borderRadius:14, overflow:'hidden' }} onClick={e => e.stopPropagation()}>
      <iframe
        width="100%" style={{ aspectRatio:'16/9', border:'none', display:'block' }}
        src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
        allow="autoplay; fullscreen"
        allowFullScreen
      />
    </div>
  </div>
)}
      </div>
    </div>
  );
}
