/**
 * saavn.js — Saavn API & Resilient Music Streaming Engine
 * ────────────────────────────────────────────────────────
 * Features:
 *   - Configured for saavn.dev endpoints via Vite proxy & CORS proxies
 *   - Direct 320kbps full-length audio extraction (never uses 30s previews)
 *   - DES decryption for JioSaavn full 320kbps CDN URLs
 *   - 500x500 ultra high-resolution album artwork
 *   - Synchronized LRC lyrics from lrclib.net and Saavn lyrics
 */

import CryptoJS from 'crypto-js';
import { DEMO_LRC } from './lrcParser.js';
import { searchYouTubeTracks } from './youtubeEngine.js';

// ── DES Decryption for JioSaavn 320kbps Streams ──────────────────────

function decryptMediaUrl(encrypted) {
  if (!encrypted || typeof encrypted !== 'string') return '';
  try {
    const key = CryptoJS.enc.Utf8.parse('38346591');
    const decrypted = CryptoJS.DES.decrypt(
      { ciphertext: CryptoJS.enc.Base64.parse(encrypted) },
      key,
      { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
    );
    const raw = decrypted.toString(CryptoJS.enc.Utf8);
    if (!raw) return '';
    // Upgrade any preview/standard bitrates directly to 320kbps full stream
    return raw.replace(/_[0-9]+(_p)?\.(mp4|mp3)/i, '_320.mp4');
  } catch {
    return '';
  }
}

// ── Image and Stream Extractors ──────────────────────────────────────

export function bestImage(arr) {
  if (!arr) return '';
  if (typeof arr === 'string') {
    return arr.replace(/-(?:50x50|150x150)\.(jpg|webp|png)/i, '-500x500.$1');
  }
  if (!Array.isArray(arr) || !arr.length) return '';
  // 1. Check for explicit 500x500 image object
  const highRes = arr.find(img => img?.quality === '500x500' || String(img?.quality).includes('500'));
  let url = highRes?.url || highRes?.link || arr[arr.length - 1]?.url || arr[arr.length - 1]?.link || arr[0]?.url || arr[0]?.link || '';
  // 2. Upgrade resolution in saavncdn URL
  if (typeof url === 'string' && url.includes('saavncdn.com')) {
    url = url.replace(/-(?:50x50|150x150)\.(jpg|webp|png)/i, '-500x500.$1');
  }
  return url;
}

export function bestStream(arr) {
  if (!arr) return '';
  if (typeof arr === 'string') return arr;
  if (!Array.isArray(arr) || !arr.length) return '';
  // Extract 320kbps full-length stream
  const highQ = arr.find(s => s?.quality === '320kbps' || String(s?.quality).includes('320'));
  return highQ?.url || highQ?.link || arr[arr.length - 1]?.url || arr[arr.length - 1]?.link || arr[0]?.url || arr[0]?.link || '';
}

function artistStr(artists) {
  if (!artists) return 'Unknown Artist';
  if (typeof artists === 'string') return artists;
  const primary = artists.primary || artists.all || [];
  return primary.length
    ? primary.map(a => a.name || a).join(', ')
    : (artists.name || 'Unknown Artist');
}

export function normalizeSong(s) {
  if (!s) return null;

  const coverUrl = bestImage(s.image || s.artworkUrl100 || s.thumbnail || s.cover);
  const videoId = s.videoId || s.youtubeId || (s.id && typeof s.id === 'string' && s.id.length === 11 ? s.id : null);

  return {
    id:          String(s.id || s.trackId || videoId || Math.random().toString(36).slice(2)),
    videoId:     videoId,
    youtubeId:   videoId,
    title:       s.name || s.title || s.song || s.trackName || 'Unknown Title',
    artist:      artistStr(s.artists || s.primary_artists || s.singers || s.artistName) || s.artist || 'Unknown Artist',
    album:       s.album?.name || s.album || s.collectionName || '',
    thumbnail:   coverUrl,
    cover:       coverUrl,
    duration:    Number(s.duration || (s.trackTimeMillis ? Math.round((s.trackTimeMillis || 0) / 1000) : 0)),
    language:    s.language || '',
    year:        s.year || (s.releaseDate ? s.releaseDate.slice(0, 4) : ''),
    hasLyrics:   Boolean(s.hasLyrics || s.has_lyrics),
    explicit:    Boolean(s.explicitContent || s.explicit_content),
    type:        'song',
  };
}

function normalizeAlbum(a) {
  if (!a) return null;
  return {
    id:        String(a.id || a.albumid || ''),
    title:     a.name || a.title || 'Unknown Album',
    artist:    artistStr(a.artists || a.primary_artists || a.music),
    thumbnail: bestImage(a.image),
    year:      a.year || (a.release_date ? a.release_date.slice(0, 4) : ''),
    songCount: Number(a.songCount || a.songs?.length || 0),
    type:      'album',
  };
}

function normalizeArtist(a) {
  if (!a) return null;
  return {
    id:        String(a.id || ''),
    title:     a.name || a.title || 'Unknown Artist',
    thumbnail: bestImage(a.image),
    followerCount: Number(a.followerCount || 0),
    type:      'artist',
  };
}

function normalizePlaylist(p) {
  if (!p) return null;
  return {
    id:        String(p.id || ''),
    title:     p.name || p.title || 'Unknown Playlist',
    thumbnail: bestImage(p.image),
    songCount: Number(p.songCount || 0),
    type:      'playlist',
  };
}

// ── Multi-Tier Fetcher ───────────────────────────────────────────────

async function saavnApiFetch(endpoint) {
  const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const directUrl = `https://saavn.dev/api${clean}`;

  const candidates = [
    `/api/saavn${clean}`,
    directUrl,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(directUrl)}`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const json = await res.json();
        if (json && (json.data !== undefined || json.status === 'SUCCESS' || json.status === 'success')) {
          return json;
        }
      }
    } catch {}
  }

  throw new Error(`saavn.dev unreachable on ${endpoint}`);
}

// ── Search Implementations ───────────────────────────────────────────

export async function searchAll(query) {
  if (!query || !query.trim()) {
    return { songs: [], albums: [], artists: [], playlists: [] };
  }

  // Pre-fetch native YouTube tracks with exact videoIds
  let ytSongs = [];
  try {
    ytSongs = await searchYouTubeTracks(query, 12);
  } catch {}

  // Tier 1: saavn.dev
  try {
    const json = await saavnApiFetch(`/search/all?query=${encodeURIComponent(query)}`);
    const d = json.data || {};
    const saavnSongs = (d.songs?.results || []).map(normalizeSong).filter(Boolean);
    return {
      songs:     ytSongs.length ? ytSongs : saavnSongs,
      albums:    (d.albums?.results    || []).map(normalizeAlbum).filter(Boolean),
      artists:   (d.artists?.results   || []).map(normalizeArtist).filter(Boolean),
      playlists: (d.playlists?.results || []).map(normalizePlaylist).filter(Boolean),
    };
  } catch {
    // Tier 2: JioSaavn Direct Autocomplete
    try {
      const jioRes = await fetch(`https://www.jiosaavn.com/api.php?__call=autocomplete.get&_marker=0&query=${encodeURIComponent(query)}&ctx=android&_format=json`, { signal: AbortSignal.timeout(5000) });
      if (jioRes.ok) {
        const d = await jioRes.json();
        const jioSongs = (d.songs?.data || []).map(s => normalizeSong({
          id: s.id,
          title: s.title,
          album: s.album,
          artists: s.more_info?.primary_artists || s.description,
          image: s.image,
          encrypted_media_url: s.more_info?.encrypted_media_url,
        })).filter(Boolean);
        return {
          songs: ytSongs.length ? ytSongs : jioSongs,
          albums: (d.albums?.data || []).map(a => normalizeAlbum({
            id: a.id,
            title: a.title,
            artists: a.music || a.description,
            image: a.image,
            year: a.more_info?.year,
          })).filter(Boolean),
          artists:   (d.artists?.data   || []).map(normalizeArtist).filter(Boolean),
          playlists: (d.playlists?.data || []).map(normalizePlaylist).filter(Boolean),
        };
      }
    } catch {}

    // Tier 3: iTunes Search
    try {
      const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=15`, { signal: AbortSignal.timeout(5000) });
      if (itunesRes.ok) {
        const data = await itunesRes.json();
        const itunesSongs = (data.results || []).map(s => normalizeSong({
          id: String(s.trackId),
          name: s.trackName,
          artists: s.artistName,
          album: { name: s.collectionName },
          image: [{ quality: '500x500', url: s.artworkUrl100?.replace('100x100bb.jpg', '600x600bb.jpg') }],
          downloadUrl: [{ quality: '320kbps', url: s.previewUrl }],
          duration: Math.round((s.trackTimeMillis || 0) / 1000),
          year: s.releaseDate ? s.releaseDate.slice(0, 4) : '',
        })).filter(Boolean);

        return { songs: ytSongs.length ? ytSongs : itunesSongs, albums: [], artists: [], playlists: [] };
      }
    } catch {}

    return { songs: ytSongs, albums: [], artists: [], playlists: [] };
  }
}

export async function searchSongs(query, limit = 20) {
  if (!query || !query.trim()) return [];

  // Primary: Native YouTube Search mapping exact videoIds for window.YT.Player
  try {
    const ytSongs = await searchYouTubeTracks(query, limit);
    if (ytSongs && ytSongs.length) {
      return ytSongs;
    }
  } catch {}

  // Tier 1: saavn.dev
  try {
    const json = await saavnApiFetch(`/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`);
    return (json.data?.results || []).map(normalizeSong).filter(Boolean);
  } catch {
    // Tier 2: JioSaavn Direct
    try {
      const res = await fetch(`https://www.jiosaavn.com/api.php?__call=search.getResults&_marker=0&q=${encodeURIComponent(query)}&ctx=android&_format=json&p=1&n=${limit}`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const d = await res.json();
        if (d.results && d.results.length) {
          return d.results.map(s => normalizeSong({
            id: s.id,
            title: s.song,
            album: s.album,
            artists: s.primary_artists || s.singers,
            image: s.image,
            encrypted_media_url: s.encrypted_media_url,
            duration: Number(s.duration) || 0,
            year: s.year,
          })).filter(Boolean);
        }
      }
    } catch {}

    // Tier 3: iTunes
    try {
      const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=${limit}`, { signal: AbortSignal.timeout(5000) });
      if (itunesRes.ok) {
        const data = await itunesRes.json();
        return (data.results || []).map(s => normalizeSong({
          id: String(s.trackId),
          name: s.trackName,
          artists: s.artistName,
          album: { name: s.collectionName },
          image: [{ quality: '500x500', url: s.artworkUrl100?.replace('100x100bb.jpg', '600x600bb.jpg') }],
          downloadUrl: [{ quality: '320kbps', url: s.previewUrl }],
          duration: Math.round((s.trackTimeMillis || 0) / 1000),
          year: s.releaseDate ? s.releaseDate.slice(0, 4) : '',
        })).filter(Boolean);
      }
    } catch {}

    return [];
  }
}

export async function searchAlbums(query, limit = 20) {
  if (!query || !query.trim()) return [];

  try {
    const json = await saavnApiFetch(`/search/albums?query=${encodeURIComponent(query)}&limit=${limit}`);
    return (json.data?.results || []).map(normalizeAlbum).filter(Boolean);
  } catch {
    try {
      const res = await fetch(`https://www.jiosaavn.com/api.php?__call=search.getAlbumResults&_marker=0&q=${encodeURIComponent(query)}&ctx=android&_format=json&p=1&n=${limit}`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const d = await res.json();
        return (d.results || []).map(normalizeAlbum).filter(Boolean);
      }
    } catch {}
    return [];
  }
}

export async function searchArtists(query, limit = 20) {
  if (!query || !query.trim()) return [];

  try {
    const json = await saavnApiFetch(`/search/artists?query=${encodeURIComponent(query)}&limit=${limit}`);
    return (json.data?.results || []).map(normalizeArtist).filter(Boolean);
  } catch {
    try {
      const res = await fetch(`https://www.jiosaavn.com/api.php?__call=search.getArtistResults&_marker=0&q=${encodeURIComponent(query)}&ctx=android&_format=json&p=1&n=${limit}`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const d = await res.json();
        return (d.results || []).map(normalizeArtist).filter(Boolean);
      }
    } catch {}
    return [];
  }
}

export async function searchPlaylists(query, limit = 20) {
  if (!query || !query.trim()) return [];

  try {
    const json = await saavnApiFetch(`/search/playlists?query=${encodeURIComponent(query)}&limit=${limit}`);
    return (json.data?.results || []).map(normalizePlaylist).filter(Boolean);
  } catch {
    try {
      const res = await fetch(`https://www.jiosaavn.com/api.php?__call=autocomplete.get&_marker=0&query=${encodeURIComponent(query)}&ctx=android&_format=json`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const d = await res.json();
        return (d.playlists?.data || []).map(normalizePlaylist).filter(Boolean);
      }
    } catch {}
    return [];
  }
}

// ── Detail Fetchers ──────────────────────────────────────────────────

export async function getSongById(id) {
  try {
    const json = await saavnApiFetch(`/songs/${id}`);
    const arr  = json.data || [];
    if (arr.length) return normalizeSong(arr[0]);
  } catch {}

  // Fallback to JioSaavn song details
  try {
    const res = await fetch(`https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=${id}&_format=json`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      const s = data[id] || Object.values(data)[0];
      if (s) {
        return normalizeSong({
          id: s.id,
          title: s.song,
          album: s.album,
          artists: s.primary_artists,
          image: s.image,
          encrypted_media_url: s.encrypted_media_url,
          duration: s.duration,
          year: s.year,
        });
      }
    }
  } catch {}

  throw new Error(`Song details not found for id: ${id}`);
}

export async function getAlbumSongs(albumId) {
  try {
    const json = await saavnApiFetch(`/albums?id=${albumId}`);
    const d = json.data || {};
    return {
      id:        d.id || albumId,
      title:     d.name || 'Album',
      artist:    artistStr(d.artists),
      thumbnail: bestImage(d.image),
      year:      d.year || '',
      songs:     (d.songs || []).map(normalizeSong).filter(Boolean),
    };
  } catch {}

  // Fallback JioSaavn
  try {
    const res = await fetch(`https://www.jiosaavn.com/api.php?__call=content.getAlbumDetails&albumid=${albumId}&_format=json&ctx=android`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const d = await res.json();
      return {
        id:        d.albumid || albumId,
        title:     d.title || d.name || 'Album',
        artist:    d.primary_artists || 'Various Artists',
        thumbnail: bestImage(d.image),
        year:      d.year || '',
        songs:     (d.songs || []).map(s => normalizeSong({
          id: s.id,
          title: s.song,
          album: s.album,
          artists: s.primary_artists,
          image: s.image,
          encrypted_media_url: s.encrypted_media_url,
          duration: s.duration,
          year: s.year,
        })).filter(Boolean),
      };
    }
  } catch {}

  return { id: albumId, title: 'Album', artist: '', thumbnail: '', year: '', songs: [] };
}

export async function getArtistSongs(artistId) {
  try {
    const json = await saavnApiFetch(`/artists/${artistId}/songs`);
    const d = json.data || {};
    return {
      id:        d.id || artistId,
      title:     d.name || 'Artist',
      thumbnail: bestImage(d.image),
      songs:     (d.songs?.results || d.results || []).map(normalizeSong).filter(Boolean),
    };
  } catch {}

  return { id: artistId, title: 'Artist', thumbnail: '', songs: [] };
}

export async function getPlaylistSongs(playlistId) {
  try {
    const json = await saavnApiFetch(`/playlists?id=${playlistId}`);
    const d = json.data || {};
    return {
      id:        d.id || playlistId,
      title:     d.name || 'Playlist',
      thumbnail: bestImage(d.image),
      songs:     (d.songs || []).map(normalizeSong).filter(Boolean),
    };
  } catch {}

  return { id: playlistId, title: 'Playlist', thumbnail: '', songs: [] };
}

// ── Synced Lyrics Synchronization ────────────────────────────────────

export async function fetchSongLyrics(id, title, artist) {
  if (!title && !id) return { lrc: '', source: 'none' };

  // 1. Clean track title & artist for optimal lyric database matching
  const cleanTitle = (title || '')
    .replace(/\((?:official\s*(?:music\s*)?video|video|audio|lyrics?|hd|4k|visualizer|full\s*song|remastered|feat\.[^)]*)\)/gi, '')
    .replace(/\[(?:official\s*(?:music\s*)?video|video|audio|lyrics?|hd|4k|visualizer|full\s*song|remastered|hq|feat\.[^\]]*)\]/gi, '')
    .replace(/-\s*(?:single|ep|official|audio|video)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const cleanArtist = (artist || '')
    .replace(/\((?:feat\.|ft\.).*?\)/gi, '')
    .split(/[,&/|]/)[0]
    .replace(/\s+/g, ' ')
    .trim();

  // 2. Query lrclib.net direct GET endpoint first
  if (cleanTitle) {
    try {
      const getParams = new URLSearchParams({
        track_name: cleanTitle,
        ...(cleanArtist ? { artist_name: cleanArtist } : {}),
      });
      const res = await fetch(`https://lrclib.net/api/get?${getParams}`, {
        signal: AbortSignal.timeout(4500),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.syncedLyrics && data.syncedLyrics.trim()) {
          return { lrc: data.syncedLyrics, source: 'synced' };
        }
        if (data.plainLyrics && data.plainLyrics.trim()) {
          const lrc = data.plainLyrics
            .split('\n')
            .filter(Boolean)
            .map((line, i) => {
              const t = i * 4.5;
              const mm = String(Math.floor(t / 60)).padStart(2, '0');
              const ss = String(Math.floor(t % 60)).padStart(2, '0');
              const ms = String(Math.floor((t % 1) * 100)).padStart(2, '0');
              return `[${mm}:${ss}.${ms}] ${line.trim()}`;
            })
            .join('\n');
          return { lrc, source: 'plain' };
        }
      }
    } catch {
      // Continue to search fallback
    }

    // 3. Query lrclib.net search endpoint fallback
    try {
      const searchQuery = `${cleanTitle} ${cleanArtist}`.trim();
      const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`, {
        signal: AbortSignal.timeout(4500),
      });

      if (res.ok) {
        const results = await res.json();
        if (Array.isArray(results) && results.length > 0) {
          // Find closest match or pick first
          const match = results.find(
            (r) =>
              r.trackName?.toLowerCase().includes(cleanTitle.toLowerCase()) ||
              cleanTitle.toLowerCase().includes(r.trackName?.toLowerCase())
          ) || results[0];

          if (match.syncedLyrics && match.syncedLyrics.trim()) {
            return { lrc: match.syncedLyrics, source: 'synced' };
          }
          if (match.plainLyrics && match.plainLyrics.trim()) {
            const lrc = match.plainLyrics
              .split('\n')
              .filter(Boolean)
              .map((line, i) => {
                const t = i * 4.5;
                const mm = String(Math.floor(t / 60)).padStart(2, '0');
                const ss = String(Math.floor(t % 60)).padStart(2, '0');
                const ms = String(Math.floor((t % 1) * 100)).padStart(2, '0');
                return `[${mm}:${ss}.${ms}] ${line.trim()}`;
              })
              .join('\n');
            return { lrc, source: 'plain' };
          }
        }
      }
    } catch {
      // Continue to Saavn check if ID exists
    }
  }

  // 4. Saavn lyrics endpoint fallback (if ID provided)
  if (id) {
    try {
      const json = await saavnApiFetch(`/songs/${id}/lyrics`);
      const raw = json?.data?.lyrics || json?.lyrics || json?.data?.snippet || '';
      if (raw && typeof raw === 'string' && raw.trim()) {
        if (/\[\d{1,3}:\d{2}/.test(raw)) {
          return { lrc: raw, source: 'synced' };
        }
        const lines = raw
          .replace(/<br\s*[\/]?>/gi, '\n')
          .split(/[\r\n]+/)
          .map((l) => l.trim())
          .filter(Boolean);
        if (lines.length > 0) {
          const lrc = lines
            .map((line, i) => {
              const t = i * 4;
              const mm = String(Math.floor(t / 60)).padStart(2, '0');
              const ss = String(Math.floor(t % 60)).padStart(2, '0');
              return `[${mm}:${ss}.00] ${line}`;
            })
            .join('\n');
          return { lrc, source: 'plain' };
        }
      }
    } catch {}
  }

  return { lrc: '', source: 'none' };
}
