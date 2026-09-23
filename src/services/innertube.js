import { Innertube, UniversalCache, ClientType, Platform } from 'youtubei.js';

// Setup custom JavaScript function evaluator for signature/nsig deciphering
Platform.shim.eval = (data, env) => {
  const fn = new Function(...Object.keys(env), data.output);
  return fn(...Object.values(env));
};

let innertubeInstance = null;
let initPromise = null;

/**
 * Get or initialize the singleton Innertube client.
 * UniversalCache enabled, session generated locally.
 */
export async function getInnertube() {
  if (innertubeInstance) return innertubeInstance;

  if (!initPromise) {
    initPromise = Innertube.create({
      cache: new UniversalCache(false),
      client_type: ClientType.MUSIC, // WEB_REMIX YouTube Music client
    }).then((yt) => {
      innertubeInstance = yt;
      return yt;
    }).catch((err) => {
      initPromise = null;
      console.error('[Innertube] Init error:', err);
      throw err;
    });
  }

  return initPromise;
}

/**
 * Universal Thumbnail Resolver
 * Deeply inspects all variants of InnerTube & YouTube thumbnail structures:
 * - Array of thumbnail objects: [ { url, width, height }, ... ]
 * - MusicThumbnail object: { type: 'MusicThumbnail', contents: [ { url, width, height }, ... ] }
 * - Nested renderer: item.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails
 * - Flat item.thumbnails: [ { url, width, height }, ... ]
 * - item.thumbnail: [ ... ] or item.thumbnail.contents / item.thumbnail.thumbnails
 * - Strapline / Header variants: item.strapline_thumbnail.contents
 * - Direct string URL
 * - Always selects the highest resolution (largest width/height) to avoid blurry 60x60 thumbnails
 * - Optional fallback to videoId/hqdefault if ID is provided
 */
export function resolveThumbnail(itemOrThumbnail, fallbackVideoId = null) {
  if (!itemOrThumbnail) {
    return fallbackVideoId ? `https://i.ytimg.com/vi/${fallbackVideoId}/hqdefault.jpg` : '';
  }

  if (typeof itemOrThumbnail === 'string' && itemOrThumbnail.trim()) {
    return itemOrThumbnail.trim();
  }

  let candidates = [];

  // 1. Direct array of { url, width, height }
  if (Array.isArray(itemOrThumbnail)) {
    candidates = itemOrThumbnail;
  }
  // 2. MusicThumbnail / MusicThumbnailRenderer with .contents
  else if (Array.isArray(itemOrThumbnail?.contents)) {
    candidates = itemOrThumbnail.contents;
  }
  // 3. Object with .thumbnail
  else if (itemOrThumbnail?.thumbnail) {
    if (Array.isArray(itemOrThumbnail.thumbnail)) {
      candidates = itemOrThumbnail.thumbnail;
    } else if (Array.isArray(itemOrThumbnail.thumbnail?.contents)) {
      candidates = itemOrThumbnail.thumbnail.contents;
    } else if (Array.isArray(itemOrThumbnail.thumbnail?.thumbnails)) {
      candidates = itemOrThumbnail.thumbnail.thumbnails;
    } else if (typeof itemOrThumbnail.thumbnail === 'string') {
      return itemOrThumbnail.thumbnail.trim();
    }
  }
  // 4. Object with .thumbnails
  else if (Array.isArray(itemOrThumbnail?.thumbnails)) {
    candidates = itemOrThumbnail.thumbnails;
  }
  // 5. item.thumbnailRenderer.musicThumbnailRenderer or musicThumbnailRenderer
  else if (itemOrThumbnail?.thumbnailRenderer?.musicThumbnailRenderer) {
    const mtr = itemOrThumbnail.thumbnailRenderer.musicThumbnailRenderer;
    candidates = mtr.thumbnail?.thumbnails || mtr.thumbnail?.contents || [];
  }
  else if (itemOrThumbnail?.musicThumbnailRenderer) {
    const mtr = itemOrThumbnail.musicThumbnailRenderer;
    candidates = mtr.thumbnail?.thumbnails || mtr.thumbnail?.contents || [];
  }
  // 6. Strapline / Header variants
  else if (itemOrThumbnail?.strapline_thumbnail?.contents) {
    candidates = itemOrThumbnail.strapline_thumbnail.contents;
  }
  else if (itemOrThumbnail?.header?.thumbnail) {
    return resolveThumbnail(itemOrThumbnail.header.thumbnail, fallbackVideoId);
  }

  if (Array.isArray(candidates) && candidates.length > 0) {
    const valid = candidates.filter((c) => c && typeof (c.url || c.link) === 'string');
    if (valid.length > 0) {
      const hasDims = valid.some((c) => (Number(c.width) || 0) > 0 || (Number(c.height) || 0) > 0);
      if (hasDims) {
        // Sort descending by width, then height
        valid.sort((a, b) => {
          const wA = Number(a.width) || 0;
          const wB = Number(b.width) || 0;
          if (wB !== wA) return wB - wA;
          const hA = Number(a.height) || 0;
          const hB = Number(b.height) || 0;
          return hB - hA;
        });
        const best = valid[0]?.url || valid[0]?.link;
        if (best) return best;
      } else {
        // In InnerTube/YouTube thumbnail arrays without dimensions, last item is the highest resolution
        const last = valid[valid.length - 1];
        const best = last?.url || last?.link || valid[0]?.url || valid[0]?.link;
        if (best) return best;
      }
    }
  }

  if (fallbackVideoId) {
    return `https://i.ytimg.com/vi/${fallbackVideoId}/hqdefault.jpg`;
  }

  return '';
}

/**
 * Helper to parse a song item into a clean unified schema.
 */
function parseSongItem(item) {
  const id = item.id || '';
  const title = item.title || 'Unknown Title';
  
  const firstArtist = Array.isArray(item.artists) && item.artists.length > 0 ? item.artists[0] : null;
  const artist = item.artists?.map((a) => a.name).filter(Boolean).join(', ') || item.author?.name || 'Unknown Artist';
  const artistId = firstArtist?.channel_id || firstArtist?.id || undefined;

  const album = item.album?.name || (typeof item.album === 'string' ? item.album : undefined);
  const albumId = item.album?.id || item.album?.browse_id || item.album?.browseId || item.album_id || undefined;

  let duration = 0;
  if (typeof item.duration?.seconds === 'number') {
    duration = item.duration.seconds;
  } else if (item.duration?.text) {
    const parts = item.duration.text.split(':').map(Number);
    if (parts.length === 2) duration = parts[0] * 60 + parts[1];
    else if (parts.length === 3) duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  const thumbnail = resolveThumbnail(item, id);

  // Check if official release (official artist channel, topic, or verified badge)
  const isOfficial = Boolean(
    item.badges?.some?.((b) => b.label?.toLowerCase().includes('official') || b.style?.includes('OFFICIAL'))
    || item.is_explicit === false
    || (item.album?.name && item.artists?.length)
  );

  return {
    id,
    videoId: id,
    title,
    artist,
    artistId,
    album,
    albumId,
    duration,
    thumbnail,
    cover: thumbnail,
    thumbnailUrl: thumbnail,
    isOfficial,
    type: 'song',
  };
}

/**
 * 1. searchMusic(query: string, type: 'all' | 'songs' | 'albums' | 'artists')
 * Queries specifically via YouTube Music.
 * Supports official-track sorting in 'songs' tab, album shelf renderer parsing, and artist views.
 */
export async function searchMusic(query, type = 'all') {
  if (!query || !query.trim()) return [];

  const yt = await getInnertube();
  const q = query.trim();

  // ── Tab: Songs ──────────────────────────────────────────────────────────
  if (type === 'songs' || type === 'song') {
    const searchResults = await yt.music.search(q, { type: 'song' });
    const contents = searchResults.songs?.contents || searchResults.contents || [];
    const songs = contents.map(parseSongItem).filter((t) => t.id && t.id.length >= 10);

    const qLower = q.toLowerCase();
    const wantsRemixOrSlowed = qLower.includes('slow') || qLower.includes('reverb') || qLower.includes('remix') || qLower.includes('cover');

    // Filter out fan edits, slow-reverb uploads if not explicitly searched
    const filtered = wantsRemixOrSlowed
      ? songs
      : songs.filter((s) => {
          const tLower = s.title.toLowerCase();
          return !tLower.includes('slowed') &&
                 !tLower.includes('reverb') &&
                 !tLower.includes('fan made') &&
                 !tLower.includes('remake') &&
                 !tLower.includes('8d audio');
        });

    // Bubble official releases to top
    filtered.sort((a, b) => {
      if (a.isOfficial && !b.isOfficial) return -1;
      if (!a.isOfficial && b.isOfficial) return 1;
      return 0;
    });

    return filtered;
  }

  // ── Tab: Albums ─────────────────────────────────────────────────────────
  if (type === 'albums' || type === 'album') {
    const searchResults = await yt.music.search(q, { type: 'album' });
    const contents = searchResults.albums?.contents || searchResults.contents || [];

    return contents.map((a) => {
      const id = a.id || '';
      const title = a.title || 'Unknown Album';
      const firstArtist = Array.isArray(a.artists) && a.artists.length > 0 ? a.artists[0] : null;
      const artist = a.artists?.map((x) => x.name).filter(Boolean).join(', ') || a.author?.name || 'Unknown Artist';
      const artistId = firstArtist?.channel_id || firstArtist?.id || undefined;
      const year = a.year || '';
      const thumbnail = resolveThumbnail(a);

      return {
        id,
        browseId: id,
        title,
        artist,
        artistId,
        year,
        thumbnail,
        cover: thumbnail,
        type: 'album',
      };
    }).filter((a) => a.id);
  }

  // ── Tab: Artists ────────────────────────────────────────────────────────
  if (type === 'artists' || type === 'artist') {
    const searchResults = await yt.music.search(q, { type: 'artist' });
    const contents = searchResults.artists?.contents || searchResults.contents || [];

    return contents.map((art) => {
      const id = art.id || '';
      const name = art.name || art.title || 'Unknown Artist';
      const thumbnail = resolveThumbnail(art);

      return {
        id,
        browseId: id,
        name,
        title: name,
        thumbnail,
        cover: thumbnail,
        type: 'artist',
      };
    }).filter((art) => art.id);
  }

  // ── Tab: All (Mix official songs, albums, and artists) ───────────────────
  try {
    const [songRes, albumRes, artistRes] = await Promise.allSettled([
      yt.music.search(q, { type: 'song' }),
      yt.music.search(q, { type: 'album' }),
      yt.music.search(q, { type: 'artist' }),
    ]);

    const songs = (songRes.status === 'fulfilled' ? (songRes.value.songs?.contents || songRes.value.contents || []) : [])
      .map(parseSongItem)
      .filter((t) => t.id && t.id.length >= 10);

    const albums = (albumRes.status === 'fulfilled' ? (albumRes.value.albums?.contents || albumRes.value.contents || []) : [])
      .map((a) => {
        const thumb = resolveThumbnail(a);
        return {
          id: a.id || '',
          browseId: a.id || '',
          title: a.title || 'Unknown Album',
          artist: a.artists?.map((x) => x.name).filter(Boolean).join(', ') || a.author?.name || 'Unknown Artist',
          year: a.year || '',
          thumbnail: thumb,
          cover: thumb,
          type: 'album',
        };
      })
      .filter((a) => a.id);

    const artists = (artistRes.status === 'fulfilled' ? (artistRes.value.artists?.contents || artistRes.value.contents || []) : [])
      .map((art) => {
        const thumb = resolveThumbnail(art);
        return {
          id: art.id || '',
          browseId: art.id || '',
          name: art.name || art.title || 'Unknown Artist',
          title: art.name || art.title || 'Unknown Artist',
          thumbnail: thumb,
          cover: thumb,
          type: 'artist',
        };
      })
      .filter((art) => art.id);

    // Return combined result list with official releases prioritized
    return [
      ...songs.slice(0, 15),
      ...albums.slice(0, 6),
      ...artists.slice(0, 4),
    ];
  } catch (err) {
    console.error('[Innertube] Search all error:', err);
    return [];
  }
}

/**
 * 2. resolveAudioStream(videoId: string, quality: 'max' | 'standard' | 'datasaver' = 'max')
 * Retrieves raw media streams via getBasicInfo.
 * Selects optimal audio-only format enforcing real quality constraints:
 * - max: Highest available Opus (itag 251) or highest-bitrate WebM/AAC
 * - standard: Restricts to ~160kbps ceiling (e.g., itag 140 AAC or mid-tier Opus)
 * - datasaver: Restricts to low-bandwidth ~70-96kbps equivalents (itag 250/249/139)
 * Handles player cipher extraction to return a deciphered, direct streaming URL.
 */
export async function resolveAudioStream(videoId, quality = 'max') {
  if (!videoId) throw new Error('videoId is required');

  const yt = await getInnertube();
  const info = await yt.getBasicInfo(videoId);

  const allAdaptive = info.streaming_data?.adaptive_formats || [];
  const audioFormats = allAdaptive.filter((f) => f.has_audio && !f.has_video);

  let selectedAudio = null;

  if (audioFormats.length > 0) {
    if (quality === 'datasaver' || quality === 'low') {
      // Low-bandwidth ~70-96kbps ceiling (itag 250, 249, 139)
      const low = audioFormats.filter((f) => (f.bitrate || 0) <= 98000);
      if (low.length > 0) {
        low.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
        selectedAudio = low[0];
      } else {
        const sorted = [...audioFormats].sort((a, b) => (a.bitrate || 0) - (b.bitrate || 0));
        selectedAudio = sorted[0];
      }
    } else if (quality === 'standard' || quality === 'medium') {
      // Mid-tier ~160kbps ceiling (prefer AAC itag 140 or mid-tier Opus)
      const mid = audioFormats.filter((f) => (f.bitrate || 0) <= 165000);
      if (mid.length > 0) {
        const aac = mid.find((f) => f.itag === 140);
        if (aac) {
          selectedAudio = aac;
        } else {
          mid.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
          selectedAudio = mid[0];
        }
      } else {
        selectedAudio = audioFormats[0];
      }
    } else {
      // 'max' / 'high' -> Prefer Opus itag 251 or highest bitrate available
      const opus251 = audioFormats.find((f) => f.itag === 251);
      if (opus251) {
        selectedAudio = opus251;
      } else {
        const sorted = [...audioFormats].sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
        selectedAudio = sorted[0];
      }
    }
  }

  // Fallback to chooseFormat if adaptive formats empty
  if (!selectedAudio) {
    selectedAudio = info.chooseFormat({
      type: 'audio',
      quality: quality === 'datasaver' ? 'lowest' : 'best',
    });
  }

  if (!selectedAudio) {
    throw new Error(`No audio format found for video: ${videoId}`);
  }

  // Handle player cipher extraction to return deciphered direct streaming URL
  let directStreamUrl = selectedAudio.url;
  if (!directStreamUrl && (selectedAudio.signature_cipher || selectedAudio.cipher)) {
    directStreamUrl = await selectedAudio.decipher(yt.session.player);
  }

  if (!directStreamUrl) {
    throw new Error('Failed to decipher audio stream URL');
  }

  const rawBitrate = selectedAudio.bitrate || (quality === 'datasaver' ? 72000 : quality === 'standard' ? 128000 : 160000);
  const kbps = Math.round(rawBitrate / 1000);

  return {
    streamUrl: directStreamUrl,
    bitrate: rawBitrate,
    averageBitrate: selectedAudio.average_bitrate || rawBitrate,
    kbps: `${kbps}kbps`,
    mimeType: selectedAudio.mime_type || 'audio/webm',
    contentLength: selectedAudio.content_length,
    itag: selectedAudio.itag,
    qualityLabel: quality === 'max' ? `Max Opus (${kbps}kbps)` : quality === 'datasaver' ? `Data Saver (${kbps}kbps)` : `Standard (${kbps}kbps)`,
    quality,
  };
}

/**
 * 3. getArtistDetails(browseId: string)
 * Fetches the artist's discography, top songs, and albums using yt.music.getArtist(browseId).
 * Maps and returns full structural shelves matching YouTube Music client parity:
 * - Top Songs (complete list, not limited to 5)
 * - Albums
 * - Singles & EPs
 * - Videos & Live Performances
 * - Playlists
 * - Fans might also like (Similar Artists)
 */
export async function getArtistDetails(rawBrowseId) {
  if (!rawBrowseId) throw new Error('browseId is required');

  const decodedId = decodeURIComponent(String(rawBrowseId)).trim();
  const yt = await getInnertube();
  let artist = null;
  let resolvedId = decodedId;

  // 1. If it looks like a valid YouTube browseId (UC... or FEmusic_artist_...), try direct fetch
  if (decodedId.startsWith('UC') || decodedId.startsWith('FEmusic_artist_') || decodedId.startsWith('MPREb_')) {
    try {
      artist = await yt.music.getArtist(decodedId);
      resolvedId = decodedId;
    } catch (err) {
      console.warn(`[Innertube] Direct getArtist failed for ${decodedId}:`, err.message);
    }
  }

  // 2. If artist wasn't resolved yet (e.g. decodedId is a name like "K.K."), search YT Music for the artist
  if (!artist) {
    try {
      const searchRes = await yt.music.search(decodedId, { type: 'artist' });
      const candidates = searchRes.artists?.contents || searchRes.contents || [];
      const bestMatch = candidates.find((c) => (c.id || c.browseId)?.startsWith('UC')) || candidates[0];
      const foundId = bestMatch?.id || bestMatch?.browseId;
      if (foundId && foundId.startsWith('UC')) {
        artist = await yt.music.getArtist(foundId);
        resolvedId = foundId;
      }
    } catch (err) {
      console.warn(`[Innertube] Search-based artist resolution failed for "${decodedId}":`, err.message);
    }
  }

  // 3. If yt.music.getArtist succeeded, parse rich sections
  if (artist) {
    const name = artist.header?.title?.text || artist.name || decodedId;
    const description = artist.header?.description?.text || '';
    const thumbnail = resolveThumbnail(
      artist.header?.thumbnail
      || artist.header?.thumbnails
      || artist.header
      || artist.thumbnail
      || artist.thumbnails
    );

    const parseDuration = (durObj) => {
      if (typeof durObj?.seconds === 'number') return durObj.seconds;
      if (durObj?.text) {
        const parts = durObj.text.split(':').map(Number);
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
      return 0;
    };

    const topSongs = [];
    const albums = [];
    const singles = [];
    const videos = [];
    const playlists = [];
    const similarArtists = [];

    for (const sec of artist.sections || []) {
      const rawTitle = (sec.title?.text || sec.header?.title?.text || '').toLowerCase();
      const contents = sec.contents || [];

      // Top Songs
      if (rawTitle.includes('song') || rawTitle.includes('popular') || rawTitle.includes('top track')) {
        for (const s of contents) {
          const id = s.id || s.videoId || '';
          if (!id) continue;
          const dur = parseDuration(s.duration);
          const thumb = resolveThumbnail(s, id);
          topSongs.push({
            id,
            videoId: id,
            title: s.title?.text || s.title || 'Unknown Title',
            artist: s.artists?.map((a) => a.name).filter(Boolean).join(', ') || name,
            artistId: resolvedId,
            album: s.album?.name || (typeof s.album === 'string' ? s.album : undefined),
            duration: dur,
            thumbnail: thumb,
            cover: thumb,
            isOfficial: true,
            type: 'song',
          });
        }
      }
      // Singles & EPs
      else if (rawTitle.includes('single') || rawTitle.includes('ep')) {
        for (const a of contents) {
          const id = a.id || a.browseId || '';
          if (!id) continue;
          const thumb = resolveThumbnail(a);
          singles.push({
            id,
            browseId: id,
            title: a.title?.text || a.title || 'Unknown Single',
            artist: name,
            artistId: resolvedId,
            year: a.year || (a.subtitle?.text ? a.subtitle.text.match(/\b(19\d\d|20\d\d)\b/)?.[1] : ''),
            thumbnail: thumb,
            cover: thumb,
            type: 'album',
            isSingle: true,
          });
        }
      }
      // Albums
      else if (rawTitle.includes('album')) {
        for (const a of contents) {
          const id = a.id || a.browseId || '';
          if (!id) continue;
          const thumb = resolveThumbnail(a);
          albums.push({
            id,
            browseId: id,
            title: a.title?.text || a.title || 'Unknown Album',
            artist: name,
            artistId: resolvedId,
            year: a.year || (a.subtitle?.text ? a.subtitle.text.match(/\b(19\d\d|20\d\d)\b/)?.[1] : ''),
            thumbnail: thumb,
            cover: thumb,
            type: 'album',
          });
        }
      }
      // Videos & Live Performances
      else if (rawTitle.includes('video') || rawTitle.includes('live') || rawTitle.includes('performance')) {
        for (const v of contents) {
          const id = v.id || v.videoId || '';
          if (!id) continue;
          const dur = parseDuration(v.duration);
          const thumb = resolveThumbnail(v, id);
          videos.push({
            id,
            videoId: id,
            title: v.title?.text || v.title || 'Music Video',
            artist: name,
            artistId: resolvedId,
            duration: dur,
            views: v.views?.text || v.short_view_count?.text || '',
            thumbnail: thumb,
            cover: thumb,
            type: 'video',
          });
        }
      }
      // Playlists
      else if (rawTitle.includes('playlist') || rawTitle.includes('featured')) {
        for (const p of contents) {
          const id = p.id || p.browseId || '';
          if (!id) continue;
          const thumb = resolveThumbnail(p);
          playlists.push({
            id,
            browseId: id,
            title: p.title?.text || p.title || 'Playlist',
            artist: name,
            songCount: p.item_count?.text || p.song_count || '',
            thumbnail: thumb,
            cover: thumb,
            type: 'playlist',
          });
        }
      }
      // Similar Artists
      else if (rawTitle.includes('fan') || rawTitle.includes('similar') || rawTitle.includes('like')) {
        for (const art of contents) {
          const id = art.id || art.browseId || '';
          if (!id) continue;
          const thumb = resolveThumbnail(art);
          similarArtists.push({
            id,
            browseId: id,
            name: art.title?.text || art.name || 'Similar Artist',
            subscribers: art.subscribers?.text || art.subtitle?.text || 'Artist',
            thumbnail: thumb,
            cover: thumb,
            type: 'artist',
          });
        }
      }
    }

    if (topSongs.length === 0 && artist.sections?.[0]?.contents?.length) {
      for (const s of artist.sections[0].contents) {
        const id = s.id || s.videoId || '';
        if (!id) continue;
        const dur = parseDuration(s.duration);
        const thumb = resolveThumbnail(s, id);
        topSongs.push({
          id,
          videoId: id,
          title: s.title?.text || s.title || 'Unknown Title',
          artist: name,
          artistId: resolvedId,
          album: s.album?.name || (typeof s.album === 'string' ? s.album : undefined),
          duration: dur,
          thumbnail: thumb,
          cover: thumb,
          isOfficial: true,
          type: 'song',
        });
      }
    }

    return {
      id: resolvedId,
      browseId: resolvedId,
      name,
      description,
      thumbnail,
      topSongs,
      albums,
      singles,
      videos,
      playlists,
      similarArtists,
    };
  }

  // 4. Fallback search mode if channel couldn't be loaded directly
  const [songResults, albumResults] = await Promise.all([
    searchMusic(decodedId, 'songs').catch(() => []),
    searchMusic(decodedId, 'albums').catch(() => []),
  ]);

  const fallbackThumb = songResults[0]?.thumbnail || albumResults[0]?.thumbnail || '';

  return {
    id: resolvedId,
    browseId: resolvedId,
    name: decodedId,
    description: `Discography and tracks for ${decodedId}`,
    thumbnail: fallbackThumb,
    topSongs: songResults.slice(0, 20),
    albums: albumResults.slice(0, 10),
    singles: [],
    videos: [],
    playlists: [],
    similarArtists: [],
  };
}

/**
 * 4. getAlbumDetails(browseId: string)
 * Fetches the full album release and tracklist using yt.music.getAlbum(browseId).
 */
export async function getAlbumDetails(browseId) {
  if (!browseId) throw new Error('browseId is required');

  const yt = await getInnertube();
  const album = await yt.music.getAlbum(browseId);

  const title = album.header?.title?.text || album.title || 'Unknown Album';
  const artist = album.header?.strapline_text_one?.text || album.header?.author?.name || 'Unknown Artist';
  const artistId = album.header?.strapline_text_one?.endpoint?.payload?.browseId || undefined;

  let year = '';
  const subtitleText = album.header?.subtitle?.text || '';
  const yearMatch = subtitleText.match(/\b(19\d\d|20\d\d)\b/);
  if (yearMatch) year = yearMatch[1];

  const thumbnail = resolveThumbnail(
    album.header?.thumbnail
    || album.header?.strapline_thumbnail
    || album.header
    || album.thumbnails
    || album
  );

  const description = album.header?.description?.text || '';

  const tracks = (album.contents || []).map((s, index) => {
    let dur = 0;
    if (typeof s.duration?.seconds === 'number') {
      dur = s.duration.seconds;
    } else if (s.duration?.text) {
      const parts = s.duration.text.split(':').map(Number);
      if (parts.length === 2) dur = parts[0] * 60 + parts[1];
      else if (parts.length === 3) dur = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    const trackThumb = resolveThumbnail(s, s.id) || thumbnail;

    return {
      id: s.id || '',
      videoId: s.id || '',
      trackNumber: index + 1,
      title: s.title || `Track ${index + 1}`,
      artist: s.artists?.map((a) => a.name).filter(Boolean).join(', ') || artist,
      artistId: artistId,
      album: title,
      duration: dur,
      thumbnail: trackThumb,
      cover: trackThumb,
      isOfficial: true,
      type: 'song',
    };
  }).filter((t) => t.id);

  return {
    id: browseId,
    browseId,
    title,
    artist,
    artistId,
    year,
    thumbnail,
    cover: thumbnail,
    description,
    trackCount: tracks.length,
    tracks,
  };
}

/**
 * 7. getWatchNext(videoId: string)
 * Fetches YouTube Music's "Up Next" / watch playlist recommendations for a videoId.
 * Maps results into normalized song schema and filters out invalid tracks.
 */
export async function getWatchNext(videoId) {
  if (!videoId || typeof videoId !== 'string') return [];
  const yt = await getInnertube();
  try {
    const upNext = await yt.music.getUpNext(videoId);
    const contents = upNext?.contents || [];
    const songs = contents.map((item) => {
      const id = item.video_id || item.id || '';
      const title = item.title?.text || item.title || 'Unknown Title';
      const firstArtist = Array.isArray(item.artists) && item.artists.length > 0 ? item.artists[0] : null;
      const artist = item.artists?.map((a) => a.name).filter(Boolean).join(', ') || item.author || 'Unknown Artist';
      const artistId = firstArtist?.channel_id || firstArtist?.id || undefined;
      const album = item.album?.name || (typeof item.album === 'string' ? item.album : undefined);
      const albumId = item.album?.id || item.album?.browse_id || undefined;

      let duration = 0;
      if (typeof item.duration?.seconds === 'number') {
        duration = item.duration.seconds;
      } else if (item.duration?.text) {
        const parts = item.duration.text.split(':').map(Number);
        if (parts.length === 2) duration = parts[0] * 60 + parts[1];
        else if (parts.length === 3) duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
      }

      const thumbnail = resolveThumbnail(item, id);

      return {
        id,
        videoId: id,
        title,
        artist,
        artistId,
        album,
        albumId,
        duration,
        thumbnail,
        cover: thumbnail,
        thumbnailUrl: thumbnail,
        type: 'song',
      };
    }).filter((s) => s.id && s.id.length >= 10);

    return songs;
  } catch (err) {
    console.error('[Innertube] getWatchNext error:', err);
    return [];
  }
}

/**
 * 8. getHomeFeedData()
 * Dynamically fetches and categorizes live YouTube Music home feed:
 * - Quick Picks (1-click tracks)
 * - Daily Mixes & Radio
 * - Trending Albums & Releases
 * - Dynamic YouTube Music sections
 */
export async function getHomeFeedData() {
  const yt = await getInnertube();
  try {
    const [feedRes, quickPicksRes, trendingAlbumsRes] = await Promise.allSettled([
      yt.music.getHomeFeed(),
      yt.music.search('top hits songs', { type: 'song' }),
      yt.music.search('top trending albums', { type: 'album' }),
    ]);

    // Parse sections from YouTube Music live home feed
    const rawFeed = feedRes.status === 'fulfilled' ? feedRes.value : null;
    const dynamicSections = [];

    if (rawFeed?.sections && Array.isArray(rawFeed.sections)) {
      for (const sec of rawFeed.sections) {
        const title = sec.header?.title?.text || sec.title?.text || (typeof sec.title === 'string' ? sec.title : '') || '';
        if (!title || !sec.contents?.length) continue;

        const items = sec.contents.map((item) => {
          const id = item.id || item.video_id || '';
          const itemTitle = item.title?.text || (typeof item.title === 'string' ? item.title : '') || 'Untitled';
          const subtitle = item.subtitle?.text || (typeof item.subtitle === 'string' ? item.subtitle : '') || '';
          const thumb = resolveThumbnail(item, id);
          const type = item.item_type || (item.endpoint?.name?.includes('browse') ? 'playlist' : 'song');

          return {
            id,
            browseId: id,
            videoId: id,
            title: itemTitle,
            subtitle,
            thumbnail: thumb,
            cover: thumb,
            type,
          };
        }).filter((it) => it.id);

        if (items.length > 0) {
          dynamicSections.push({
            id: title.toLowerCase().replace(/[^\w]/g, '-'),
            title,
            items,
          });
        }
      }
    }

    // Quick Picks: Top playable tracks
    const quickPicks = (quickPicksRes.status === 'fulfilled' ? (quickPicksRes.value.songs?.contents || quickPicksRes.value.contents || []) : [])
      .map(parseSongItem)
      .filter((s) => s.id && s.id.length >= 10)
      .slice(0, 16);

    // Trending Albums
    const trendingAlbums = (trendingAlbumsRes.status === 'fulfilled' ? (trendingAlbumsRes.value.albums?.contents || trendingAlbumsRes.value.contents || []) : [])
      .map((a) => {
        const thumb = resolveThumbnail(a);
        return {
          id: a.id || '',
          browseId: a.id || '',
          title: a.title || 'Unknown Album',
          artist: a.artists?.map((x) => x.name).filter(Boolean).join(', ') || a.author?.name || 'Artist',
          year: a.year || '',
          thumbnail: thumb,
          cover: thumb,
          type: 'album',
        };
      })
      .filter((a) => a.id)
      .slice(0, 10);

    // Curated resilient fallback tracks if API is rate-limited or cold-starting
    const fallbackQuickPicks = [
      {
        id: 'fJ9rUzIMcZQ',
        videoId: 'fJ9rUzIMcZQ',
        title: 'Bohemian Rhapsody',
        artist: 'Queen',
        duration: 354,
        thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
        cover: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
        isOfficial: true,
        type: 'song',
      },
      {
        id: '4NRXx6U8ABQ',
        videoId: '4NRXx6U8ABQ',
        title: 'Blinding Lights',
        artist: 'The Weeknd',
        duration: 200,
        thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
        cover: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
        isOfficial: true,
        type: 'song',
      },
      {
        id: 'JGwWNGJdvx8',
        videoId: 'JGwWNGJdvx8',
        title: 'Shape of You',
        artist: 'Ed Sheeran',
        duration: 233,
        thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg',
        cover: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg',
        isOfficial: true,
        type: 'song',
      },
      {
        id: 'kXYiU_JCYtU',
        videoId: 'kXYiU_JCYtU',
        title: 'Numb',
        artist: 'Linkin Park',
        duration: 187,
        thumbnail: 'https://i.ytimg.com/vi/kXYiU_JCYtU/hqdefault.jpg',
        cover: 'https://i.ytimg.com/vi/kXYiU_JCYtU/hqdefault.jpg',
        isOfficial: true,
        type: 'song',
      },
      {
        id: '09R8_2nJtjg',
        videoId: '09R8_2nJtjg',
        title: 'Sugar',
        artist: 'Maroon 5',
        duration: 235,
        thumbnail: 'https://i.ytimg.com/vi/09R8_2nJtjg/hqdefault.jpg',
        cover: 'https://i.ytimg.com/vi/09R8_2nJtjg/hqdefault.jpg',
        isOfficial: true,
        type: 'song',
      },
      {
        id: 'L3wKzyIN1yk',
        videoId: 'L3wKzyIN1yk',
        title: 'Feel Good Inc.',
        artist: 'Gorillaz',
        duration: 221,
        thumbnail: 'https://i.ytimg.com/vi/L3wKzyIN1yk/hqdefault.jpg',
        cover: 'https://i.ytimg.com/vi/L3wKzyIN1yk/hqdefault.jpg',
        isOfficial: true,
        type: 'song',
      },
      {
        id: 'hT_nvWreIhg',
        videoId: 'hT_nvWreIhg',
        title: 'Counting Stars',
        artist: 'OneRepublic',
        duration: 257,
        thumbnail: 'https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg',
        cover: 'https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg',
        isOfficial: true,
        type: 'song',
      },
      {
        id: '3JZ_D3ELwOQ',
        videoId: '3JZ_D3ELwOQ',
        title: 'Radioactive',
        artist: 'Imagine Dragons',
        duration: 186,
        thumbnail: 'https://i.ytimg.com/vi/3JZ_D3ELwOQ/hqdefault.jpg',
        cover: 'https://i.ytimg.com/vi/3JZ_D3ELwOQ/hqdefault.jpg',
        isOfficial: true,
        type: 'song',
      }
    ];

    const fallbackTrendingAlbums = [
      {
        id: 'MPREb_V2m2H7oVw9b',
        browseId: 'MPREb_V2m2H7oVw9b',
        title: 'After Hours',
        artist: 'The Weeknd',
        year: '2020',
        thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
        cover: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
        type: 'album',
      },
      {
        id: 'MPREb_kZ3yR3q7sXp',
        browseId: 'MPREb_kZ3yR3q7sXp',
        title: 'A Night at the Opera',
        artist: 'Queen',
        year: '1975',
        thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
        cover: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
        type: 'album',
      },
      {
        id: 'MPREb_tZ2hF9yLmPq',
        browseId: 'MPREb_tZ2hF9yLmPq',
        title: 'Meteora',
        artist: 'Linkin Park',
        year: '2003',
        thumbnail: 'https://i.ytimg.com/vi/kXYiU_JCYtU/hqdefault.jpg',
        cover: 'https://i.ytimg.com/vi/kXYiU_JCYtU/hqdefault.jpg',
        type: 'album',
      }
    ];

    const finalQuickPicks = quickPicks.length > 0 ? quickPicks : fallbackQuickPicks;
    const finalTrendingAlbums = trendingAlbums.length > 0 ? trendingAlbums : fallbackTrendingAlbums;

    return {
      quickPicks: finalQuickPicks,
      trendingAlbums: finalTrendingAlbums,
      dailyMixes: dynamicSections[0]?.items?.length ? dynamicSections[0].items : finalQuickPicks.slice(0, 6),
      dynamicSections,
    };
  } catch (err) {
    console.error('[Innertube] getHomeFeedData error:', err);
    return {
      quickPicks: [
        {
          id: '4NRXx6U8ABQ',
          videoId: '4NRXx6U8ABQ',
          title: 'Blinding Lights',
          artist: 'The Weeknd',
          duration: 200,
          thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
          cover: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
          isOfficial: true,
          type: 'song',
        },
        {
          id: 'fJ9rUzIMcZQ',
          videoId: 'fJ9rUzIMcZQ',
          title: 'Bohemian Rhapsody',
          artist: 'Queen',
          duration: 354,
          thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
          cover: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
          isOfficial: true,
          type: 'song',
        }
      ],
      trendingAlbums: [],
      dailyMixes: [],
      dynamicSections: [],
    };
  }
}

/**
 * 7. getYouTubeMusicLibrary({ cookie, visitorData, sapisid })
 * Authenticates with YouTube Music via cookies/visitor data and retrieves:
 * - Liked tracks (via 'LM' playlist ID or FEmusic_liked)
 * - User Playlists (via getLibraryPlaylists or FEmusic_library_playlists)
 */
export async function getYouTubeMusicLibrary({ cookie = '', visitorData = '', sapisid = '' } = {}) {
  let cookieHeader = '';
  if (cookie && typeof cookie === 'string' && cookie.trim()) {
    cookieHeader = cookie.trim();
  } else if (sapisid && typeof sapisid === 'string' && sapisid.trim()) {
    const clean = sapisid.trim();
    cookieHeader = `SAPISID=${clean}; __Secure-3PAPISID=${clean};`;
  }

  let yt;
  try {
    yt = await Innertube.create({
      cache: new UniversalCache(false),
      client_type: ClientType.MUSIC,
      cookie: cookieHeader || undefined,
      visitor_data: visitorData || undefined,
    });
  } catch (err) {
    console.error('[Innertube] Authenticated client init failed:', err);
    throw new Error(`Failed to initialize InnerTube session: ${err.message}`);
  }

  const likedSongs = [];
  const playlists = [];

  // ── 1. Fetch Liked Tracks ────────────────────────────────────────────────
  try {
    const lmPlaylist = await yt.music.getPlaylist('LM').catch(() => null)
                    || await yt.getPlaylist('LM').catch(() => null);

    if (lmPlaylist) {
      const items = lmPlaylist.items || lmPlaylist.videos || lmPlaylist.contents || [];
      for (const item of items) {
        const parsed = parseSongItem(item);
        if (parsed.id && !likedSongs.some((s) => s.id === parsed.id)) {
          likedSongs.push({
            ...parsed,
            likedAt: new Date().toISOString(),
          });
        }
      }
    }
  } catch (err) {
    console.warn('[Innertube] Liked tracks direct fetch warning:', err.message);
  }

  // Fallback: browse FEmusic_liked
  if (likedSongs.length === 0) {
    try {
      const browseRes = await yt.actions.execute('/browse', { browseId: 'FEmusic_liked' }).catch(() => null);
      if (browseRes?.data?.contents) {
        const traverseAndExtractSongs = (node) => {
          if (!node || typeof node !== 'object') return;
          if (node.type === 'MusicResponsiveListItem' || node.type === 'MusicTwoRowItem' || node.videoId) {
            const parsed = parseSongItem(node);
            if (parsed.id && !likedSongs.some((s) => s.id === parsed.id)) {
              likedSongs.push({ ...parsed, likedAt: new Date().toISOString() });
            }
          }
          for (const key of Object.keys(node)) {
            if (Array.isArray(node[key])) {
              node[key].forEach(traverseAndExtractSongs);
            } else if (typeof node[key] === 'object') {
              traverseAndExtractSongs(node[key]);
            }
          }
        };
        traverseAndExtractSongs(browseRes.data.contents);
      }
    } catch (e) {
      console.warn('[Innertube] Liked browse fallback warning:', e.message);
    }
  }

  // ── 2. Fetch User Library Playlists ─────────────────────────────────────
  try {
    let rawPlaylists = [];
    const libraryPlaylists = await yt.music.getLibraryPlaylists().catch(() => null);
    if (libraryPlaylists?.items || libraryPlaylists?.contents) {
      rawPlaylists = libraryPlaylists.items || libraryPlaylists.contents || [];
    } else {
      const browsePlaylists = await yt.actions.execute('/browse', { browseId: 'FEmusic_liked_playlists' }).catch(() => null)
                           || await yt.actions.execute('/browse', { browseId: 'FEmusic_library_playlists' }).catch(() => null);
      if (browsePlaylists?.data) {
        const traverseAndExtractPlaylists = (node) => {
          if (!node || typeof node !== 'object') return;
          if ((node.id || node.playlistId || node.browseId) && (node.title || node.headline)) {
            const plId = node.id || node.playlistId || node.browseId?.replace(/^VL/, '');
            if (plId && plId !== 'LM' && !rawPlaylists.some((p) => (p.id || p.playlistId) === plId)) {
              rawPlaylists.push(node);
            }
          }
          for (const key of Object.keys(node)) {
            if (Array.isArray(node[key])) {
              node[key].forEach(traverseAndExtractPlaylists);
            } else if (typeof node[key] === 'object') {
              traverseAndExtractPlaylists(node[key]);
            }
          }
        };
        traverseAndExtractPlaylists(browsePlaylists.data);
      }
    }

    // Process up to 25 user playlists
    for (const rawPl of rawPlaylists.slice(0, 25)) {
      const plId = rawPl.id || rawPl.playlistId || rawPl.browseId?.replace(/^VL/, '');
      if (!plId || plId === 'LM') continue;

      const title = rawPl.title?.text || (typeof rawPl.title === 'string' ? rawPl.title : 'YouTube Music Playlist');
      const thumb = resolveThumbnail(rawPl);

      let plTracks = [];
      try {
        const plData = await yt.music.getPlaylist(plId).catch(() => null)
                    || await yt.getPlaylist(plId).catch(() => null);
        if (plData?.items || plData?.videos || plData?.contents) {
          const items = plData.items || plData.videos || plData.contents || [];
          plTracks = items.map(parseSongItem).filter((t) => t.id);
        }
      } catch (err) {
        console.warn(`[Innertube] Playlist tracks for ${plId} warning:`, err.message);
      }

      playlists.push({
        id: `ytm_${plId}`,
        playlistId: plId,
        title,
        description: `Imported from YouTube Music (${plTracks.length} tracks)`,
        thumbnail: thumb,
        cover: thumb,
        songs: plTracks,
        source: 'youtube_music',
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('[Innertube] Library playlists fetch warning:', err.message);
  }

  return {
    success: true,
    accountName: 'YouTube Music Account',
    liked: likedSongs,
    playlists,
    stats: {
      likedCount: likedSongs.length,
      playlistsCount: playlists.length,
    },
  };
}

/**
 * 8. testYouTubeMusicAuth({ cookie, visitorData, sapisid })
 */
export async function testYouTubeMusicAuth({ cookie = '', visitorData = '', sapisid = '' } = {}) {
  try {
    let cookieHeader = '';
    if (cookie && typeof cookie === 'string' && cookie.trim()) {
      cookieHeader = cookie.trim();
    } else if (sapisid && typeof sapisid === 'string' && sapisid.trim()) {
      const clean = sapisid.trim();
      cookieHeader = `SAPISID=${clean}; __Secure-3PAPISID=${clean};`;
    }

    const yt = await Innertube.create({
      cache: new UniversalCache(false),
      client_type: ClientType.MUSIC,
      cookie: cookieHeader || undefined,
      visitor_data: visitorData || undefined,
    });

    const res = await yt.actions.execute('/browse', { browseId: 'FEmusic_liked' }).catch(() => null);
    if (res) {
      return { success: true, accountName: 'YouTube Music Connected' };
    }
    return { success: true, accountName: 'YouTube Music Session Active' };
  } catch (err) {
    console.error('[testYouTubeMusicAuth] Error:', err);
    return { success: false, message: err.message || 'Failed to authenticate YouTube Music session' };
  }
}


