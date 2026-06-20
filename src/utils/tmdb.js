export const WORKER_URL = import.meta.env.VITE_WORKER_URL;
export const TMDB_KEY   = import.meta.env.VITE_TMDB_KEY;
export const TMDB_BASE  = 'https://api.themoviedb.org/3';
export const IMG        = 'https://image.tmdb.org/t/p/';

// Video servers
export const SERVERS = [
    { id: 'videasy', label: 'Videasy (Server 1)', movie: (id) => `https://player.videasy.to/movie/${id}`, tv: (id, s, e) => `https://player.videasy.to/tv/${id}/${s}/${e}` },
  { id: 'vidking', label: 'VidKing (Server 2)',  movie: (id) => `https://www.vidking.net/embed/movie/${id}`,   tv: (id, s, e) => `https://www.vidking.net/embed/tv/${id}/${s}/${e}` },
    { id: 'vidfast', label: 'VidFast (Server 3)', movie: (id) => `https://vidfast.pro/movie/${id}?autoPlay=true`, tv: (id,s,e) => `https://vidfast.pro/tv/${id}/${s}/${e}?autoPlay=true` },
  { id: 'vidzen',  label: 'VidZen (Server 4)',   movie: (id) => `https://vidzen.fun/movie/${id}`, tv: (id,s,e) => `https://vidzen.fun/tv/${id}/${s}/${e}` },
  { id: '111movies',label: '111Movies (Server 5)',movie: (id) => `https://111movies.net/movie/${id}`, tv: (id,s,e) => `https://111movies.net/tv/${id}/${s}/${e}` },
    { id: 'rive',    label: 'Rive (Server 6)',     movie: (id) => `https://rivestream.ru/embed?type=movie&id=${id}`, tv: (id,s,e) => `https://rivestream.ru/embed?type=tv&id=${id}&season=${s}&episode=${e}` },
  { id: 'vidsrc',  label: 'VidSrc (Server 7)',   movie: (id) => `https://vsembed.ru/embed/movie/${id}`, tv: (id, s, e) => `https://vsembed.ru/embed/tv/${id}/${s}/${e}` },
 { id: 'vidapi',  label: 'VidAPI (Server 8)',   movie: (id) => `https://vidapi.xyz/embed/movie/${id}`, tv: (id, s, e) => `https://vidapi.xyz/embed/tv/${id}/${s}/${e}` },
];

export const GENRE_MAP = {
  28:'Action', 12:'Adventure', 16:'Animation', 35:'Comedy', 80:'Crime',
  99:'Documentary', 18:'Drama', 10751:'Family', 14:'Fantasy', 36:'History',
  27:'Horror', 10402:'Music', 9648:'Mystery', 10749:'Romance', 878:'Sci-Fi',
  10770:'TV Movie', 53:'Thriller', 10752:'War', 37:'Western',
  10759:'Action & Adventure', 10762:'Kids', 10763:'News', 10764:'Reality',
  10765:'Sci-Fi & Fantasy', 10766:'Soap', 10767:'Talk', 10768:'War & Politics',
};

export async function tmdb(path, params = {}) {
  const url = new URL(TMDB_BASE + path);
  url.searchParams.set('api_key', TMDB_KEY);
  url.searchParams.set('language', 'en-US');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const res = await fetch(url);
    return res.json();
  } catch (e) {
    console.error('TMDB error:', e);
    return {};
  }
}

export function skeletonCards(count) {
  return Array.from({ length: count }, (_, i) => (
    { _skeleton: true, id: `sk-${i}` }
  ));
}
