/**
 * Format seconds to MM:SS display string
 * @param {number} seconds
 * @returns {string} e.g. "3:42"
 */
export function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const formatDuration = formatTime;

/**
 * Get remaining time as -MM:SS
 */
export function formatRemaining(current, duration) {
  const remaining = (duration || 0) - (current || 0);
  return `-${formatTime(remaining)}`;
}
