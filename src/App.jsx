import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { PlayerProvider, usePlayer } from './context/PlayerContext.jsx';
import HomeView         from './components/HomeView/HomeView.jsx';
import LyricsView       from './components/LyricsView/LyricsView.jsx';
import LibraryView      from './components/LibraryView/LibraryView.jsx';
import PlayerDock       from './components/PlayerDock/PlayerDock.jsx';
import Sidebar          from './components/Sidebar.jsx';
import ArtistView       from './components/ArtistView/ArtistView.jsx';
import AlbumView        from './components/AlbumView/AlbumView.jsx';
import SingleView       from './components/SingleView/SingleView.jsx';
import SettingsModal    from './components/shared/SettingsModal.jsx';
import MobileBottomNav  from './components/shared/MobileBottomNav.jsx';

function AppShell() {
  const { view, navState, currentSong, isSettingsOpen, setIsSettingsOpen, streamToast } = usePlayer();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on view change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [view]);

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-black text-white relative">
      {/* ── Minimalist Background Engine (Album art is only ambient color) ────────── */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-black">
        {currentSong?.cover || currentSong?.thumbnail ? (
          <div
            className="absolute inset-[-20%] bg-cover bg-center transition-all duration-1000 ease-out opacity-20"
            style={{
              backgroundImage: `url(${currentSong.cover || currentSong.thumbnail})`,
              filter: 'blur(90px)',
              transform: 'scale(1.2)',
            }}
          />
        ) : null}

        {/* Crisp readability mask */}
        <div className="absolute inset-0 bg-black/80" />
      </div>

      {/* ── Mobile Hamburger Toggle (Tablet only — bottom nav handles phone) ── */}
      {view !== 'lyrics' && !isSettingsOpen && (
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="hidden fixed top-4 left-4 z-40 w-11 h-11 rounded-xl bg-black text-white hover:bg-white/10 items-center justify-center shadow-lg border border-[#2a2a2a] cursor-pointer"
          aria-label="Toggle Navigation"
        >
          <span className="material-symbols-outlined text-[22px]">
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      )}

      {/* ── Mobile Drawer Backdrop ────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/80 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────────── */}
      {/* On desktop: fixed left bar. On mobile: slide-over drawer */}
      <div className={`
        fixed inset-y-0 left-0 z-40 md:static md:z-20 transition-all duration-300 flex-shrink-0 bg-black
        ${view === 'lyrics' || isSettingsOpen ? 'hidden md:w-0 md:overflow-hidden md:opacity-0' : ''}
        ${mobileMenuOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full md:translate-x-0 md:w-60'}
      `}>
        <Sidebar />
      </div>

      {/* ── Main content with smooth transitions ─────────────── */}
      <div className="flex-1 relative z-10 overflow-hidden bg-black">
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
        <div className="fixed top-5 right-5 z-[110] p-3.5 rounded-2xl bg-[#0a0a0a]/95 border border-[#333333] shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-fade-in text-white">
          <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white flex-shrink-0">
            <span className="material-symbols-outlined text-[18px]">graphic_eq</span>
          </div>
          <div>
            <p className="text-label-md font-bold text-white">{streamToast.title}</p>
            <p className="text-body-xs font-mono text-[#888888]">{streamToast.detail}</p>
          </div>
        </div>
      )}

      {/* ── Persistent Glass Player Dock (hidden in expanded lyrics view or full-screen settings) ── */}
      {view !== 'lyrics' && !isSettingsOpen && <PlayerDock />}

      {/* ── Mobile Bottom Navigation Bar (< md, replaces hamburger on phones) ── */}
      {view !== 'lyrics' && !isSettingsOpen && <MobileBottomNav />}

      {/* ── Full-Screen Settings Overlay ── */}
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
