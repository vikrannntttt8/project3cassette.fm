import { useState, useRef, useEffect } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';

/**
 * TrackContextMenu
 * Minimal, clean monochrome dropdown menu for track actions:
 * - Play Next
 * - Add to Queue
 * - Go to Album
 * - Go to Artist
 * - Add to Playlist
 */
export default function TrackContextMenu({ track, onAddToPlaylist }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const {
    playNextTrack,
    addToQueue,
    routeToSongEntity,
    routeToArtistEntity,
  } = usePlayer();

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handlePlayNext = (e) => {
    e.stopPropagation();
    playNextTrack(track);
    setIsOpen(false);
  };

  const handleAddToQueue = (e) => {
    e.stopPropagation();
    addToQueue(track);
    setIsOpen(false);
  };

  const handleGoToAlbum = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    routeToSongEntity(track);
  };

  const handleGoToArtist = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    routeToArtistEntity(track.artist, track.artistId);
  };

  const handlePlaylist = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    onAddToPlaylist?.(track);
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="p-1.5 rounded-full text-[#888888] hover:text-white hover:bg-white/10 transition-colors"
        title="More options"
        aria-label="Track options"
      >
        <span className="material-symbols-outlined text-[20px]">more_vert</span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-[#0e0e0e] border border-[#262626] shadow-2xl py-1 z-50 animate-fade-in divide-y divide-[#1a1a1a]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-1">
            <button
              onClick={handlePlayNext}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-label-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors text-left"
            >
              <span className="material-symbols-outlined text-[18px]">playlist_play</span>
              <span>Play Next</span>
            </button>
            <button
              onClick={handleAddToQueue}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-label-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors text-left"
            >
              <span className="material-symbols-outlined text-[18px]">queue_music</span>
              <span>Add to Queue</span>
            </button>
          </div>

          <div className="py-1">
            <button
              onClick={handleGoToAlbum}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-label-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors text-left"
            >
              <span className="material-symbols-outlined text-[18px]">album</span>
              <span>Go to Album</span>
            </button>
            <button
              onClick={handleGoToArtist}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-label-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors text-left"
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
              <span>Go to Artist</span>
            </button>
            {onAddToPlaylist && (
              <button
                onClick={handlePlaylist}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-label-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[18px]">playlist_add</span>
                <span>Add to Playlist</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
