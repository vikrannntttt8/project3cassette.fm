import {
  searchMusic,
  getAlbumDetails,
  getWatchNext,
  getHomeFeedData,
  getArtistDetails,
  resolveAudioStream,
} from '../src/services/innertube.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  try {
    // ── 1. GET /api/search?q=:query ─────────────────────────────
    if (pathname === '/api/search') {
      const query = url.searchParams.get('q') || url.searchParams.get('query') || '';
      const type = url.searchParams.get('type') || 'all';
      const results = await searchMusic(query, type);
      return res.status(200).json(results);
    }

    // ── 2. GET /api/album/:id ───────────────────────────────────
    if (pathname.startsWith('/api/album/')) {
      const browseId = pathname.replace('/api/album/', '').split('?')[0];
      const albumData = await getAlbumDetails(browseId);
      return res.status(200).json(albumData);
    }

    // ── 3. GET /api/next/:id ────────────────────────────────────
    if (pathname.startsWith('/api/next/')) {
      const videoId = pathname.replace('/api/next/', '').split('?')[0];
      const recommendations = await getWatchNext(videoId);
      return res.status(200).json(recommendations);
    }

    // ── 4. GET /api/home/feed ───────────────────────────────────
    if (pathname === '/api/home/feed') {
      const feedData = await getHomeFeedData();
      return res.status(200).json(feedData);
    }

    // ── 5. GET /api/artist/:id ──────────────────────────────────
    if (pathname.startsWith('/api/artist/')) {
      const browseId = pathname.replace('/api/artist/', '').split('?')[0];
      const artistData = await getArtistDetails(browseId);
      return res.status(200).json(artistData);
    }

    // ── 6. GET /api/stream/:id ──────────────────────────────────
    if (pathname.startsWith('/api/stream/')) {
      const videoId = pathname.replace('/api/stream/', '').split('?')[0];
      const quality = url.searchParams.get('quality') || 'max';
      const streamInfo = await resolveAudioStream(videoId, quality);
      return res.status(200).json(streamInfo);
    }

    return res.status(404).json({ error: `Route not found: ${pathname}` });
  } catch (err) {
    console.error(`[API Handler Error] on ${pathname}:`, err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
