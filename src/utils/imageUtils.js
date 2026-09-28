/**
 * imageUtils.js — Universal High-Resolution Image Normalizer & Cover Art Pipeline
 *
 * Cleans low-resolution and aggressive crop parameters from YouTube & Google User Content URLs:
 * - Google/YouTube CDN (lh3.googleusercontent.com, yt3.ggpht.com):
 *   Replaces dimension query params (=w120-h120..., =s120...) with =w1080-h1080-l90-rj
 * - YouTube Video Thumbnails (i.ytimg.com):
 *   Swaps hqdefault.jpg / mqdefault.jpg / default.jpg for maxresdefault.jpg
 */
export function getHighResImage(url) {
  if (!url || typeof url !== 'string') return '';
  let cleanUrl = url.trim();

  // 1. Google / YouTube CDN (Artist profile avatars, album covers, playlist artwork)
  // e.g., https://lh3.googleusercontent.com/...=s120-c or =w120-h120-p-k-no-mo or yt3.ggpht.com
  if (
    cleanUrl.includes('googleusercontent.com') ||
    cleanUrl.includes('ggpht.com') ||
    cleanUrl.includes('yt3.ggpht.com')
  ) {
    if (/=w\d+-h\d+[^?#]*/.test(cleanUrl)) {
      cleanUrl = cleanUrl.replace(/=w\d+-h\d+[^?#]*/, '=w1080-h1080-l90-rj');
    } else if (/=s\d+[^?#]*/.test(cleanUrl)) {
      cleanUrl = cleanUrl.replace(/=s\d+[^?#]*/, '=w1080-h1080-l90-rj');
    } else if (!cleanUrl.includes('=w1080-h1080-l90-rj')) {
      cleanUrl += cleanUrl.includes('?') ? '&w=1080&h=1080' : '=w1080-h1080-l90-rj';
    }
  }

  // 2. YouTube Video Thumbnails (i.ytimg.com)
  // Upgrades low-res defaults to uncompressed maxresdefault.jpg
  if (cleanUrl.includes('i.ytimg.com/vi/')) {
    cleanUrl = cleanUrl.replace(
      /\/(default|mqdefault|hqdefault|sddefault|hq720)\.jpg/,
      '/maxresdefault.jpg'
    );
  }

  return cleanUrl;
}
