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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(isSupabaseConfigured);

  // Initialize session and auth state listener
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setLoading(false);
      return;
    }

    client.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user || null);
      setLoading(false);
    });

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);
      setLoading(false);
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
