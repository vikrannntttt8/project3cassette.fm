import { useState, useEffect } from 'react';
import { apiUrl } from '../../utils/apiConfig.js';

export default function CreditsModal({ isOpen, onClose, currentSong }) {
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !currentSong) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    const title = currentSong.title || '';
    const artist = currentSong.artist || '';

    fetch(apiUrl(`/api/spotify/credits?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`))
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load track credits');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setCredits(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentSong]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="w-full max-w-lg bg-[#0a0a0a] border border-[#222222] rounded-2xl shadow-2xl p-6 text-white relative animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#1a1a1a]">
          <div className="min-w-0 pr-4">
            <p className="text-[11px] uppercase tracking-widest text-[#888888] font-mono">
              Track Credits & Metadata
            </p>
            <h2 className="text-headline-sm font-bold text-white truncate mt-0.5">
              {currentSong?.title || 'Song Credits'}
            </h2>
            <p className="text-body-sm text-[#888888] truncate">
              {currentSong?.artist || 'Unknown Artist'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#333333] hover:border-white text-[#888888] hover:text-white flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="py-5 flex flex-col gap-5 max-h-[60vh] overflow-y-auto no-scrollbar">
          {loading ? (
            <div className="flex flex-col gap-3 py-8 animate-pulse">
              <div className="h-4 w-1/3 bg-[#1a1a1a] rounded" />
              <div className="h-6 w-2/3 bg-[#1a1a1a] rounded" />
              <div className="h-4 w-1/4 bg-[#1a1a1a] rounded mt-4" />
              <div className="h-6 w-1/2 bg-[#1a1a1a] rounded" />
            </div>
          ) : error ? (
            <div className="py-8 text-center text-[#888888]">
              <p className="text-body-md text-white font-medium">Unable to fetch detailed credits</p>
              <p className="text-body-sm mt-1">{error}</p>
            </div>
          ) : credits ? (
            <>
              {/* Performers */}
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-[#666666]">
                  Performed By
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {credits.performers?.map((performer, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-[#141414] border border-[#262626] text-body-sm text-white"
                    >
                      {performer}
                    </span>
                  ))}
                </div>
              </div>

              {/* Written By / Songwriters */}
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-[#666666]">
                  Written By
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {credits.songwriters?.map((writer, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-[#141414] border border-[#262626] text-body-sm text-white"
                    >
                      {writer}
                    </span>
                  ))}
                </div>
              </div>

              {/* Produced By */}
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-[#666666]">
                  Produced By
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {credits.producers?.map((producer, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-[#141414] border border-[#262626] text-body-sm text-white"
                    >
                      {producer}
                    </span>
                  ))}
                </div>
              </div>

              {/* Metadata Details */}
              <div className="pt-3 border-t border-[#1a1a1a] grid grid-cols-2 gap-3 text-body-xs font-mono text-[#888888]">
                <div>
                  <span className="text-[#555555] block">ALBUM</span>
                  <span className="text-white">{credits.album || 'Single'}</span>
                </div>
                <div>
                  <span className="text-[#555555] block">RELEASE DATE</span>
                  <span className="text-white">{credits.releaseDate || 'N/A'}</span>
                </div>
                {credits.isrc && (
                  <div>
                    <span className="text-[#555555] block">ISRC</span>
                    <span className="text-white">{credits.isrc}</span>
                  </div>
                )}
                <div>
                  <span className="text-[#555555] block">METADATA SOURCE</span>
                  <span className="text-white flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
                    {credits.source}
                  </span>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#1a1a1a] flex items-center justify-between">
          <p className="text-[11px] text-[#555555]">
            Powered by Spotify Web API &amp; cassette.fm Audio Engine
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-white text-black text-label-sm font-semibold hover:bg-neutral-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
