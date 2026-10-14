/**
 * searchNormalizer.js — PRD Section 6.5 String Normalization & Studio Prioritization
 * ───────────────────────────────────────────────────────────────────────────────
 * Punctuation-normalized ranking engine with studio audio preference.
 */

/**
 * 7-step PRD Punctuation Normalization
 * @param {string} s
 * @returns {string}
 */
export function normalize(s) {
  if (!s || typeof s !== 'string') return '';
  return s
    // 1. Unicode NFKD, strip combining marks (e.g. 'Beyoncé' -> 'beyonce')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    // 2. Lowercase
    .toLowerCase()
    // 3. Replace & with 'and'
    .replace(/&/g, 'and')
    // 4. Remove apostrophes and quotes ('don\'t' -> 'dont')
    .replace(/['"`]/g, '')
    // 5. Replace all remaining punctuation with a single space
    .replace(/[^\w\s]/g, ' ')
    // 6. Collapse whitespace and trim
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes compact string with spaces removed (e.g. 'guns n roses' -> 'gunsnroses')
 * @param {string} s
 * @returns {string}
 */
export function compact(s) {
  return normalize(s).replace(/\s+/g, '');
}

/**
 * Checks if a track is a studio audio release vs a live/unofficial video upload
 * Heavily prioritizes official artist studio recordings per User Requirements.
 * @param {object} track
 * @returns {number} studio weight score (higher = higher priority studio track)
 */
export function getStudioWeight(track) {
  if (!track) return 0;
  const title = (track.title || '').toLowerCase();
  const artist = (track.artist || track.channelTitle || track.author?.name || '').toLowerCase();

  let weight = 50;

  // 1. Huge bonus for official YouTube Music " - Topic" channel tracks (licensed label audio)
  if (artist.endsWith('- topic') || artist.includes('topic')) {
    weight += 60;
  }

  // 2. Bonus for official audio / studio release markers
  if (title.includes('official audio') || title.includes('album version') || title.includes('original version')) {
    weight += 30;
  }

  // 3. Demote live recordings / concerts / bootlegs
  if (
    title.includes('live at') ||
    title.includes('live from') ||
    title.includes('(live)') ||
    title.includes('[live]') ||
    title.includes('live performance') ||
    title.includes('live in concert')
  ) {
    weight -= 35;
  }

  // 4. Demote music video uploads (dialogue in intro, lower quality audio, sound effects)
  if (
    title.includes('official music video') ||
    title.includes('official video') ||
    title.includes('[official video]') ||
    title.includes('(official video)') ||
    title.includes('music video')
  ) {
    weight -= 20;
  }

  // 5. Demote covers, parodies, reactions, karaoke
  if (
    title.includes('cover by') ||
    title.includes('parody') ||
    title.includes('reaction') ||
    title.includes('instrumental') ||
    title.includes('karaoke')
  ) {
    weight -= 40;
  }

  return weight;
}

/**
 * Computes match score against search query (PRD 6.5)
 * @param {object} track
 * @param {string} query
 * @returns {number}
 */
export function scoreTrackMatch(track, query) {
  if (!track || !query) return 0;
  const normQuery = normalize(query);
  const compQuery = compact(query);

  const normTitle = normalize(track.title || '');
  const compTitle = compact(track.title || '');

  const normArtist = normalize(track.artist || track.author?.name || '');
  const compArtist = compact(track.artist || track.author?.name || '');

  let baseScore = 0;

  // Exact normalized match (100 pts)
  if (normTitle === normQuery || normArtist === normQuery) {
    baseScore = 100;
  }
  // Normalized prefix (80 pts)
  else if (normTitle.startsWith(normQuery) || normArtist.startsWith(normQuery)) {
    baseScore = 80;
  }
  // Word-prefix match (60 pts)
  else if (normTitle.split(' ').some(w => w.startsWith(normQuery))) {
    baseScore = 60;
  }
  // Compact match (50 pts)
  else if (compTitle.includes(compQuery) || compArtist.includes(compQuery)) {
    baseScore = 50;
  }
  // Substring match (30 pts)
  else if (normTitle.includes(normQuery) || normArtist.includes(normQuery)) {
    baseScore = 30;
  }

  // Studio weight factor
  const studioScore = getStudioWeight(track);

  return baseScore + studioScore;
}

/**
 * Sorts an array of tracks prioritizing licensed studio tracks
 * @param {Array<object>} tracks
 * @param {string} [query='']
 * @returns {Array<object>}
 */
export function prioritizeStudioTracks(tracks, query = '') {
  if (!Array.isArray(tracks) || tracks.length <= 1) return tracks || [];
  return [...tracks].sort((a, b) => {
    if (query) {
      return scoreTrackMatch(b, query) - scoreTrackMatch(a, query);
    }
    return getStudioWeight(b) - getStudioWeight(a);
  });
}
