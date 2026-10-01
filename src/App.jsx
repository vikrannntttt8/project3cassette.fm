import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { PlayerProvider, usePlayer } from './context/PlayerContext.jsx';
import HomeView            from './components/HomeView/HomeView.jsx';
import LyricsView          from './components/LyricsView/LyricsView.jsx';
import LibraryView         from './components/LibraryView/LibraryView.jsx';
import PlayerDock          from './components/PlayerDock/PlayerDock.jsx';
import Sidebar             from './components/Sidebar.jsx';
import ArtistView          from './components/ArtistView/ArtistView.jsx';
import AlbumView           from './components/AlbumView/AlbumView.jsx';
import SingleView          from './components/SingleView/SingleView.jsx';
import SettingsModal       from './components/shared/SettingsModal.jsx';
import MobileBottomNav     from './components/shared/MobileBottomNav.jsx';
import MobileHeader        from './components/shared/MobileHeader.jsx';
import MobileSearchOverlay from './components/shared/MobileSearchOverlay.jsx';

import { SettingsProvider } from './context/SettingsContext.jsx';
import AuthModal          from './components/shared/AuthModal.jsx';
import { ThemeProvider, useTheme }   from './context/ThemeContext.jsx';

function AppShell() {
  const {
    view,
    navState,
    currentSong,
    isSettingsOpen,
    closeSettings,
    isMobileSearchOpen,
    openMobileSearch,
    closeMobileSearch,
    streamToast,
  } = usePlayer();
  const { themeMode } = useTheme();

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-[#0e0e0e] text-[#f3f3f5] relative">
      {/* ── Minimalist Background Engine (Monochrome Base / Conditional Ambient Glow) ────────── */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#0e0e0e]">
        {/* Dynamic / Custom theme radial glow layers (disabled in default monochrome mode) */}
        {themeMode !== 'default' && (
          <>
            <div
              className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full transition-all duration-1000 ease-out opacity-25 blur-[120px]"
              style={{
                background: 'radial-gradient(circle, var(--accent-color, #ffffff) 0%, transparent 70%)',
              }}
            />
            <div
              className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full transition-all duration-1000 ease-out opacity-20 blur-[130px]"
              style={{
                background: 'radial-gradient(circle, var(--accent-color, #ffffff) 0%, transparent 70%)',
              }}
            />
          </>
        )}

        {/* Dynamic Cover Art Atmosphere (active strictly in 'dynamic' mode) */}
        {themeMode === 'dynamic' && (currentSong?.cover || currentSong?.thumbnail) ? (
          <div
            className="absolute inset-[-20%] bg-cover bg-center transition-all duration-1000 ease-out opacity-20"
            style={{
              backgroundImage: `url(${currentSong.cover || currentSong.thumbnail})`,
              filter: 'blur(100px)',
              transform: 'scale(1.25)',
            }}
          />
        ) : null}

        {/* Crisp readability mask with dark charcoal tint */}
        <div className="absolute inset-0 bg-[#0e0e0e]/85" />
      </div>

      {/* ── Mobile Branded Header (< md — hidden on desktop & LyricsView) ── */}
      {view !== 'lyrics' && !isSettingsOpen && (
        <MobileHeader onSearchClick={openMobileSearch} />
      )}

      {/* ── Mobile Search Overlay (< md) ── */}
      <MobileSearchOverlay
        isOpen={isMobileSearchOpen}
        onClose={closeMobileSearch}
      />

      {/* ── Sidebar — desktop only (md+). Mobile uses MobileHeader + MobileBottomNav ── */}
      <div className={`
        hidden md:block md:static md:z-20 flex-shrink-0 bg-[#0e0e0e]/95 backdrop-blur-xl border-r border-white/5
        ${view === 'lyrics' || isSettingsOpen ? 'md:w-0 md:overflow-hidden md:opacity-0' : 'md:w-64'}
      `}>
        <Sidebar />
      </div>

      {/* ── Main content with smooth transitions ─────────────── */}
      <div className="flex-1 relative z-10 overflow-hidden bg-transparent md:pb-[88px]">
        <div key={`${view}-${navState.currentId || ''}`} className="h-full w-full animate-page-slide">
          {(view === 'home' || view === 'search') && <HomeView />}
          {view === 'artist'  && <ArtistView browseId={navState.currentId} artistName={navState.extra?.name} />}
          {view === 'album'   && <AlbumView browseId={navState.currentId} initialData={navState.extra} />}
          {view === 'single'  && <SingleView videoId={navState.currentId} track={navState.extra} />}
          {view === 'lyrics'  && <LyricsView />}
          {view === 'library' && <LibraryView initialSection="playlists" />}
          {view === 'liked'   && <LibraryView initialSection="liked" />}
        </div>
      </div>

      {/* ── Stream Quality / Bitrate Toast ── */}
      {streamToast && (
        <div className="fixed top-5 right-5 z-[110] p-3.5 rounded-2xl bg-[#18181a]/95 border border-accent/40 shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-fade-in text-white shadow-accent">
          <div className="w-8 h-8 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent flex-shrink-0">
            <span className="material-symbols-outlined text-[18px]">graphic_eq</span>
          </div>
          <div>
            <p className="text-label-md font-bold text-white">{streamToast.title}</p>
            <p className="text-body-xs font-mono text-neutral-400">{streamToast.detail}</p>
          </div>
        </div>
      )}

      {/* ── Persistent Glass Player Dock (hidden in expanded lyrics view or full-screen settings) ── */}
      {view !== 'lyrics' && !isSettingsOpen && <PlayerDock />}

      {/* ── Mobile Bottom Navigation Bar (< md) ── */}
      {view !== 'lyrics' && !isSettingsOpen && (
        <MobileBottomNav onOpenSearch={openMobileSearch} />
      )}

      {/* ── Settings Overlay ── */}
      <SettingsModal isOpen={isSettingsOpen} onClose={closeSettings} />
    </div>
  );
}

function ThemedAppShell() {
  const { currentSong } = usePlayer();
  return (
    <ThemeProvider currentSong={currentSong}>
      <AppShell />
      <AuthModal />
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <PlayerProvider>
          <ThemedAppShell />
        </PlayerProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
