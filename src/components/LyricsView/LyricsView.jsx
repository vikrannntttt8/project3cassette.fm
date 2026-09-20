import { usePlayer } from '../../context/PlayerContext.jsx';
import AlbumArtPanel from './AlbumArtPanel.jsx';
import LyricsPanel from './LyricsPanel.jsx';

export default function LyricsView() {
  const { toggleView } = usePlayer();

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-neo-grid select-none">
      {/* ── Neo-Brutalist Header ─────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 sm:px-10 py-3.5 h-16 border-b-2 border-black bg-[#0d0e13]/90 shadow-[0_2px_0px_0px_#000]">
        {/* Back to home */}
        <button
          onClick={toggleView}
          className="neo-btn bg-[#181920] hover:bg-black text-white px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>EXIT STUDIO</span>
        </button>

        {/* Audio quality sticker pill */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="neo-badge bg-[#CCFF00] text-black text-[10px] font-black border border-black shadow-neo-sm">
            LOSSLESS 24-BIT // 192KHZ
          </span>
          <span className="neo-badge bg-[#00F0FF] text-black text-[10px] font-black border border-black shadow-neo-sm">
            DOLBY ATMOS SPATIAL
          </span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleView}
            className="neo-btn-pink px-3 py-1 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 shadow-neo-sm"
            title="Lyrics Active"
          >
            <span className="material-symbols-outlined text-[16px]">lyrics</span>
            <span>LYRICS SYNC</span>
          </button>
        </div>
      </header>

      {/* ── 2-Column content ────────────────────────────────────── */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center min-h-0 py-4 px-6 sm:px-10 lg:px-14 max-w-7xl mx-auto w-full overflow-hidden">
        <AlbumArtPanel />
        <LyricsPanel />
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="flex-shrink-0 flex items-center justify-between font-mono text-[10px] text-zinc-400 px-6 sm:px-10 py-2.5 border-t-2 border-black bg-[#0d0e13]">
        <span className="text-[#CCFF00] font-bold">● MASTERED FOR PULSE // SPATIAL MATRIX</span>
        <div className="flex items-center gap-4 uppercase font-bold">
          <span className="text-zinc-500">LRCLIB SYNC ENGINE</span>
          <span className="text-[#00F0FF]">STEREO 320 KBPS</span>
        </div>
      </footer>
    </div>
  );
}
