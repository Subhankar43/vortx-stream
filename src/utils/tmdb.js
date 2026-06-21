export const WORKER_URL = import.meta.env.VITE_WORKER_URL;
export const TMDB_KEY   = import.meta.env.VITE_TMDB_KEY;
export const TMDB_BASE  = 'https://api.themoviedb.org/3';
export const IMG        = 'https://image.tmdb.org/t/p/';
// Add this function
const SERVER_CACHE_MS = 30 * 60 * 1000; // 30 mins

export async function getServerUrls() {
  const DEFAULTS = {
    videasy: 'https://player.videasy.to',
    vidking: 'https://www.vidking.net',
    vidfast: 'https://vidfast.pro',
    vidzen: 'https://vidzen.fun',
    '111movies': 'https://111movies.net',
    rive: 'https://rivestream.ru',
    vidsrc: 'https://vsembed.ru',
    vidapi: 'https://vidapi.xyz',
  };
 try {
    const ts = localStorage.getItem('vx-server-urls-ts');
    const cached = localStorage.getItem('vx-server-urls');
    if (cached && ts && Date.now() - Number(ts) < SERVER_CACHE_MS) {
      return JSON.parse(cached);
    }
    const res = await fetch(`${WORKER_URL}/public/server-urls`);
    const data = await res.json();
    if (data.urls) {
      localStorage.setItem('vx-server-urls', JSON.stringify(data.urls));
      localStorage.setItem('vx-server-urls-ts', String(Date.now()));
      return data.urls;
    }
  } catch {}
  return DEFAULTS;
}

const CUSTOM_SERVERS_CACHE_MS = 30 * 60 * 1000;

export async function getCustomServers() {
  try {
    const ts = localStorage.getItem('vx-custom-servers-ts');
    const cached = localStorage.getItem('vx-custom-servers');
    if (cached && ts && Date.now() - Number(ts) < CUSTOM_SERVERS_CACHE_MS) {
      return JSON.parse(cached);
    }
    const res = await fetch(`${WORKER_URL}/public/custom-servers`);
    const data = await res.json();
    if (data.servers) {
      localStorage.setItem('vx-custom-servers', JSON.stringify(data.servers));
      localStorage.setItem('vx-custom-servers-ts', String(Date.now()));
      return data.servers;
    }
  } catch {}
  return [];
}

// Video servers
export const SERVERS = [
  { id: 'videasy',   label: 'Videasy (Server 1)',   movie: async (id)      => `${(await getServerUrls()).videasy}/movie/${id}`,                    tv: async (id,s,e) => `${(await getServerUrls()).videasy}/tv/${id}/${s}/${e}` },
  { id: 'vidking',   label: 'VidKing (Server 2)',    movie: async (id)      => `${(await getServerUrls()).vidking}/embed/movie/${id}`,              tv: async (id,s,e) => `${(await getServerUrls()).vidking}/embed/tv/${id}/${s}/${e}` },
  { id: 'vidfast',   label: 'VidFast (Server 3)',    movie: async (id)      => `${(await getServerUrls()).vidfast}/movie/${id}?autoPlay=true`,      tv: async (id,s,e) => `${(await getServerUrls()).vidfast}/tv/${id}/${s}/${e}?autoPlay=true` },
  { id: 'vidzen',    label: 'VidZen (Server 4)',     movie: async (id)      => `${(await getServerUrls()).vidzen}/movie/${id}`,                     tv: async (id,s,e) => `${(await getServerUrls()).vidzen}/tv/${id}/${s}/${e}` },
  { id: '111movies', label: '111Movies (Server 5)',  movie: async (id)      => `${(await getServerUrls())['111movies']}/movie/${id}`,               tv: async (id,s,e) => `${(await getServerUrls())['111movies']}/tv/${id}/${s}/${e}` },
  { id: 'rive',      label: 'Rive (Server 6)',       movie: async (id)      => `${(await getServerUrls()).rive}/embed?type=movie&id=${id}`,         tv: async (id,s,e) => `${(await getServerUrls()).rive}/embed?type=tv&id=${id}&season=${s}&episode=${e}` },
  { id: 'vidsrc',    label: 'VidSrc (Server 7)',     movie: async (id)      => `${(await getServerUrls()).vidsrc}/embed/movie/${id}`,               tv: async (id,s,e) => `${(await getServerUrls()).vidsrc}/embed/tv/${id}/${s}/${e}` },
  { id: 'vidapi',    label: 'VidAPI (Server 8)',     movie: async (id)      => `${(await getServerUrls()).vidapi}/embed/movie/${id}`,               tv: async (id,s,e) => `${(await getServerUrls()).vidapi}/embed/tv/${id}/${s}/${e}` },
];

export async function getAllServers() {
  const custom = await getCustomServers();
  const customFormatted = custom.map(s => ({
    id: s.id,
    label: s.label,
  movie: async (id) => (s.baseUrl || '') + s.moviePath.replace('{id}', id),
tv: async (id, season, episode) => (s.baseUrl || '') + s.tvPath.replace('{id}', id).replace('{season}', season).replace('{episode}', episode),
  }));
  return [...SERVERS, ...customFormatted];
}

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
