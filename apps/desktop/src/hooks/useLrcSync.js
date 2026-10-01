import { useMemo, useEffect, useRef } from 'react';
import { parseLrc, getActiveLyricIndex } from '../utils/lrcParser.js';

/**
 * useLrcSync — LRC timestamp syncing hook
 *
 * Parses an LRC string into timestamped lines and tracks
 * the currently active line based on audio currentTime.
 *
 * @param {string} lrcString - Raw LRC content
 * @param {number} currentTime - Current audio playback time (seconds)
 * @returns {{ lines: LrcLine[], activeIndex: number }}
 */
export function useLrcSync(lrcString, currentTime) {
  const lines = useMemo(() => parseLrc(lrcString), [lrcString]);
  const activeIndex = useMemo(
    () => getActiveLyricIndex(lines, currentTime),
    [lines, currentTime]
  );

  return { lines, activeIndex };
}

/**
 * useLyricsScroll — auto-scroll active lyric into view
 *
 * @param {number} activeIndex
 * @param {React.RefObject} containerRef - scrollable lyrics container
 */
export function useLyricsScroll(activeIndex, containerRef) {
  const activeRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || activeIndex < 0) return;
    const activeEl = containerRef.current.children[activeIndex];
    if (!activeEl) return;

    activeEl.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [activeIndex, containerRef]);

  return activeRef;
}
