import React from 'react';
import { IMG } from '../utils/tmdb';
import { useAuth } from '../hooks/useAuth';

export function SkeletonCard({ wide = false }) {
  return (
    <div className="skeleton-card" style={wide ? { width: '100%' } : {}}>
      <div className="sk-poster" />
      <div className="sk-line" />
      <div className="sk-line short" />
    </div>
  );
}

export default function Card({ item, type, onOpen }) {
  const { user, isInWatchlist, toggleWatchlist } = useAuth();
  const [inWl, setInWl] = React.useState(false);

  React.useEffect(() => {
    setInWl(isInWatchlist(item.id, type));
  }, [item.id, type, isInWatchlist]);

  const title = item.title || item.name || '';
  const year  = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : '';
  const poster = item.poster_path ? (item.poster_path.startsWith('http') ? item.poster_path : `${IMG}w300${item.poster_path}`) : null;

  function handleWl(e) {
    e.stopPropagation();
    const added = toggleWatchlist(item, type);
    setInWl(added);
  }

  return (
    <div className="card" onClick={() => onOpen(item, type)}>
      {poster
        ? <img className="card-poster" src={poster} alt={title} loading="lazy" />
        : <div className="card-poster" style={{ background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 12 }}>No Image</div>
      }
      <div className="card-info">
        <div className="card-title">{title}</div>
        <div className="card-meta">
          {rating && <span className="card-rating">★ {rating}</span>}
          {rating && year && <span>·</span>}
          {year && <span>{year}</span>}
        </div>
      </div>
      <div className="card-overlay">
        <div className="card-overlay-btns">
          <div className="card-play-btn">▶ Play</div>
          <button className={`card-wl-btn ${inWl ? 'added' : ''}`} onClick={handleWl}>
            {inWl ? '✓' : '+'}
          </button>
        </div>
      </div>
    </div>
  );
}
