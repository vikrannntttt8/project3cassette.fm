import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Backend API Gateway Plugin:
 * Implements lightweight server routes using Vite middleware:
 * - GET /api/search?q=:query
 * - GET /api/stream/:id
 * - GET /api/artist/:id
 */
function innertubeApiPlugin() {
  return {
    name: 'innertube-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const parsedUrl = new URL(req.url, 'http://localhost');
        const pathname = parsedUrl.pathname;

        // ── 1. GET /api/search?q=:query ───────────────────────────────────
        // ── 1. GET /api/search?q=:query&type=:type ───────────────────────
        if (pathname === '/api/search' && req.method === 'GET') {
          try {
            const query = parsedUrl.searchParams.get('q') || parsedUrl.searchParams.get('query') || '';
            const type = parsedUrl.searchParams.get('type') || 'all';
            const { searchMusic } = await import('./src/services/innertube.js');
            const results = await searchMusic(query, type);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.statusCode = 200;
            res.end(JSON.stringify(results));
            return;
          } catch (err) {
            console.error('[API /api/search] Error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // ── 1b. GET /api/album/:id ────────────────────────────────────────
        if (pathname.startsWith('/api/album/') && req.method === 'GET') {
          const browseId = pathname.replace('/api/album/', '').split('?')[0];
          try {
            const { getAlbumDetails } = await import('./src/services/innertube.js');
            const albumData = await getAlbumDetails(browseId);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.statusCode = 200;
            res.end(JSON.stringify(albumData));
            return;
          } catch (err) {
            console.error('[API /api/album] Error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // ── 1c. GET /api/next/:id ─────────────────────────────────────────
        if (pathname.startsWith('/api/next/') && req.method === 'GET') {
          const videoId = pathname.replace('/api/next/', '').split('?')[0];
          try {
            const { getWatchNext } = await import('./src/services/innertube.js');
            const recommendations = await getWatchNext(videoId);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.statusCode = 200;
            res.end(JSON.stringify(recommendations));
            return;
          } catch (err) {
            console.error('[API /api/next] Error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // ── 1d. GET /api/home/feed ─────────────────────────────────────────
        if (pathname === '/api/home/feed' && req.method === 'GET') {
          try {
            const { getHomeFeedData } = await import('./src/services/innertube.js');
            const feedData = await getHomeFeedData();
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.statusCode = 200;
            res.end(JSON.stringify(feedData));
            return;
          } catch (err) {
            console.error('[API /api/home/feed] Error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message, quickPicks: [], dailyMixes: [], trendingAlbums: [], dynamicSections: [] }));
            return;
          }
        }

        // ── 1e. GET /api/spotify/credits ──────────────────────────────────
        if (pathname === '/api/spotify/credits' && req.method === 'GET') {
          const trackTitle = parsedUrl.searchParams.get('title') || '';
          const artistName = parsedUrl.searchParams.get('artist') || '';
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
                        artists: track.artists?.map(a => a.name) || [artistName],
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
              producers: [artistName || 'Pulse Studio', 'Executive Audio'],
              source: spotifyData ? 'Spotify API' : 'Pulse Music Studio',
              releaseDate: spotifyData?.releaseDate || new Date().getFullYear().toString(),
              album: spotifyData?.album || 'Single',
              isrc: spotifyData?.isrc || null,
              spotifyUrl: spotifyData?.spotifyUrl || null,
            };

            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.statusCode = 200;
            res.end(JSON.stringify(credits));
            return;
          } catch (err) {
            console.error('[API /api/spotify/credits] Error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // ── 2. GET /api/stream/:id ────────────────────────────────────────
        if (pathname.startsWith('/api/stream/') && req.method === 'GET') {
          const videoId = pathname.replace('/api/stream/', '').split('?')[0];
          const quality = parsedUrl.searchParams.get('quality') || 'max';
          try {
            const { resolveAudioStream } = await import('./src/services/innertube.js');
            const streamInfo = await resolveAudioStream(videoId, quality);

            // If JSON requested via query param or Accept header
            if (parsedUrl.searchParams.get('format') === 'json' || req.headers.accept?.includes('application/json')) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.statusCode = 200;
              res.end(JSON.stringify(streamInfo));
              return;
            }

            // Pipe audio stream directly with Range support
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
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', streamRes.headers.get('content-type') || 'audio/mp4');
            res.setHeader('Accept-Ranges', 'bytes');

            if (streamRes.headers.has('content-length')) {
              res.setHeader('Content-Length', streamRes.headers.get('content-length'));
            }
            if (streamRes.headers.has('content-range')) {
              res.setHeader('Content-Range', streamRes.headers.get('content-range'));
            }

            if (!streamRes.body) {
              res.end();
              return;
            }

            // Pipe ReadableStream to Node HTTP response
            const reader = streamRes.body.getReader();
            const pump = async () => {
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  if (!res.write(value)) {
                    await new Promise((resolve) => res.once('drain', resolve));
                  }
                }
                res.end();
              } catch (e) {
                res.destroy(e);
              }
            };
            pump();
            return;
          } catch (err) {
            console.error('[API /api/stream] Error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // ── 3. GET /api/artist/:id ────────────────────────────────────────
        if (pathname.startsWith('/api/artist/') && req.method === 'GET') {
          const browseId = pathname.replace('/api/artist/', '').split('?')[0];
          try {
            const { getArtistDetails } = await import('./src/services/innertube.js');
            const artistData = await getArtistDetails(browseId);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.statusCode = 200;
            res.end(JSON.stringify(artistData));
            return;
          } catch (err) {
            console.error('[API /api/artist] Error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // ── 4. POST /api/sync/test ───────────────────────────────────────
        if (pathname === '/api/sync/test' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const { mode, sapisid, accessToken } = JSON.parse(body || '{}');
              const headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                'Referer': 'https://music.youtube.com/',
                'Origin': 'https://music.youtube.com',
                'X-YouTube-Client-Name': '67',
                'X-YouTube-Client-Version': '1.20250101.01.00',
              };

              if (mode === 'oauth' && accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`;
              } else if (mode === 'sapisid' && sapisid) {
                headers['Cookie'] = `SAPISID=${sapisid}; __Secure-3PAPISID=${sapisid};`;
              }

              const ytRes = await fetch('https://music.youtube.com/youtubei/v1/browse?prettyPrint=false', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  context: {
                    client: {
                      clientName: 'WEB_REMIX',
                      clientVersion: '1.20250101.01.00',
                      hl: 'en',
                      gl: 'US',
                    },
                  },
                  browseId: 'FEmusic_liked',
                }),
              });

              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.setHeader('Access-Control-Allow-Origin', '*');

              if (ytRes.ok) {
                const data = await ytRes.json();
                res.statusCode = 200;
                res.end(JSON.stringify({
                  success: true,
                  status: 'connected',
                  accountName: data.header?.musicHeaderRenderer?.title?.runs?.[0]?.text || 'YouTube Music Account',
                }));
              } else {
                res.statusCode = ytRes.status === 401 || ytRes.status === 403 ? 401 : ytRes.status;
                res.end(JSON.stringify({
                  success: false,
                  status: ytRes.status,
                  message: `YouTube API returned ${ytRes.status} (Authentication required or token expired)`,
                }));
              }
            } catch (err) {
              console.error('[API /api/sync/test] Error:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, message: err.message }));
            }
          });
          return;
        }

        // ── 5. Proxy /youtubei/v1/* ────────────────────────────────────────
        if (pathname.startsWith('/youtubei/v1/')) {
          try {
            const targetUrl = `https://music.youtube.com${pathname}${parsedUrl.search}`;
            const fwdHeaders = {
              'Content-Type': req.headers['content-type'] || 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
              'Referer': 'https://music.youtube.com/',
              'Origin': 'https://music.youtube.com',
              'X-YouTube-Client-Name': '67',
              'X-YouTube-Client-Version': '1.20250101.01.00',
            };

            if (req.headers['authorization']) fwdHeaders['Authorization'] = req.headers['authorization'];
            if (req.headers['cookie']) fwdHeaders['Cookie'] = req.headers['cookie'];

            let body = null;
            if (req.method === 'POST') {
              body = await new Promise((resolve) => {
                let data = '';
                req.on('data', chunk => { data += chunk; });
                req.on('end', () => resolve(data));
              });
            }

            const proxyRes = await fetch(targetUrl, {
              method: req.method,
              headers: fwdHeaders,
              body,
            });

            res.statusCode = proxyRes.status;
            res.setHeader('Content-Type', proxyRes.headers.get('content-type') || 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            const data = await proxyRes.text();
            res.end(data);
            return;
          } catch (err) {
            console.error('[Proxy /youtubei/v1] Error:', err);
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), innertubeApiPlugin()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api/saavn': {
        target: 'https://saavn.dev/api',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/saavn/, ''),
      },
      '/api/jiosaavn': {
        target: 'https://www.jiosaavn.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/jiosaavn/, ''),
      },
      '/api/yt': {
        target: 'https://www.youtube.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/yt/, ''),
      },
      '/youtubei/v1': {
        target: 'https://music.youtube.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
