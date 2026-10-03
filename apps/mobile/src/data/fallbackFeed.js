/**
 * Dynamic Home Feed Schema
 * All mock data has been purged. Feeds are loaded dynamically
 * via the live YouTube Music API pipeline and user history.
 */

export const EMPTY_FEED = {
  listenAgain: [],
  quickPicks: [],
  dailyMixes: [],
  trendingAlbums: [],
  throwbacks: [],
  playlists: [],
};

export const FALLBACK_LISTEN_AGAIN = [];
export const FALLBACK_QUICK_PICKS = [];
export const FALLBACK_DAILY_MIXES = [];
export const FALLBACK_TRENDING_ALBUMS = [];
export const FALLBACK_THROWBACKS = [];
export const FALLBACK_USER_PLAYLISTS = [];

export const FALLBACK_HOME_FEED = EMPTY_FEED;
