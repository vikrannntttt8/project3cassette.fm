import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithYouTube,
  signOutYouTube,
  getSavedUserProfile,
  isUserLoggedIn,
  likeSongOnYouTube,
  removeLikeOnYouTube,
  fetchYouTubeLibrary,
  isNativeApp,
} from '../services/youtubeAuth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authSequence, setAuthSequence] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('signin');

  const openAuthModal = useCallback((mode = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  // Initialize saved session on boot
  useEffect(() => {
    try {
      if (isUserLoggedIn()) {
        const savedProfile = getSavedUserProfile();
        setUser(savedProfile || {
          id: 'yt_user',
          name: 'YouTube Music Listener',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          isYouTubeAccount: true,
        });
        setSession({ loggedIn: true, provider: 'youtube' });
      } else {
        setUser(null);
        setSession(null);
      }
    } catch (err) {
      console.error('[Auth] Failed to restore YouTube session:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign In with Google / YouTube
  const signInWithGoogle = useCallback(async (manualCookie = null) => {
    setLoading(true);
    try {
      const result = await signInWithYouTube(manualCookie);
      setUser(result.user);
      setSession({ loggedIn: true, provider: 'youtube' });
      setAuthSequence((s) => s + 1);
      setIsAuthModalOpen(false);
      return result;
    } catch (err) {
      console.error('[Auth] YouTube Sign-in error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await signOutYouTube();
      setUser(null);
      setSession(null);
      setAuthSequence((s) => s + 1);
    } catch (err) {
      console.error('[Auth] Sign-out error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2-Way Sync Methods with YouTube Music
  const syncLikeSong = useCallback(async (videoId, isLiked) => {
    if (!user) return;
    if (isLiked) {
      await likeSongOnYouTube(videoId);
    } else {
      await removeLikeOnYouTube(videoId);
    }
  }, [user]);

  const fetchLibrary = useCallback(async () => {
    if (!user) return null;
    return await fetchYouTubeLibrary();
  }, [user]);

  // Legacy compatibility fallbacks for smooth transition
  const signInWithEmail = useCallback(async () => {
    throw new Error('Please sign in with Google for 2-way YouTube Music sync.');
  }, []);
  const signUpWithEmail = useCallback(async () => {
    throw new Error('Please sign in with Google for 2-way YouTube Music sync.');
  }, []);
  const resetPassword = useCallback(async () => {
    throw new Error('Please sign in with Google for 2-way YouTube Music sync.');
  }, []);
  const updateCredentials = useCallback(() => {}, []);

  const value = {
    user,
    session,
    loading,
    isConfigured: true,
    isNative: isNativeApp(),
    credentials: { url: '', anonKey: '' },
    updateCredentials,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut,
    syncLikeSong,
    fetchLibrary,
    authSequence,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    openAuthModal,
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
