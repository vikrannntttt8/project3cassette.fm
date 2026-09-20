/**
 * imageUtils.js — Universal High-Resolution Image Normalizer
 *
 * Cleans low-resolution and aggressive crop parameters from YouTube & Google User Content URLs:
 * - Replaces `=s120-c`, `=w120-h120-p-k-no-mo`, `=s60` etc. with `=s800`
 * - Upgrades ytimg thumbnails from `default.jpg` or `hqdefault.jpg` to `hq720.jpg`
 */
export function getHighResImage(url) {
  if (!url || typeof url !== 'string') return '';
  let cleanUrl = url.trim();

  // 1. Google / YouTube User Content (Artist profile avatars, album covers)
  // e.g., https://lh3.googleusercontent.com/...=s120-c or =w120-h120-p-k-no-mo
  if (
    cleanUrl.includes('googleusercontent.com') ||
    cleanUrl.includes('ggpht.com') ||
    cleanUrl.includes('yt3.ggpht.com')
  ) {
    if (/=w\d+-h\d+/.test(cleanUrl)) {
      cleanUrl = cleanUrl.replace(/=w\d+-h\d+[^?#]*/, '=s800');
    } else if (/=s\d+/.test(cleanUrl)) {
      cleanUrl = cleanUrl.replace(/=s\d+[^?#]*/, '=s800');
    } else if (!cleanUrl.includes('=s800')) {
      cleanUrl += cleanUrl.includes('?') ? '&s=800' : '=s800';
    }
  }

  // 2. YouTube Video Thumbnails (i.ytimg.com)
  // Upgrades low-res defaults to high-definition 720p
  if (cleanUrl.includes('i.ytimg.com/vi/')) {
    cleanUrl = cleanUrl.replace(
      /\/(default|mqdefault|hqdefault|sddefault)\.jpg/,
      '/hq720.jpg'
    );
  }

  return cleanUrl;
}
