import React, { useState, useEffect } from 'react';
import { getTopAnime, getSeasonNowAnime } from '../utils/jikan';
import Card, { SkeletonCard } from '../components/Card';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'airing',  label: 'Airing Now' },
];

export default function AnimePage({ onOpen }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [sort,    setSort]    = useState('popular');
  const [more,    setMore]    = useState(true);

  useEffect(() => { setItems([]); setPage(1); setMore(true); load(1, sort, true); }, [sort]);

  async function load(p, s, reset = false) {
    setLoading(true);
    try {
      const data = s === 'airing' ? await getSeasonNowAnime(p) : await getTopAnime(p);
      const results = (data.results || []).filter(r => r.poster_path);
      setItems(prev => reset ? results : [...prev, ...results]);
      setMore(!!data.hasMore);
    } catch (e) {
      console.error('Anime load failed:', e);
      setMore(false);
    }
    setLoading(false);
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    load(next, sort);
  }

  return (
    <div className="page">
      <div className="browse-header">
        <h1 className="browse-title">Anime</h1>
        <div className="browse-filters">
          <select className="filter-select" value={sort} onChange={e => setSort(e.target.value)}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <div className="browse-grid">
        {items.map(item => <Card key={item.id} item={item} type="anime" onOpen={onOpen} />)}
        {loading && Array.from({ length: 12 }, (_, i) => <SkeletonCard key={i} wide />)}
      </div>
      {!loading && more && (
        <div className="load-more-wrap">
          <button className="load-more-btn" onClick={loadMore}>Load More</button>
        </div>
      )}
      <footer className="footer">
        Made with <span style={{ color: '#e05252' }}>❤️</span> by{' '}
        <a href="https://www.instagram.com/vortx_43" target="_blank" rel="noreferrer">Subhankar</a>
        &nbsp;© 2026
      </footer>
    </div>
  );
}