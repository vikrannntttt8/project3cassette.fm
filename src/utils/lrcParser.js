// LRC Parser Utility
// Parses LRC format: [MM:SS.ms] lyric text, supports multiple timestamps per line & formats
// Returns sorted array of { time: number (seconds), text: string }

const TIMESTAMP_REGEX = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
const METADATA_REGEX = /^\[[a-zA-Z]+:/;

/**
 * Parse an LRC string into a sorted array of lyric objects.
 * @param {string} lrcString - Raw LRC or plain lyrics content
 * @returns {{ time: number, text: string, isSynced: boolean }[]}
 */
export function parseLrc(lrcString) {
  if (!lrcString || typeof lrcString !== 'string') return [];

  const rawLines = lrcString.split(/\r?\n/);
  const parsed = [];
  let hasAnyTimestamps = false;

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Skip metadata tags like [ar:...], [ti:...], [length:...]
    if (METADATA_REGEX.test(line)) continue;

    // Find all timestamp tags in the line: e.g. "[00:12.34][00:45.67] Chorus line"
    const timestamps = [];
    let match;
    let lastIndex = 0;

    while ((match = TIMESTAMP_REGEX.exec(line)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const fractionStr = match[3] || '0';
      const fraction = parseFloat(`0.${fractionStr}`) || 0;

      if (!isNaN(minutes) && !isNaN(seconds)) {
        timestamps.push(minutes * 60 + seconds + fraction);
      }
      lastIndex = TIMESTAMP_REGEX.lastIndex;
    }

    if (timestamps.length > 0) {
      hasAnyTimestamps = true;
      const text = line.slice(lastIndex).trim() || '♪';
      for (const time of timestamps) {
        parsed.push({ time, text, isSynced: true });
      }
    } else if (!hasAnyTimestamps) {
      // Potentially plain text lyrics without timestamps
      parsed.push({ time: -1, text: line, isSynced: false });
    }
  }

  // If timestamped lyrics were found, filter out any non-synced artifact lines and sort by time
  if (hasAnyTimestamps) {
    return parsed
      .filter((item) => item.isSynced)
      .sort((a, b) => a.time - b.time);
  }

  // Otherwise return plain lines with estimated times or sequential display
  return parsed.filter((item) => item.text.length > 0);
}

/**
 * Find the index of the currently active lyric line.
 * Returns the last line whose timestamp is <= currentTime.
 * @param {{ time: number, text: string }[]} lines
 * @param {number} currentTime - Current audio time in seconds
 * @returns {number} - Active line index (-1 if before first line)
 */
export function getActiveLyricIndex(lines, currentTime) {
  if (!lines || !lines.length || typeof currentTime !== 'number') return -1;
  if (lines[0]?.time === -1) return -1; // Unsynced plain lyrics

  let activeIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= currentTime + 0.15) { // 150ms lead time for natural reading pace
      activeIndex = i;
    } else {
      break;
    }
  }
  return activeIndex;
}

// Demo fallback LRC for when lyrics are unavailable
export const DEMO_LRC = `[00:00.00] ♪ Instrumental Intro ♪
[00:05.00] In the quiet chamber where the currents divide
[00:10.50] Silver ribbons tangle in the cold astral tide
[00:16.00] Drowning in the neon waves of timeless reverie
[00:21.50] We cast our shadows down where the ocean meets the wire
[00:27.00] Synthesizing starlight, breathing violet fire
[00:32.50] Through the fractured glass of memory
[00:38.00] Echoes resonate endlessly
[00:43.50] In the pulse of every frequency
[00:49.00] We find our shared infinity
[00:54.50] ♪ Chorus ♪
[01:00.00] Rise above the static and the noise
[01:05.50] Let the music be your voice
[01:11.00] In the darkness, we are light
[01:16.50] In the silence, we take flight
[01:22.00] Pulse — the rhythm never dies
[01:27.50] Under these electric skies
[01:33.00] ♪ Bridge ♪
[01:38.50] Every waveform tells a story
[01:44.00] Every beat a fleeting glory
[01:49.50] Harmonic fields of violet light
[01:55.00] Dissolving into endless night
[02:00.50] ♪ Outro ♪
[02:06.00] And so the music fades away
[02:11.50] But in our hearts, it's here to stay
[02:17.00] The pulse goes on
[02:22.50] Forever on
[02:28.00] ♪
`;
