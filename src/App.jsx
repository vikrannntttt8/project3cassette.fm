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

function AppShell() {
  const { view, navState, currentSong, isSettingsOpen, setIsSettingsOpen, streamToast } = usePlayer();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Close mobile search on view change
  useEffect(() => {
    setMobileSearchOpen(false);
  }, [view]);

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-[#0e0e0e] text-[#f3f3f5] relative">
      {/* ── Minimalist Background Engine (Album art is only ambient color) ────────── */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#0e0e0e]">
        {currentSong?.cover || currentSong?.thumbnail ? (
          <div
            className="absolute inset-[-20%] bg-cover bg-center transition-all duration-1000 ease-out opacity-25"
            style={{
              backgroundImage: `url(${currentSong.cover || currentSong.thumbnail})`,
              filter: 'blur(100px)',
              transform: 'scale(1.25)',
            }}
          />
        ) : null}

        {/* Crisp readability mask with warm tint */}
        <div className="absolute inset-0 bg-[#0e0e0e]/85" />
      </div>

      {/* ── Mobile Branded Header (< md — hidden on desktop & LyricsView) ── */}
      {view !== 'lyrics' && !isSettingsOpen && (
        <MobileHeader onSearchClick={() => setMobileSearchOpen(true)} />
      )}

      {/* ── Mobile Search Overlay (< md) ── */}
      <MobileSearchOverlay
        isOpen={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
      />

      {/* ── Sidebar — desktop only (md+). Mobile uses MobileHeader + MobileBottomNav ── */}
      <div className={`
        hidden md:block md:static md:z-20 flex-shrink-0 bg-[#0e0e0e]
        ${view === 'lyrics' || isSettingsOpen ? 'md:w-0 md:overflow-hidden md:opacity-0' : 'md:w-64'}
      `}>
        <Sidebar />
      </div>

      {/* ── Main content with smooth transitions ─────────────── */}
      <div className="flex-1 relative z-10 overflow-hidden bg-[#0e0e0e] md:pb-20">
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
        <div className="fixed top-5 right-5 z-[110] p-3.5 rounded-2xl bg-[#18181a]/95 border border-amber-500/30 shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-fade-in text-white">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
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
      {view !== 'lyrics' && !isSettingsOpen && <MobileBottomNav />}

      {/* ── Full-Screen ArchiveTune Settings Overlay ── */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <AppShell />
      </PlayerProvider>
    </AuthProvider>
  );
}
