import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  RotateCw,
  LogOut,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react-native';
import { googleAuthSyncService } from '../../services/googleAuthSyncService.js';

export default function AuthModal({ isOpen, onClose, initialMode = 'signin' }) {
  const [tab, setTab] = useState(initialMode); // 'signin' | 'signup' | 'forgot' | 'profile'
  const [user, setUser] = useState(googleAuthSyncService.getUser());
  const [isSyncing, setIsSyncing] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    const unsub = googleAuthSyncService.subscribe((u, syncing) => {
      setUser(u);
      setIsSyncing(syncing);
      if (u && tab !== 'profile') {
        setTab('profile');
      } else if (!u && tab === 'profile') {
        setTab('signin');
      }
    });
    return () => unsub();
  }, [tab]);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      if (user) {
        setTab('profile');
      } else {
        setTab(initialMode || 'signin');
      }
    }
  }, [isOpen, user, initialMode]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await googleAuthSyncService.signInWithGoogle();
      if (!res.success && res.error) {
        setErrorMsg(res.error);
      }
    } catch (e) {
      setErrorMsg(e.message || 'Google Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      setErrorMsg('Please enter your email address');
      return;
    }

    if (tab === 'forgot') {
      setLoading(true);
      setErrorMsg(null);
      const res = await googleAuthSyncService.resetPassword(email);
      setLoading(false);
      if (res.success) {
        setSuccessMsg('Password reset link sent to your email.');
      } else {
        setErrorMsg(res.error || 'Failed to send reset link.');
      }
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }

    if (tab === 'signup') {
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters');
        return;
      }
      setLoading(true);
      setErrorMsg(null);
      const res = await googleAuthSyncService.signUpWithEmail(email, password, fullName);
      setLoading(false);
      if (res.success) {
        if (res.requiresEmailVerification) {
          setSuccessMsg('Account created! Please check your email to verify.');
          setTab('signin');
        } else {
          setSuccessMsg('Account created successfully!');
          setTimeout(() => onClose?.(), 1000);
        }
      } else {
        setErrorMsg(res.error || 'Failed to create account.');
      }
    } else {
      // Sign In
      setLoading(true);
      setErrorMsg(null);
      const res = await googleAuthSyncService.signInWithEmail(email, password);
      setLoading(false);
      if (res.success) {
        setSuccessMsg('Signed in successfully!');
        setTimeout(() => onClose?.(), 800);
      } else {
        setErrorMsg(res.error || 'Invalid email or password.');
      }
    }
  };

  const handleSyncCloud = async () => {
    const res = await googleAuthSyncService.syncYouTubeMusicLibrary();
    if (res?.success) {
      Alert.alert(
        'Library Synced',
        `Synced ${res.data?.likedCount || 0} liked tracks and ${res.data?.playlistCount || 0} playlists from YouTube Music.`
      );
    } else {
      Alert.alert('Sync Notice', res?.error || 'Synced cached library items.');
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await googleAuthSyncService.signOut();
          setTab('signin');
        },
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandTitle}>cassette.fm</Text>
            <Text style={styles.headerSubtitle}>
              {user ? 'Account & Cloud Library' : 'Sign in to sync your library'}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── PROFILE VIEW WHEN LOGGED IN ── */}
          {user ? (
            <View style={styles.profileSection}>
              <View style={styles.profileCard}>
                <View style={[styles.avatarCircle, { backgroundColor: user.avatarBg || '#ea580c' }]}>
                  <Text style={styles.avatarLetter}>{user.avatarLetter || 'V'}</Text>
                </View>
                <View style={styles.profileMeta}>
                  <Text style={styles.profileName}>{user.name || 'User'}</Text>
                  <Text style={styles.profileEmail}>{user.email}</Text>
                  <View style={styles.statusBadge}>
                    <ShieldCheck size={13} color="#10b981" />
                    <Text style={styles.statusText}>{user.statusText || 'Google Connected · Synced'}</Text>
                  </View>
                </View>
              </View>

              {/* Cloud Sync Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSyncCloud}
                disabled={isSyncing}
                style={styles.syncBtn}
              >
                {isSyncing ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <RotateCw size={16} color="#000000" />
                )}
                <Text style={styles.syncBtnText}>
                  {isSyncing ? 'Syncing Library...' : 'Sync YouTube Music Library'}
                </Text>
              </TouchableOpacity>

              {/* Sign Out Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSignOut}
                style={styles.signOutBtn}
              >
                <LogOut size={16} color="#ef4444" />
                <Text style={styles.signOutText}>Sign Out / Switch Account</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── AUTH FORMS WHEN LOGGED OUT ── */
            <View>
              {/* Tab Switcher */}
              <View style={styles.tabBar}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setTab('signin');
                    setErrorMsg(null);
                  }}
                  style={[styles.tabItem, tab === 'signin' && styles.tabItemActive]}
                >
                  <Text style={[styles.tabText, tab === 'signin' && styles.tabTextActive]}>
                    Sign In
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setTab('signup');
                    setErrorMsg(null);
                  }}
                  style={[styles.tabItem, tab === 'signup' && styles.tabItemActive]}
                >
                  <Text style={[styles.tabText, tab === 'signup' && styles.tabTextActive]}>
                    Create Account
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setTab('forgot');
                    setErrorMsg(null);
                  }}
                  style={[styles.tabItem, tab === 'forgot' && styles.tabItemActive]}
                >
                  <Text style={[styles.tabText, tab === 'forgot' && styles.tabTextActive]}>
                    Forgot
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Feedback messages */}
              {errorMsg && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{errorMsg}</Text>
                </View>
              )}
              {successMsg && (
                <View style={styles.successBanner}>
                  <CheckCircle size={15} color="#10b981" />
                  <Text style={styles.successBannerText}>{successMsg}</Text>
                </View>
              )}

              {/* Google Sign In Button */}
              {tab !== 'forgot' && (
                <>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleGoogleSignIn}
                    disabled={loading}
                    style={styles.googleBtn}
                  >
                    <View style={styles.googleG}>
                      <Text style={styles.googleGText}>G</Text>
                    </View>
                    <Text style={styles.googleBtnText}>Continue with Google</Text>
                  </TouchableOpacity>

                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or with email</Text>
                    <View style={styles.dividerLine} />
                  </View>
                </>
              )}

              {/* Full Name input for Signup */}
              {tab === 'signup' && (
                <View style={styles.inputWrapper}>
                  <User size={18} color="#71717a" style={styles.inputIcon} />
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Full Name"
                    placeholderTextColor="#71717a"
                    style={styles.textInput}
                    autoCapitalize="words"
                  />
                </View>
              )}

              {/* Email input */}
              <View style={styles.inputWrapper}>
                <Mail size={18} color="#71717a" style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email address"
                  placeholderTextColor="#71717a"
                  style={styles.textInput}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Password input */}
              {tab !== 'forgot' && (
                <View style={styles.inputWrapper}>
                  <Lock size={18} color="#71717a" style={styles.inputIcon} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password (min 6 characters)"
                    placeholderTextColor="#71717a"
                    secureTextEntry={!showPassword}
                    style={styles.textInput}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#71717a" />
                    ) : (
                      <Eye size={18} color="#71717a" />
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleEmailSubmit}
                disabled={loading}
                style={styles.submitBtn}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {tab === 'signup' ? 'Create Account' : tab === 'forgot' ? 'Send Reset Link' : 'Sign In'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  brandTitle: {
    fontSize: 22,
    fontFamily: 'Shrikhand',
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#a1a1aa',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1c1c1f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#161618',
    borderRadius: 14,
    padding: 3,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 11,
  },
  tabItemActive: {
    backgroundColor: '#26262a',
  },
  tabText: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#71717a',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#f87171',
    fontSize: 13,
    fontFamily: 'Inter',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successBannerText: {
    color: '#34d399',
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  googleG: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ea4335',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleGText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  googleBtnText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#000000',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#71717a',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter',
  },
  submitBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#000000',
  },
  profileSection: {
    gap: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161618',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarLetter: {
    fontSize: 22,
    fontFamily: 'Inter',
    fontWeight: '800',
    color: '#ffffff',
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#ffffff',
  },
  profileEmail: {
    fontSize: 13,
    fontFamily: 'Inter',
    color: '#a1a1aa',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#10b981',
    fontWeight: '600',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingVertical: 13,
    borderRadius: 16,
  },
  syncBtnText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#000000',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingVertical: 13,
    borderRadius: 16,
  },
  signOutText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#ef4444',
  },
});
