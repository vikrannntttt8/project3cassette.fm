import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  getSupabaseCredentials,
  saveSupabaseCredentials,
  signInWithGoogle as supaSignInGoogle,
  signOut as supaSignOut,
  syncLikedSongsCloud,
  fetchLikedSongsCloud,
  syncPlaylistsCloud,
  fetchPlaylistsCloud,
  saveHistoryItemCloud,
  fetchHistoryCloud,
  syncHistoryCloud,
  performFullCloudSync,
} from '../services/supabase.js';

const AuthContext = createContext(null);

// Safely cleans OAuth hash fragments without throwing SecurityError on replaceState
function cleanAuthUrlFragments() {
  if (typeof window === 'undefined') return;
  try {
    const { hash, pathname, search } = window.location;
    if (hash && (hash.includes('access_token=') || hash.includes('refresh_token=') || hash.includes('error='))) {
      const cleanUrl = (pathname || '/') + (search || '');
      if (window.history && typeof window.history.replaceState === 'function') {
        window.history.replaceState(window.history.state || null, document.title, cleanUrl);
      }
    }
  } catch (err) {
    console.warn('[Auth] Ignored replaceState error during hash cleanup:', err);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(isSupabaseConfigured);
  const [authSequence, setAuthSequence] = useState(0);

  // Initialize session and auth state listener
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setLoading(false);
      return;
    }

    client.auth.getSession()
      .then(({ data: { session: currentSession }, error }) => {
        if (error) {
          console.warn('[Auth] getSession message:', error.message);
        }
        setSession(currentSession);
        setUser(currentSession?.user || null);
        setLoading(false);
        if (currentSession?.user) {
          setAuthSequence((s) => s + 1);
        }
        cleanAuthUrlFragments();
      })
      .catch((err) => {
        console.error('[Auth] getSession failed:', err);
        setLoading(false);
      });

    const { data: { subscription } } = client.auth.onAuthStateChange((event, newSession) => {
      console.log(`[Auth] onAuthStateChange event: ${event}`, newSession?.user?.email);
      setSession(newSession);
      setUser(newSession?.user || null);
      setLoading(false);
      if (newSession?.user) {
        setAuthSequence((s) => s + 1);
      }
      cleanAuthUrlFragments();
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [configured]);

  const signInWithGoogle = useCallback(async () => {
    return await supaSignInGoogle();
  }, []);

  const signOut = useCallback(async () => {
    await supaSignOut();
    setUser(null);
    setSession(null);
  }, []);

  const updateCredentials = useCallback((url, anonKey) => {
    saveSupabaseCredentials(url, anonKey);
    setConfigured(isSupabaseConfigured());
  }, []);

  // Cloud sync helpers
  const syncLikedSongs = useCallback(async (likedSongs) => {
    if (!user?.id) return;
    await syncLikedSongsCloud(user.id, likedSongs);
  }, [user]);

  const fetchLikedSongs = useCallback(async () => {
    if (!user?.id) return [];
    return await fetchLikedSongsCloud(user.id);
  }, [user]);

  const syncPlaylists = useCallback(async (playlists) => {
    if (!user?.id) return;
    await syncPlaylistsCloud(user.id, playlists);
  }, [user]);

  const fetchPlaylists = useCallback(async () => {
    if (!user?.id) return [];
    return await fetchPlaylistsCloud(user.id);
  }, [user]);

  const recordHistory = useCallback(async (song) => {
    if (!user?.id) return;
    await saveHistoryItemCloud(user.id, song);
  }, [user]);

  const fetchHistory = useCallback(async () => {
    if (!user?.id) return [];
    return await fetchHistoryCloud(user.id);
  }, [user]);

  const performFullSync = useCallback(async (localData) => {
    if (!user?.id) throw new Error('User not logged in');
    return await performFullCloudSync(user.id, localData);
  }, [user]);

  const value = {
    user,
    session,
    loading,
    isConfigured: configured,
    credentials: getSupabaseCredentials(),
    updateCredentials,
    signInWithGoogle,
    signOut,
    syncLikedSongs,
    fetchLikedSongs,
    syncPlaylists,
    fetchPlaylists,
    recordHistory,
    fetchHistory,
    performFullSync,
    authSequence,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
