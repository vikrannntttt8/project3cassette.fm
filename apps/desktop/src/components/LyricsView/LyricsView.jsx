import { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import AlbumArtPanel from './AlbumArtPanel.jsx';
import LyricsPanel from './LyricsPanel.jsx';
import CreditsModal from './CreditsModal.jsx';

export default function LyricsView() {
  const { toggleView, currentSong } = usePlayer();
  const [creditsOpen, setCreditsOpen] = useState(false);

  return (
    // Desktop & Mobile: fills the entire available canvas height seamlessly
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* ── Minimal header ─────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 sm:px-8 lg:px-10 py-3 sm:py-4 pt-safe min-h-[48px] sm:min-h-[56px]">
        {/* Back to home */}
        <button
          onClick={toggleView}
          className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors group focus:outline-none min-w-[44px] min-h-[44px] -ml-2 px-2"
        >
          <svg className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          <span className="font-cassette text-[20px] text-white tracking-normal group-hover:opacity-90 leading-none">
            cassette.fm
          </span>
        </button>

        {/* Right controls */}
        <div className="flex items-center gap-4 text-on-surface-variant">
          <button
            onClick={() => setCreditsOpen(true)}
            className="text-[11px] font-mono text-neutral-500 hover:text-white transition-colors cursor-pointer tracking-widest uppercase"
          >
            Credits
          </button>
          <button onClick={toggleView} className="text-accent hover:opacity-80 transition-colors" title="Close Lyrics">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M7 8h10M7 12h6m-6 4h10M4 4h16v16H4V4z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── 2-Column content (desktop: non-scrolling split; mobile: single scrollable) ── */}
      <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12
        overflow-y-auto lg:overflow-hidden
        py-2 px-4 sm:px-8 lg:px-16 max-w-7xl mx-auto w-full items-center">
        <AlbumArtPanel />
        <LyricsPanel />
      </main>

      {/* ── Spotify Credits Modal ── */}
      <CreditsModal
        isOpen={creditsOpen}
        onClose={() => setCreditsOpen(false)}
        currentSong={currentSong}
      />
    </div>
  );
}
