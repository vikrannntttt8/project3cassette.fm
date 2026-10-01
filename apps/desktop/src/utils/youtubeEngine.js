import { apiUrl } from './apiConfig.js';

/**
 * Dynamic YouTube Engine & Video ID Resolver
 * ─────────────────────────────────────────────────────────────────────
 * Provides dynamic YouTube search mapping and videoId resolution.
 * Completely free of static hardcoded video IDs and REST stream extraction.
 * ─────────────────────────────────────────────────────────────────────
 */

/**
 * Helper to fetch YouTube search HTML via local proxy or CORS fallbacks.
 */
async function fetchYouTubeHtml(query) {
  const encodedQuery = encodeURIComponent(query);
  const targetUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`;

  const candidates = [];

  // Relative API proxy
  candidates.push(apiUrl(`/api/yt/results?search_query=${encodedQuery}`));

  // CORS proxies as robust fallbacks
  candidates.push(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
  candidates.push(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);

  for (const url of candidates) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
      if (res.ok) {
        const text = await res.text();
        if (text && text.includes('videoId')) {
          return text;
        }
      }
    } catch {
      continue;
    }
  }

  return '';
}

/**
 * Dynamic Track Search Mapping:
 * Searches YouTube and returns active track objects:
 * { id, title, artist, cover, videoId, youtubeId, duration, type }
 *
 * @param {string} query
 * @param {number} [limit=20]
 * @returns {Promise<Array<{ id: string, title: string, artist: string, cover: string, thumbnail: string, videoId: string, youtubeId: string, duration: number, type: string }>>}
 */
export async function searchYouTubeTracks(query, limit = 20) {
  if (!query || !query.trim()) return [];

  const html = await fetchYouTubeHtml(query.trim());
  if (!html) return [];

  const songs = [];
  const seenIds = new Set();

  // Strategy 1: Parse ytInitialData JSON structure
  const jsonMatch = html.match(/var ytInitialData = ({.*?});<\/script>/s) || html.match(/ytInitialData\s*=\s*({.+?});/s);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
      for (const item of contents) {
        if (songs.length >= limit) break;
        const v = item.videoRenderer;
        if (v && v.videoId && !seenIds.has(v.videoId)) {
          seenIds.add(v.videoId);
          const title = v.title?.runs?.[0]?.text || 'Unknown Title';
          const artist = v.ownerText?.runs?.[0]?.text || v.shortBylineText?.runs?.[0]?.text || 'Unknown Artist';
          const thumbnail = v.thumbnail?.thumbnails?.slice(-1)[0]?.url || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;
          
          let duration = 0;
          const simpleText = v.lengthText?.simpleText;
          if (simpleText) {
            const parts = simpleText.split(':').map(Number);
            if (parts.length === 2) duration = parts[0] * 60 + parts[1];
            else if (parts.length === 3) duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
          }

          songs.push({
            id: v.videoId,
            videoId: v.videoId,
            youtubeId: v.videoId,
            title,
            artist,
            cover: thumbnail,
            thumbnail,
            duration,
            type: 'song',
          });
        }
      }
    } catch {
      // JSON parse failed, fall back to regex
    }
  }

  // Strategy 2: High-accuracy regex fallback
  if (songs.length < 5) {
    const videoRegex = /"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})".*?"title":\{"runs":\[\{"text":"([^"]+)"\}\].*?(?:"ownerText":\{"runs":\[\{"text":"([^"]+)"\}\]|"shortBylineText":\{"runs":\[\{"text":"([^"]+)"\}\])/g;
    let match;
    while ((match = videoRegex.exec(html)) !== null && songs.length < limit) {
      const vid = match[1];
      if (!seenIds.has(vid)) {
        seenIds.add(vid);
        const title = match[2];
        const artist = match[3] || match[4] || query;
        const thumbnail = `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
        songs.push({
          id: vid,
          videoId: vid,
          youtubeId: vid,
          title,
          artist,
          cover: thumbnail,
          thumbnail,
          duration: 0,
          type: 'song',
        });
      }
    }
  }

  // Strategy 3: Fast videoId regex fallback if still empty
  if (songs.length === 0) {
    const idRegex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
    let m;
    while ((m = idRegex.exec(html)) !== null && songs.length < limit) {
      const vid = m[1];
      if (!seenIds.has(vid)) {
        seenIds.add(vid);
        songs.push({
          id: vid,
          videoId: vid,
          youtubeId: vid,
          title: query,
          artist: 'YouTube Music',
          cover: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
          thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
          duration: 0,
          type: 'song',
        });
      }
    }
  }

  return songs;
}

/**
 * Dynamically resolves a matching YouTube video ID for a song.
 * Guaranteed: NO hardcoded defaults (never defaults to "Starboy").
 *
 * @param {string} title
 * @param {string} [artist='']
 * @returns {Promise<string | null>}
 */
export async function resolveYouTubeVideoId(title, artist = '') {
  if (!title || !title.trim()) return null;

  const cleanTitle = title.replace(/\(.*\)|\[.*\]/g, '').trim();
  const cleanArtist = (artist || '').split(/[,&]/)[0].trim();
  const fullQuery = `${cleanTitle} ${cleanArtist}`.trim();

  const html = await fetchYouTubeHtml(fullQuery);
  if (!html) return null;

  // Extract the top matching videoId
  const match1 = html.match(/"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})"/);
  if (match1 && match1[1]) return match1[1];

  const match2 = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
  if (match2 && match2[1]) return match2[1];

  return null;
}
