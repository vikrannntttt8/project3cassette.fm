import {
  searchMusic,
  getAlbumDetails,
  getWatchNext,
  getHomeFeedData,
  getArtistDetails,
  resolveAudioStream,
} from '../src/services/innertube.js';

export default async function handler(req, res) {
  // Explicit Global CORS & Streaming Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Authorization, Accept, X-Requested-With');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const url = new URL(req.url, `${proto}://${host}`);
  const pathname = url.pathname;

  try {
    // ── 1. GET /api/search?q=:query&type=:type ──────────────────
    if (pathname === '/api/search') {
      const query = url.searchParams.get('q') || url.searchParams.get('query') || '';
      const type = url.searchParams.get('type') || 'all';
      try {
        const results = await searchMusic(query, type);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(200).json(results);
      } catch (err) {
        console.error('[API /api/search] Error:', err);
        return res.status(200).json([]);
      }
    }

    // ── 2. GET /api/home/feed ───────────────────────────────────
    if (pathname === '/api/home/feed') {
      try {
        const feedData = await getHomeFeedData();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(200).json(feedData);
      } catch (err) {
        console.error('[API /api/home/feed] Error:', err);
        return res.status(200).json({
          quickPicks: [],
          dailyMixes: [],
          trendingAlbums: [],
          dynamicSections: [],
          error: err.message,
        });
      }
    }

    // ── 3. GET /api/album/:id ───────────────────────────────────
    if (pathname.startsWith('/api/album/')) {
      const browseId = pathname.replace('/api/album/', '').split('?')[0];
      try {
        const albumData = await getAlbumDetails(browseId);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(200).json(albumData);
      } catch (err) {
        console.error('[API /api/album] Error:', err);
        return res.status(200).json({
          id: browseId,
          browseId,
          title: 'Album Release',
          artist: 'Unknown Artist',
          tracks: [],
          error: err.message,
        });
      }
    }

    // ── 4. GET /api/next/:id ────────────────────────────────────
    if (pathname.startsWith('/api/next/')) {
      const videoId = pathname.replace('/api/next/', '').split('?')[0];
      try {
        const recommendations = await getWatchNext(videoId);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(200).json(recommendations);
      } catch (err) {
        console.error('[API /api/next] Error:', err);
        return res.status(200).json([]);
      }
    }

    // ── 5. GET /api/artist/:id ──────────────────────────────────
    if (pathname.startsWith('/api/artist/')) {
      const rawId = pathname.replace('/api/artist/', '').split('?')[0];
      const browseId = decodeURIComponent(rawId);
      try {
        const artistData = await getArtistDetails(browseId);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(200).json(artistData);
      } catch (err) {
        console.error('[API /api/artist] Error:', err);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(200).json({
          id: browseId,
          browseId: browseId,
          name: browseId,
          description: `Artist details for ${browseId}`,
          thumbnail: '',
          topSongs: [],
          albums: [],
          singles: [],
          videos: [],
          playlists: [],
          similarArtists: [],
          error: err.message,
        });
      }
    }

    // ── 6. GET /api/stream/:id ──────────────────────────────────
    if (pathname.startsWith('/api/stream/')) {
      const videoId = pathname.replace('/api/stream/', '').split('?')[0];
      const quality = url.searchParams.get('quality') || 'max';
      try {
        const streamInfo = await resolveAudioStream(videoId, quality);

        // If JSON requested via query param or header
        if (url.searchParams.get('format') === 'json' || req.headers.accept?.includes('application/json')) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          return res.status(200).json(streamInfo);
        }

        // Handle direct audio range proxy
        const headers = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'Referer': 'https://music.youtube.com/',
          'Origin': 'https://music.youtube.com',
        };

        if (req.headers.range) {
          headers['Range'] = req.headers.range;
        }

        const streamRes = await fetch(streamInfo.streamUrl, { headers });
        res.statusCode = streamRes.status;
        res.setHeader('Content-Type', streamRes.headers.get('content-type') || 'audio/webm');
        res.setHeader('Accept-Ranges', 'bytes');

        if (streamRes.headers.has('content-length')) {
          res.setHeader('Content-Length', streamRes.headers.get('content-length'));
        }
        if (streamRes.headers.has('content-range')) {
          res.setHeader('Content-Range', streamRes.headers.get('content-range'));
        }

        if (!streamRes.body) {
          return res.end();
        }

        const reader = streamRes.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!res.write(value)) {
            await new Promise((resolve) => res.once('drain', resolve));
          }
        }
        return res.end();
      } catch (err) {
        console.error('[API /api/stream] Error:', err);
        return res.status(500).json({ error: err.message });
      }
    }

    // ── 7. GET /api/spotify/credits ─────────────────────────────
    if (pathname === '/api/spotify/credits') {
      const trackTitle = url.searchParams.get('title') || '';
      const artistName = url.searchParams.get('artist') || '';
      try {
        const clientId = process.env.SPOTIFY_CLIENT_ID || process.env.VITE_SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || process.env.VITE_SPOTIFY_CLIENT_SECRET;

        let spotifyData = null;
        if (clientId && clientSecret) {
          try {
            const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
              },
              body: 'grant_type=client_credentials',
            });
            if (tokenRes.ok) {
              const tokenJson = await tokenRes.json();
              const accessToken = tokenJson.access_token;
              const cleanQ = `${trackTitle.replace(/[^\w\s]/g, '')} ${artistName.replace(/[^\w\s]/g, '')}`.trim();
              const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(cleanQ)}&type=track&limit=1`, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
              });
              if (searchRes.ok) {
                const searchJson = await searchRes.json();
                const track = searchJson.tracks?.items?.[0];
                if (track) {
                  spotifyData = {
                    title: track.name,
                    artists: track.artists?.map((a) => a.name) || [artistName],
                    album: track.album?.name,
                    releaseDate: track.album?.release_date,
                    spotifyUrl: track.external_urls?.spotify,
                    popularity: track.popularity,
                    isrc: track.external_ids?.isrc,
                  };
                }
              }
            }
          } catch (e) {
            console.warn('[Spotify API] Request failed:', e.message);
          }
        }

        const credits = {
          title: spotifyData?.title || trackTitle || 'Unknown Track',
          performers: spotifyData?.artists || [artistName || 'Various Artists'],
          songwriters: spotifyData?.artists || [artistName || 'Original Writer'],
          producers: [artistName || 'cassette.fm Studio', 'Executive Audio'],
          source: spotifyData ? 'Spotify API' : 'cassette.fm Engine',
          releaseDate: spotifyData?.releaseDate || new Date().getFullYear().toString(),
          album: spotifyData?.album || 'Single',
          isrc: spotifyData?.isrc || null,
          spotifyUrl: spotifyData?.spotifyUrl || null,
        };

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(200).json(credits);
      } catch (err) {
        console.error('[API /api/spotify/credits] Error:', err);
        return res.status(200).json({
          title: trackTitle,
          performers: [artistName || 'Unknown Artist'],
          songwriters: [artistName || 'Unknown Writer'],
          producers: ['cassette.fm Engine'],
          source: 'cassette.fm Fallback',
        });
      }
    }

    return res.status(404).json({ error: `Route not found: ${pathname}` });
  } catch (err) {
    console.error(`[API Handler Catch-all Error] on ${pathname}:`, err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
