import { PlayerProvider, usePlayer } from './context/PlayerContext.jsx';
import HomeView    from './components/HomeView/HomeView.jsx';
import LyricsView  from './components/LyricsView/LyricsView.jsx';
import LibraryView from './components/LibraryView/LibraryView.jsx';
import PlayerDock  from './components/PlayerDock/PlayerDock.jsx';
import Sidebar     from './components/Sidebar.jsx';

function AppShell() {
  const { view } = usePlayer();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neo-grid text-white relative font-sans select-none">
      {/* ── Background subtle brutalist aura ───────────────────────── */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
        <div className="absolute -top-[10%] -left-[5%] w-[45vw] h-[45vw] rounded-full bg-[#CCFF00] opacity-10 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-[#FF2E93] opacity-15 blur-[140px]" />
        <div className="absolute top-[35%] left-[50%] w-[35vw] h-[35vw] rounded-full bg-[#00F0FF] opacity-10 blur-[130px]" />
      </div>

      {/* ── Sidebar (hidden in fullscreen lyrics view) ───────── */}
      <div className={`relative z-20 transition-all duration-300 flex-shrink-0 ${
        view === 'lyrics' ? 'w-0 overflow-hidden opacity-0' : 'w-64 opacity-100'
      }`}>
        <Sidebar />
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="flex-1 relative z-10 overflow-hidden flex flex-col">
        <div key={view} className="h-full w-full animate-fade-in overflow-hidden">
          {view === 'home'    && <HomeView />}
          {view === 'lyrics'  && <LyricsView />}
          {view === 'library' && <LibraryView initialSection="playlists" />}
          {view === 'liked'   && <LibraryView initialSection="liked" />}
        </div>
      </div>

      {/* ── Persistent Neo-Brutalist Player Dock ─────────────── */}
      <PlayerDock />
    </div>
  );
}

export default function App() {
  return (
    <PlayerProvider>
      <AppShell />
    </PlayerProvider>
  );
}
