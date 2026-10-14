import { apiUrl } from '../utils/apiConfig.js';
import { resolveAudioStream } from './innertube.js';

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.yt',
  'https://pipedapi.leptons.xyz',
  'https://pipedapi.reallyaweso.me',
  'https://pipedapi.drgns.space',
  'https://pipedapi.nosebs.ru',
];

/**
 * Resolves a direct audio streaming URL for a given YouTube video ID.
 * 1. Primary (On-Device): Uses InnerTube directly to extract Google CDN audio stream with IP-matching.
 * 2. Secondary: Calls backend proxy if configured.
 * 3. Tertiary: Queries public Piped/Invidious instances.
 *
 * @param {string} videoId
 * @param {string} quality - 'max' | 'standard' | 'datasaver'
 * @param {string} codec - 'auto' | 'opus' | 'mp4' | 'aac'
 * @returns {Promise<{ streamUrl: string, meta: object } | null>}
 */
export async function resolveDirectAudioStream(videoId, quality = 'max', codec = 'auto') {
  if (!videoId) return null;

  // ── 1. Primary: On-device InnerTube stream extraction (PRD AUD-02) ──
  try {
    const streamInfo = await resolveAudioStream(videoId, quality, codec);
    if (streamInfo?.streamUrl) {
      return {
        streamUrl: streamInfo.streamUrl,
        meta: streamInfo,
      };
    }
  } catch (tubeErr) {
    console.warn(`[Audio Resolver] On-device InnerTube extraction warning for ${videoId}:`, tubeErr.message);
  }

  // ── 2. Secondary: Extract raw stream URL via backend API (?format=json) ──
  try {
    const base = apiUrl('');
    if (base) {
      const res = await fetch(
        apiUrl(`/api/stream/${videoId}?format=json&quality=${quality}&codec=${codec}`),
        { signal: AbortSignal.timeout(6000) }
      );
      if (res.ok) {
        const meta = await res.json();
        if (meta?.streamUrl) {
          return {
            streamUrl: meta.streamUrl,
            meta,
          };
        }
      }
    }
  } catch (err) {
    console.warn('[Audio Resolver] Backend API fetch error:', err.message);
  }

  // ── 2. Fallback: Public Piped API instances (browser connects directly) ──
  console.log(`[Audio Resolver] Attempting Piped API fallback for ${videoId}...`);
  for (const instance of PIPED_INSTANCES) {
    try {
      const pipedRes = await fetch(`${instance}/streams/${videoId}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(4000),
      });

      if (pipedRes.ok) {
        const pipedData = await pipedRes.json();
        const audioStreams = (pipedData.audioStreams || []).sort(
          (a, b) => (b.bitrate || 0) - (a.bitrate || 0)
        );

        if (audioStreams.length > 0) {
          // Select opus/webm or first available
          let chosen = audioStreams[0];
          if (codec === 'opus' || codec === 'auto') {
            const opus = audioStreams.find((s) => s.mimeType?.includes('opus'));
            if (opus) chosen = opus;
          } else if (codec === 'mp4' || codec === 'aac') {
            const mp4 = audioStreams.find((s) => s.mimeType?.includes('mp4') || s.mimeType?.includes('aac'));
            if (mp4) chosen = mp4;
          }

          if (chosen?.url) {
            console.log(`[Audio Resolver] Resolved stream via Piped (${instance})`);
            return {
              streamUrl: chosen.url,
              meta: {
                streamUrl: chosen.url,
                bitrate: chosen.bitrate || 128000,
                mimeType: chosen.mimeType || 'audio/webm',
                qualityLabel: `Piped Stream (${Math.round((chosen.bitrate || 128000) / 1000)}kbps)`,
                quality,
                itag: chosen.itag || 251,
              },
            };
          }
        }
      }
    } catch {
      // Try next Piped instance silently
    }
  }

  console.warn(`[Audio Resolver] Using audio fallback for video: ${videoId}`);
  return null;
}
