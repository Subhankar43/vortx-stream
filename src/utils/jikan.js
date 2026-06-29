export const JIKAN_BASE = 'https://api.jikan.moe/v4';

// Jikan rate limit: ~3 req/sec, 60 req/min — simple delay queue
let lastCall = 0;
async function jikanFetch(path) {
  const wait = Math.max(0, 350 - (Date.now() - lastCall));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastCall = Date.now();
  const res = await fetch(`${JIKAN_BASE}${path}`);
  if (!res.ok) throw new Error(`Jikan error ${res.status}`);
  return res.json();
}

// Map a Jikan anime object into TMDB-like shape so Card.jsx works unchanged
function mapAnime(a) {
  return {
    id: a.mal_id,
    mal_id: a.mal_id,
    title: a.title_english || a.title,
    name: a.title_english || a.title,
    poster_path: a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || '',
    backdrop_path: a.images?.jpg?.large_image_url || '',
    overview: a.synopsis || '',
    vote_average: a.score || 0,
    release_date: a.aired?.from || '',
    first_air_date: a.aired?.from || '',
    episodes: a.episodes,
    status: a.status,
  };
}

export async function getTopAnime(page = 1) {
  const data = await jikanFetch(`/top/anime?page=${page}&filter=bypopularity`);
  return { results: (data.data || []).map(mapAnime), hasMore: !!data.pagination?.has_next_page };
}

export async function getSeasonNowAnime(page = 1) {
  const data = await jikanFetch(`/seasons/now?page=${page}`);
  return { results: (data.data || []).map(mapAnime), hasMore: !!data.pagination?.has_next_page };
}

export async function searchAnime(query, page = 1) {
  const data = await jikanFetch(`/anime?q=${encodeURIComponent(query)}&page=${page}`);
  return { results: (data.data || []).map(mapAnime), hasMore: !!data.pagination?.has_next_page };
}

export async function getAnimeById(malId) {
  const data = await jikanFetch(`/anime/${malId}/full`);
  return mapAnime(data.data);
}

// Returns related seasons (prequel/sequel) as [{ mal_id, title, relation }]
export async function getAnimeRelations(malId) {
  const data = await jikanFetch(`/anime/${malId}/relations`);
  const relations = data.data || [];
  const seasons = [];
  for (const rel of relations) {
    if (rel.relation === 'Sequel' || rel.relation === 'Prequel') {
      for (const entry of rel.entry) {
        if (entry.type === 'anime') seasons.push({ mal_id: entry.mal_id, title: entry.name, relation: rel.relation });
      }
    }
  }
  return seasons;
}
import { WORKER_URL } from './tmdb';

export async function getAnimeServers() {
  try {
    const res = await fetch(`${WORKER_URL}/anime-servers`);
    const data = await res.json();
    return data.servers || [];
  } catch {
    return [];
  }
}

// Builds embed URL from admin-saved server template
// moviePath example: /stream/mal/{mal_id}/{ep}/{language}
export function buildAnimeEmbedUrl(serverObj, malId, ep, language) {
  if (!serverObj) return '';
  const path = (serverObj.moviePath || '')
    .replace('{mal_id}', malId)
    .replace('{ep}', ep)
    .replace('{language}', language);
  return (serverObj.baseUrl || '') + path;
}