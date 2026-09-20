import { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import AlbumArtPanel from './AlbumArtPanel.jsx';
import LyricsPanel from './LyricsPanel.jsx';
import CreditsModal from './CreditsModal.jsx';

export default function LyricsView() {
  const { toggleView, currentSong } = usePlayer();
  const [creditsOpen, setCreditsOpen] = useState(false);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* ── Minimal header ──────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-10 py-5 h-14">
        {/* Back to home */}
        <button
          onClick={toggleView}
          className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors group focus:outline-none"
        >
          <svg className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          <span className="text-label-lg font-semibold tracking-wider text-on-surface-variant group-hover:text-white uppercase">
            Pulse
          </span>
        </button>

        {/* Right controls */}
        <div className="flex items-center gap-5 text-on-surface-variant">
          <button className="hover:text-white transition-colors" title="AirPlay">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1" />
              <polygon points="12 15 17 21 7 21 12 15" />
            </svg>
          </button>
          <button onClick={toggleView} className="text-white hover:text-white/70 transition-colors" title="Lyrics Active">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M7 8h10M7 12h6m-6 4h10M4 4h16v16H4V4z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── 2-Column content ────────────────────────────────────── */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center min-h-0 py-2 px-10 lg:px-16 max-w-7xl mx-auto w-full">
        <AlbumArtPanel />
        <LyricsPanel />
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="flex-shrink-0 flex items-center justify-between text-label-sm text-[#888888] px-10 py-3 border-t border-[#1a1a1a]/50">
        <span className="tracking-wide text-[12px] font-mono">
          {currentSong?.album || 'Pulse Studio'}
        </span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCreditsOpen(true)}
            className="text-[12px] text-[#888888] hover:text-white transition-colors underline-offset-4 hover:underline cursor-pointer"
          >
            Credits
          </button>
        </div>
      </footer>

      {/* ── Spotify Credits Modal ── */}
      <CreditsModal
        isOpen={creditsOpen}
        onClose={() => setCreditsOpen(false)}
        currentSong={currentSong}
      />
    </div>
  );
}
