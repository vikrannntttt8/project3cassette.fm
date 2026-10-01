/**
 * Spotify Playlist Parser and YouTube Music Matcher
 * Parses public Spotify playlist URLs and extracts track metadata (title, artists, album, duration),
 * then matches each track against YouTube Music using Innertube search.
 */

export function extractSpotifyPlaylistId(urlOrId) {
  if (!urlOrId) return null;
  const str = String(urlOrId).trim();
  
  // Direct ID check (22 alphanumeric characters typically)
  if (/^[a-zA-Z0-9]{22}$/.test(str)) {
    return str;
  }
  
  // URI format: spotify:playlist:37i9dQZF1DXcBWIGoYBM5M
  const uriMatch = str.match(/spotify:playlist:([a-zA-Z0-9]+)/i);
  if (uriMatch) return uriMatch[1];
  
  // URL format: open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=...
  const urlMatch = str.match(/open\.spotify\.com\/(?:embed\/)?playlist\/([a-zA-Z0-9]+)/i);
  if (urlMatch) return urlMatch[1];

  // Album support: open.spotify.com/album/...
  const albumMatch = str.match(/open\.spotify\.com\/(?:embed\/)?album\/([a-zA-Z0-9]+)/i);
  if (albumMatch) return { id: albumMatch[1], type: 'album' };

  return null;
}

/**
 * Fetches playlist metadata & raw tracklist from Spotify public embed / API
 */
export async function fetchSpotifyPlaylistData(playlistId) {
  const targetId = typeof playlistId === 'object' ? playlistId.id : playlistId;
  const isAlbum = typeof playlistId === 'object' && playlistId.type === 'album';
  const embedUrl = isAlbum 
    ? `https://open.spotify.com/embed/album/${targetId}`
    : `https://open.spotify.com/embed/playlist/${targetId}`;

  const res = await fetch(embedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Spotify playlist (HTTP ${res.status}). Please ensure the playlist is public.`);
  }

  const html = await res.text();

  // Try parsing __NEXT_DATA__
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (nextDataMatch && nextDataMatch[1]) {
    try {
      const parsed = JSON.parse(nextDataMatch[1]);
      const entity = parsed?.props?.pageProps?.state?.data?.entity;
      if (entity) {
        const title = entity.name || entity.title || 'Spotify Playlist';
        const subtitle = entity.subtitle || entity.description || '';
        const cover = entity.visualIdentity?.image?.[0]?.url || entity.coverArt?.sources?.[0]?.url || entity.images?.[0]?.url || '';
        const rawTracks = entity.trackList || entity.tracks?.items || [];

        const tracks = rawTracks.map((t, idx) => {
          const trackTitle = t.title || t.name || t.track?.name || 'Unknown Track';
          const artistName = t.subtitle || (Array.isArray(t.artists) ? t.artists.map(a => a.name).join(', ') : t.artists?.items?.map(a => a.profile?.name).join(', ')) || t.artist || 'Unknown Artist';
          const duration = Math.round((t.duration || t.duration_ms || 0) / 1000);
          return {
            id: `sp_${t.uri || t.id || idx}`,
            title: trackTitle,
            artist: artistName,
            album: entity.name || 'Spotify Import',
            duration: duration || 180,
            thumbnail: cover,
          };
        }).filter(t => Boolean(t.title && t.title !== 'Unknown Track'));

        if (tracks.length > 0) {
          return {
            id: targetId,
            title,
            description: subtitle || `${tracks.length} tracks · Imported from Spotify`,
            thumbnail: cover,
            tracks,
          };
        }
      }
    } catch (e) {
      console.warn('[Spotify Parser] __NEXT_DATA__ JSON parse failed:', e.message);
    }
  }

  // Fallback 1: Check for session or other embedded JSON in scripts
  const scriptRegex = /<script[^>]*id="initial-state"[^>]*>([\s\S]*?)<\/script>|<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    const jsonStr = match[1] || match[2];
    if (jsonStr && jsonStr.includes('trackList')) {
      try {
        const parsed = JSON.parse(jsonStr);
        const entity = parsed?.entity || parsed?.data?.entity;
        if (entity?.trackList?.length) {
          return {
            id: targetId,
            title: entity.name || 'Spotify Playlist',
            description: entity.subtitle || `${entity.trackList.length} tracks · Imported from Spotify`,
            thumbnail: entity.visualIdentity?.image?.[0]?.url || '',
            tracks: entity.trackList.map((t, idx) => ({
              id: `sp_${idx}`,
              title: t.title || t.name,
              artist: t.subtitle || 'Unknown Artist',
              album: entity.name,
              duration: Math.round((t.duration || 0) / 1000) || 180,
              thumbnail: entity.visualIdentity?.image?.[0]?.url || '',
            })),
          };
        }
      } catch {
        // continue
      }
    }
  }

  // Fallback 2: Tokenless Web API request
  try {
    const tokenRes = await fetch('https://open.spotify.com/get_access_token?reason=transport&productType=web_player', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });
    if (tokenRes.ok) {
      const tokenData = await tokenRes.json();
      const accessToken = tokenData?.accessToken;
      if (accessToken) {
        const apiEndpoint = isAlbum
          ? `https://api.spotify.com/v1/albums/${targetId}`
          : `https://api.spotify.com/v1/playlists/${targetId}`;
        const spotifyApiRes = await fetch(apiEndpoint, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        if (spotifyApiRes.ok) {
          const apiData = await spotifyApiRes.json();
          const title = apiData.name || 'Spotify Playlist';
          const description = apiData.description || '';
          const thumbnail = apiData.images?.[0]?.url || '';
          const rawItems = apiData.tracks?.items || [];
          const tracks = rawItems.map((item, idx) => {
            const track = item.track || item;
            if (!track || !track.name) return null;
            return {
              id: `sp_${track.id || idx}`,
              title: track.name,
              artist: (track.artists || []).map(a => a.name).join(', ') || 'Unknown Artist',
              album: track.album?.name || title,
              duration: Math.round((track.duration_ms || 0) / 1000) || 180,
              thumbnail: track.album?.images?.[0]?.url || thumbnail,
            };
          }).filter(Boolean);

          if (tracks.length > 0) {
            return {
              id: targetId,
              title,
              description: description || `${tracks.length} tracks · Imported from Spotify`,
              thumbnail,
              tracks,
            };
          }
        }
      }
    }
  } catch (tokenErr) {
    console.warn('[Spotify Tokenless API Fallback] Error:', tokenErr.message);
  }

  throw new Error('Unable to extract tracks from this Spotify playlist. Please check that the URL is public and valid.');
}

/**
 * Fuzzy similarity scoring between two strings (0.0 to 1.0)
 */
function stringSimilarity(str1 = '', str2 = '') {
  const s1 = String(str1).toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = String(str2).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;

  // Dice coefficient on bigrams
  const getBigrams = (str) => {
    const bigrams = new Set();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.slice(i, i + 2));
    }
    return bigrams;
  };

  const b1 = getBigrams(s1);
  const b2 = getBigrams(s2);
  let intersection = 0;
  for (const item of b1) {
    if (b2.has(item)) intersection++;
  }
  return (2.0 * intersection) / (b1.size + b2.size || 1);
}

/**
 * Matches a list of Spotify tracks to YouTube Music video streams sequentially
 * with real-time progress reporting.
 */
export async function matchSpotifyTracksToYouTube(tracks, onProgress, options = {}) {
  const matchedSongs = [];
  const total = tracks.length;
  const abortSignal = options.signal;

  for (let i = 0; i < total; i++) {
    if (abortSignal?.aborted) {
      throw new Error('Import cancelled by user.');
    }

    const spTrack = tracks[i];
    let matchedItem = null;

    try {
      // Build search query
      const query = `${spTrack.title} ${spTrack.artist}`.trim();
      const searchUrl = `/api/search?q=${encodeURIComponent(query)}&type=song`;
      
      const searchRes = await fetch(searchUrl);
      if (searchRes.ok) {
        const results = await searchRes.json();
        const songList = Array.isArray(results) ? results : (results.results || []);

        if (songList.length > 0) {
          // Score results to pick the best match
          let bestScore = -1;
          let bestCandidate = songList[0];

          for (const cand of songList.slice(0, 5)) {
            const titleScore = stringSimilarity(spTrack.title, cand.title || cand.name);
            const artistScore = stringSimilarity(spTrack.artist, cand.artist || cand.author?.name || '');
            const totalScore = (titleScore * 0.6) + (artistScore * 0.4);

            if (totalScore > bestScore) {
              bestScore = totalScore;
              bestCandidate = cand;
            }
          }

          const vidId = bestCandidate.id || bestCandidate.videoId;
          if (vidId) {
            matchedItem = {
              id: vidId,
              videoId: vidId,
              title: bestCandidate.title || spTrack.title,
              artist: bestCandidate.artist || spTrack.artist,
              artists: bestCandidate.artists || [{ name: bestCandidate.artist || spTrack.artist }],
              thumbnail: bestCandidate.thumbnail || spTrack.thumbnail,
              cover: bestCandidate.thumbnail || spTrack.thumbnail,
              duration: bestCandidate.duration || spTrack.duration || 180,
              album: bestCandidate.album || spTrack.album || 'Spotify Import',
              importedFrom: 'spotify',
            };
          }
        }
      }
    } catch (err) {
      console.warn(`[Spotify Matcher] Failed to match track ${spTrack.title}:`, err.message);
    }

    // Fallback if search failed: keep spotify metadata with fallback ID if needed
    if (!matchedItem) {
      matchedItem = {
        id: spTrack.id || `sp_${i}`,
        videoId: null,
        title: spTrack.title,
        artist: spTrack.artist,
        artists: [{ name: spTrack.artist }],
        thumbnail: spTrack.thumbnail,
        cover: spTrack.thumbnail,
        duration: spTrack.duration || 180,
        album: spTrack.album || 'Spotify Import',
        importedFrom: 'spotify',
        unresolved: true,
      };
    }

    matchedSongs.push(matchedItem);

    if (typeof onProgress === 'function') {
      onProgress({
        current: i + 1,
        total,
        percent: Math.round(((i + 1) / total) * 100),
        currentTrack: spTrack,
        matchedTrack: matchedItem,
        matchedCount: matchedSongs.filter(s => !s.unresolved).length,
      });
    }

    // Small delay between searches to prevent network congestion
    if (i < total - 1) {
      await new Promise((r) => setTimeout(r, 120));
    }
  }

  return matchedSongs;
}

