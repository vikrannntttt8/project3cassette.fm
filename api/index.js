import {
  searchMusic,
  getSearchSuggestions,
  getAlbumDetails,
  getWatchNext,
  getHomeFeedData,
  getArtistDetails,
  resolveAudioStream,
  getYouTubeMusicLibrary,
  testYouTubeMusicAuth,
  importPlaylistByUrl,
} from '../src/services/innertube.js';

export default async function handler(req, res) {
  // Explicit Global CORS & Streaming Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Authorization, Accept, X-Requested-With, x-ytmusic-cookie, x-visitor-data');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const url = new URL(req.url, `${proto}://${host}`);
  const pathname = url.pathname;

  try {
    // ── 0-sug. GET /api/search/suggestions?q=:query ─────────────
    if (pathname === '/api/search/suggestions') {
      const query = (
        url.searchParams.get('q') ||
        url.searchParams.get('query') ||
        ''
      ).trim();

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (!query) {
        return res.status(200).json([]);
      }

      try {
        const suggestions = await getSearchSuggestions(query);
        return res.status(200).json(Array.isArray(suggestions) ? suggestions : []);
      } catch (err) {
        console.error(`[API /api/search/suggestions] Error for "${query}":`, err);
        return res.status(200).json([]);
      }
    }

    // ── 0. POST/GET /api/playlist/import ─────────────────────────
    if (pathname === '/api/playlist/import') {
      try {
        let body = {};
        if (req.body) {
          body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        }

        const urlOrId = body.url || body.playlistId || url.searchParams.get('url') || url.searchParams.get('list') || url.searchParams.get('id') || '';
        if (!urlOrId) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          return res.status(400).json({ error: 'Missing "url" or "playlistId" parameter' });
        }

        const result = await importPlaylistByUrl(urlOrId);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(200).json(result);
      } catch (err) {
        console.error('[API /api/playlist/import] Error:', err);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(500).json({ success: false, error: err.message || 'Failed to import playlist' });
      }
    }

    // ── 0-spotify. POST/GET /api/spotify/playlist ────────────────
    if (pathname === '/api/spotify/playlist') {
      try {
        let body = {};
        if (req.body) {
          body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        }

        const urlOrId = body.url || body.playlistId || url.searchParams.get('url') || url.searchParams.get('id') || '';
        if (!urlOrId) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          return res.status(400).json({ error: 'Missing "url" or "id" parameter' });
        }

        const { extractSpotifyPlaylistId, fetchSpotifyPlaylistData } = await import('../src/services/spotifyService.js');
        const playlistId = extractSpotifyPlaylistId(urlOrId);
        if (!playlistId) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          return res.status(400).json({ error: 'Invalid Spotify playlist or album URL/ID' });
        }

        const playlistData = await fetchSpotifyPlaylistData(playlistId);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(200).json({ success: true, playlist: playlistData });
      } catch (err) {
        console.error('[API /api/spotify/playlist] Error:', err);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(500).json({ success: false, error: err.message || 'Failed to fetch Spotify playlist' });
      }
    }

    // ── 0a. POST/GET /api/ytmusic/library ─────────────────────────
    if (pathname === '/api/ytmusic/library') {
      try {
        let body = {};
        if (req.body) {
          body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        }

        const cookie = body.cookie || req.headers['x-ytmusic-cookie'] || url.searchParams.get('cookie') || '';
        const visitorData = body.visitorData || req.headers['x-visitor-data'] || url.searchParams.get('visitorData') || '';
        const sapisid = body.sapisid || url.searchParams.get('sapisid') || '';

        const libraryData = await getYouTubeMusicLibrary({ cookie, visitorData, sapisid });
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(200).json(libraryData);
      } catch (err) {
        console.error('[API /api/ytmusic/library] Error:', err);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(500).json({
          success: false,
          error: err.message || 'Failed to fetch YouTube Music library',
          liked: [],
          playlists: [],
        });
      }
    }

    // ── 0b. POST /api/sync/test ──────────────────────────────────
    if (pathname === '/api/sync/test') {
      try {
        let body = {};
        if (req.body) {
          body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        }

        const cookie = body.cookie || req.headers['x-ytmusic-cookie'] || body.sapisid || '';
        const visitorData = body.visitorData || req.headers['x-visitor-data'] || '';
        const sapisid = body.sapisid || '';

        const testResult = await testYouTubeMusicAuth({ cookie, visitorData, sapisid });
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(testResult.success ? 200 : 401).json(testResult);
      } catch (err) {
        console.error('[API /api/sync/test] Error:', err);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(401).json({ success: false, message: err.message });
      }
    }

    // ── 1. GET /api/search?q=:query&type=:type&continuation=:continuation ──
    if (pathname === '/api/search') {
      const query = (
        url.searchParams.get('q') ||
        url.searchParams.get('query') ||
        url.searchParams.get('search_query') ||
        ''
      ).trim();
      const type = url.searchParams.get('type') || 'all';
      const continuation = url.searchParams.get('continuation') || null;

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (!query && !continuation) {
        return res.status(200).json({ results: [], shelves: null, topResult: null, continuation: null });
      }

      try {
        const payload = await searchMusic(query, type, continuation);
        return res.status(200).json(payload);
      } catch (err) {
        console.error(`[API /api/search] Error searching for "${query}" (type: ${type}):`, err);
        return res.status(200).json({
          success: false,
          error: err.message || 'Search service temporarily unavailable',
          results: [],
          shelves: null,
          topResult: null,
          continuation: null,
        });
      }
    }

    // ── 2. GET /api/home & /api/home/feed ─────────────────────────
    if (pathname === '/api/home' || pathname === '/api/home/feed') {
      try {
        const feedData = await getHomeFeedData();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(200).json(feedData);
      } catch (err) {
        console.error('[API /api/home/feed] Error:', err);
        const { FALLBACK_HOME_FEED } = await import('../src/data/fallbackFeed.js');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(200).json(FALLBACK_HOME_FEED);
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
      const codec = url.searchParams.get('codec') || 'auto';

      // Set CORS headers first so browser can always read error responses
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type');

      // Step 1: Resolve the stream URL via Innertube
      let streamInfo;
      try {
        streamInfo = await resolveAudioStream(videoId, quality, codec);
      } catch (resolveErr) {
        console.error(`[API /api/stream] Resolution failed for ${videoId}:`, resolveErr.message);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(503).json({
          error: 'Stream resolution failed — audio engine could not decipher URL',
          detail: resolveErr.message,
          videoId,
          code: 'STREAM_RESOLVE_ERROR',
        });
      }

      // If JSON requested, return metadata only
      if (url.searchParams.get('format') === 'json' || req.headers.accept?.includes('application/json')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(200).json(streamInfo);
      }

      // Step 2: Fetch from YouTube CDN
      const upstreamHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Referer': 'https://music.youtube.com/',
        'Origin': 'https://music.youtube.com',
      };
      if (req.headers.range) upstreamHeaders['Range'] = req.headers.range;

      let streamRes;
      try {
        streamRes = await fetch(streamInfo.streamUrl, { headers: upstreamHeaders });
      } catch (fetchErr) {
        console.error(`[API /api/stream] CDN fetch failed for ${videoId}:`, fetchErr.message);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(503).json({
          error: 'YouTube CDN fetch failed',
          detail: fetchErr.message,
          videoId,
          code: 'CDN_FETCH_ERROR',
        });
      }

      // Step 3: Handle non-2xx from YouTube (403 = expired URL, 404 = unavailable)
      if (!streamRes.ok && streamRes.status !== 206) {
        console.error(`[API /api/stream] YouTube CDN returned ${streamRes.status} for ${videoId}`);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(502).json({
          error: `YouTube stream returned HTTP ${streamRes.status}`,
          detail: streamRes.status === 403
            ? 'Stream URL has expired (cipher signature invalidated). The next play will automatically retry.'
            : 'YouTube returned an error. The track may be unavailable in your region.',
          videoId,
          httpStatus: streamRes.status,
          code: 'UPSTREAM_HTTP_ERROR',
        });
      }

      // Step 4: Set audio headers BEFORE writing any body bytes
      const mimeType = streamRes.headers.get('content-type') || streamInfo.mimeType || 'audio/webm; codecs=opus';
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'no-cache');
      if (streamRes.headers.has('content-length')) {
        res.setHeader('Content-Length', streamRes.headers.get('content-length'));
      } else {
        res.setHeader('Transfer-Encoding', 'chunked');
      }
      if (streamRes.headers.has('content-range')) {
        res.setHeader('Content-Range', streamRes.headers.get('content-range'));
      }
      res.statusCode = streamRes.status;

      if (!streamRes.body) return res.end();

      // Step 5: Stream pipe with per-chunk error handling
      const reader = streamRes.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!res.write(value)) {
            await new Promise((resolve) => res.once('drain', resolve));
          }
        }
      } catch (pipeErr) {
        console.error(`[API /api/stream] Pipe error for ${videoId}:`, pipeErr.message);
      }
      return res.end();
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
