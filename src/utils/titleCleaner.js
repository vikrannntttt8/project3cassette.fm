/**
 * Title & Metadata Sanitizer for cassette.fm
 * Strips YouTube clutter, clickbait tags, resolution labels, and video packaging noise
 * to restore clean, Spotify/Apple Music-grade typography.
 */

// Regular expressions for common YouTube video junk
const NOISE_PATTERNS = [
  // Brackets with any combination of official/music/video/audio/4k/hd/etc.
  /\[\s*[^\]]*(?:official|music\s*video|audio|visualizer|lyric|lyrics|4k|hd|remastered|full\s*(?:video\s*)?song|live)[^\]]*\]/gi,

  // Parentheses with video noise, but strictly preserving (From "...") or (feat. ...)
  /\(\s*(?!(?:from|feat|ft\.)\b)[^)]*(?:official|music\s*video|audio|visualizer|lyric|lyrics|4k|hd|remastered|full\s*(?:video\s*)?song|live)[^)]*\)/gi,

  // Suffixes after vertical pipe "|" e.g. "| Shashwat Sachdev | 4K"
  /\s*\|.*$/g,

  // Trailing hashtags e.g. #Shorts #Trending
  /#\w+/g,
];

/**
 * Cleans a track title.
 * @param {string} rawTitle - Raw title from YouTube / InnerTube
 * @param {string} [artistName] - Optional artist name to strip "Artist - Song" or "Song - Artist" duplication
 * @returns {string} Cleaned, Spotify-grade title
 */
export function cleanTrackTitle(rawTitle, artistName = '') {
  if (!rawTitle || typeof rawTitle !== 'string') return '';

  let cleaned = rawTitle.trim();

  // 1. Strip known noise patterns
  for (const pattern of NOISE_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // 2. If artist name is known, strip "Artist - Title" or "Title - Artist"
  if (artistName && typeof artistName === 'string' && artistName.trim().length > 1) {
    const escapedArtist = artistName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(`^${escapedArtist}\\s*[-–—:]\\s*`, 'i'), '');
    cleaned = cleaned.replace(new RegExp(`\\s*[-–—:]\\s*${escapedArtist}$`, 'i'), '');
  }

  // 3. Collapse consecutive whitespaces and clean dangling hyphens/dashes
  cleaned = cleaned
    .replace(/\s{2,}/g, ' ')
    .replace(/[\s\-|–—:]+$/, '')
    .replace(/^[\s\-|–—:]+/, '')
    .trim();

  return cleaned || rawTitle;
}

/**
 * Extract clean display subtitle from YouTube Music items
 * e.g. "Song • Arijit Singh • 2024" or "Artist • 14.5M Subscribers"
 */
export function formatItemSubtitle(type, artist, album, year) {
  const parts = [];
  if (type) {
    const formattedType = type.charAt(0).toUpperCase() + type.slice(1);
    parts.push(formattedType);
  }
  if (artist) parts.push(artist);
  if (album && album !== artist) parts.push(album);
  if (year) parts.push(year);
  return parts.join(' • ');
}
