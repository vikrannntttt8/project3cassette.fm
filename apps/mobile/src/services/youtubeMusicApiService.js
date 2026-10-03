import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUrl } from '@cassette/core';

const HISTORY_STORAGE_KEY = 'pulse_playback_history';
const LIKED_STORAGE_KEY = 'likedSongs';
const PLAYLISTS_STORAGE_KEY = 'pulse_playlists';

class YouTubeMusicApiService {
  /**
   * Fetches the dynamic live home feed from YouTube Music API pipeline
   */
  async fetchLiveHomeFeed() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      // Attempt to fetch from the live /api/home/feed endpoint
      const res = await fetch(apiUrl('/api/home/feed'), {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      }).catch(() => null);

      clearTimeout(timeoutId);

      let data = null;
      if (res && res.ok) {
        data = await res.json().catch(() => null);
      }

      // If remote feed is empty or failed, fetch live trending tracks via search API
      let quickPicks = Array.isArray(data?.quickPicks) && data.quickPicks.length > 0 ? data.quickPicks : [];
      let dailyMixes = Array.isArray(data?.dailyMixes) && data.dailyMixes.length > 0 ? data.dailyMixes : [];
      let trendingAlbums = Array.isArray(data?.trendingAlbums) && data.trendingAlbums.length > 0 ? data.trendingAlbums : [];

      if (quickPicks.length === 0) {
        const trendingRes = await fetch(apiUrl('/api/search?q=top%20hits%20today&type=songs'), {
          headers: { Accept: 'application/json' },
        }).catch(() => null);

        if (trendingRes && trendingRes.ok) {
          const songs = await trendingRes.json().catch(() => []);
          if (Array.isArray(songs) && songs.length > 0) {
            quickPicks = songs.slice(0, 10);
          }
        }
      }

      if (trendingAlbums.length === 0) {
        const albumsRes = await fetch(apiUrl('/api/search?q=trending%20albums&type=albums'), {
          headers: { Accept: 'application/json' },
        }).catch(() => null);

        if (albumsRes && albumsRes.ok) {
          const albums = await albumsRes.json().catch(() => []);
          if (Array.isArray(albums) && albums.length > 0) {
            trendingAlbums = albums.slice(0, 8);
          }
        }
      }

      if (dailyMixes.length === 0) {
        const mixesRes = await fetch(apiUrl('/api/search?q=curated%20radio%20mix&type=playlists'), {
          headers: { Accept: 'application/json' },
        }).catch(() => null);

        if (mixesRes && mixesRes.ok) {
          const mixes = await mixesRes.json().catch(() => []);
          if (Array.isArray(mixes) && mixes.length > 0) {
            dailyMixes = mixes.slice(0, 8);
          }
        }
      }

      // Read real persistent playback history for the "Listen Again" section
      const historyRaw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      let listenAgain = [];
      if (historyRaw) {
        try {
          const parsed = JSON.parse(historyRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            listenAgain = parsed.slice(0, 8);
          }
        } catch {}
      }

      // If history is empty, populate Listen Again from user's liked songs or quick picks
      if (listenAgain.length === 0) {
        const likedRaw = await AsyncStorage.getItem(LIKED_STORAGE_KEY);
        if (likedRaw) {
          try {
            const parsedLiked = JSON.parse(likedRaw);
            if (Array.isArray(parsedLiked) && parsedLiked.length > 0) {
              listenAgain = parsedLiked.slice(0, 8);
            }
          } catch {}
        }
      }

      if (listenAgain.length === 0 && quickPicks.length > 0) {
        listenAgain = quickPicks.slice(0, 6);
      }

      return {
        listenAgain,
        quickPicks,
        dailyMixes,
        trendingAlbums,
        throwbacks: dailyMixes.slice(2, 6),
      };
    } catch (err) {
      console.warn('[YouTubeMusicApi] fetchLiveHomeFeed warning:', err.message);
      return {
        listenAgain: [],
        quickPicks: [],
        dailyMixes: [],
        trendingAlbums: [],
        throwbacks: [],
      };
    }
  }

  /**
   * Search YouTube Music in real-time
   */
  async search(query, type = 'all') {
    if (!query || !query.trim()) return [];
    try {
      const res = await fetch(
        apiUrl(`/api/search?q=${encodeURIComponent(query.trim())}&type=${encodeURIComponent(type)}`),
        { headers: { Accept: 'application/json' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.results)) return data.results;
        if (data && data.songs) return data.songs;
      }
      return [];
    } catch (err) {
      console.warn('[YouTubeMusicApi] Search error:', err.message);
      return [];
    }
  }

  /**
   * Live search query autocomplete suggestions
   */
  async getSuggestions(query) {
    if (!query || !query.trim()) return [];
    try {
      const res = await fetch(
        apiUrl(`/api/search/suggestions?q=${encodeURIComponent(query.trim())}`),
        { headers: { Accept: 'application/json' } }
      );
      if (res.ok) {
        const suggestions = await res.json();
        return Array.isArray(suggestions) ? suggestions : [];
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Generates live radio queue from a seed track
   */
  async getRadioQueue(song) {
    if (!song) return [];
    const videoId = song.videoId || song.id;
    try {
      const res = await fetch(
        apiUrl(`/api/search?q=${encodeURIComponent((song.artist || '') + ' songs')}&type=songs`),
        { headers: { Accept: 'application/json' } }
      );
      if (res.ok) {
        const tracks = await res.json();
        if (Array.isArray(tracks) && tracks.length > 0) {
          return [song, ...tracks.filter((t) => (t.videoId || t.id) !== videoId)];
        }
      }
    } catch (e) {
      console.warn('[YouTubeMusicApi] Radio queue generation error:', e.message);
    }
    return [song];
  }

  /**
   * Add song to persistent history
   */
  async recordSongHistory(song) {
    if (!song) return;
    try {
      const raw = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      let list = [];
      if (raw) {
        try {
          list = JSON.parse(raw) || [];
        } catch {}
      }
      const targetId = song.id || song.videoId;
      list = [song, ...list.filter((s) => (s.id || s.videoId) !== targetId)].slice(0, 30);
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      console.warn('[YouTubeMusicApi] recordHistory error:', err);
    }
  }
}

export const youtubeMusicApiService = new YouTubeMusicApiService();
