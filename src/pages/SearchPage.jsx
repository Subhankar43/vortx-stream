import React, { useState, useEffect } from 'react';
import { tmdb } from '../utils/tmdb';
import { searchAnime } from '../utils/jikan';
import Card, { SkeletonCard } from '../components/Card';

const ANIMATION_GENRE_ID = 16;

export default function SearchPage({ query, onOpen }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    Promise.all([
      tmdb('/search/multi', { query, include_adult: false }),
      searchAnime(query).catch(() => ({ results: [] })),
    ]).then(([tmdbData, animeData]) => {
      const tmdbFiltered = (tmdbData.results || []).filter(r =>
        (r.media_type === 'movie' || r.media_type === 'tv') &&
        r.poster_path &&
        !(r.genre_ids || []).includes(ANIMATION_GENRE_ID)
      );
      const animeResults = (animeData.results || []).map(a => ({ ...a, media_type: 'anime' }));
      setResults([...animeResults, ...tmdbFiltered]);
      setLoading(false);
    });
  }, [query]);

  return (
    <div className="page search-page">
      <div className="search-label">Results for <span>"{query}"</span></div>
      {loading ? (
        <div className="browse-grid">
          {Array.from({ length: 10 }, (_, i) => <SkeletonCard key={i} wide />)}
        </div>
      ) : results.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🔍</div><p>No results found</p></div>
      ) : (
        <div className="browse-grid">
          {results.map(item => (
            <Card key={`${item.media_type}-${item.id}`} item={item} type={item.media_type} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}