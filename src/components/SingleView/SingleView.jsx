import { useState, useEffect } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { formatDuration } from '../../utils/timeFormat.js';
import BackButton from '../shared/BackButton.jsx';
import ImageWithFallback from '../shared/ImageWithFallback.jsx';
import AddToPlaylistMenu from '../shared/AddToPlaylistMenu.jsx';
import ArtistLinks from '../shared/ArtistLinks.jsx';
import { apiUrl } from '../../utils/apiConfig.js';

/**
 * SingleView — Dedicated view for Standalone Singles, Music Videos, and Remixes
 * Route: /single/[videoId]
 */
export default function SingleView({ videoId, track: initialTrack }) {
  const {
    currentSong,
    isPlaying,
    togglePlay,
    loadSong,
    isLiked,
    toggleLike,
    routeToArtistEntity,
  } = usePlayer();

  const [track, setTrack] = useState(initialTrack || null);
  const [loading, setLoading] = useState(!initialTrack);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  useEffect(() => {
    if (initialTrack) {
      setTrack(initialTrack);
      setLoading(false);
      return;
    }

    if (!videoId) return;

    let mounted = true;
    setLoading(true);

    fetch(apiUrl(`/api/search?q=${encodeURIComponent(videoId)}&type=song`))
      .then((res) => (res.ok ? res.json() : []))
      .then((results) => {
        if (!mounted) return;
        const match = results.find((r) => r.id === videoId || r.videoId === videoId) || results[0];
        if (match) {
          setTrack(match);
        } else {
          setTrack({
            id: videoId,
            videoId,
            title: 'Single / Video',
            artist: 'Unknown Artist',
            thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            cover: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            type: 'video',
          });
        }
      })
      .catch(() => {
        if (mounted) {
          setTrack({
            id: videoId,
            videoId,
            title: 'Single / Video',
            artist: 'Unknown Artist',
            thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            cover: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            type: 'video',
          });
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [videoId, initialTrack]);

  const targetId = track?.videoId || track?.id || videoId;
  const isCurrentPlaying = (currentSong?.videoId === targetId || currentSong?.id === targetId) && isPlaying;
  const liked = track ? isLiked(track.id || track.videoId) : false;

  const handlePlay = () => {
    if (!track) return;
    if (currentSong?.videoId === targetId || currentSong?.id === targetId) {
      togglePlay();
    } else {
      loadSong({
        ...track,
        id: targetId,
        videoId: targetId,
      });
    }
  };

  const isVideo = track?.type === 'video' || track?.isMusicVideo || track?.views;

  return (
    <div className="h-full w-full overflow-y-auto pt-[calc(var(--mobile-header-h)+var(--safe-top)+0.5rem)] md:pt-4 pb-[calc(var(--mobile-nav-h)+var(--safe-bottom)+7rem)] md:pb-20 px-4 sm:px-8 space-y-8 scroll-smooth bg-[#0e0e0e] text-white no-scrollbar">
      {/* ── Top Bar Navigation ── */}
      <div className="flex items-center gap-4">
        <BackButton label="Back" />
        <span className="text-body-sm text-[#888888]">
          / {isVideo ? 'Music Video' : 'Single Release'}
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 animate-pulse">
          <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-body-md text-[#888888]">Loading single details...</p>
        </div>
      ) : track ? (
        <div className="space-y-8">
          {/* Hero Media Card */}
          <div className="relative rounded-2xl overflow-hidden bg-[#0a0a0a] border border-[#222222] p-4 sm:p-6 shadow-xl">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4 sm:gap-6">
              {/* Media Art with Play Action */}
              <div
                onClick={handlePlay}
                className="relative group cursor-pointer w-32 sm:w-48 aspect-square rounded-xl overflow-hidden shadow-xl border border-[#262626] flex-shrink-0 bg-neutral-900"
              >
                <ImageWithFallback
                  src={track.thumbnail || track.cover}
                  alt={track.title}
                  icon={isVideo ? 'smart_display' : 'music_note'}
                  iconClassName="text-white/30 text-[48px]"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black shadow-lg transform group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {isCurrentPlaying ? 'pause' : 'play_arrow'}
                    </span>
                  </div>
                </div>

                {isVideo && (
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white border border-[#333333] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">smart_display</span>
                    Video
                  </span>
                )}
              </div>

              {/* Media Metadata & Controls */}
              <div className="flex-1 text-center md:text-left min-w-0 space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#141414] border border-[#333333] text-[#888888] text-[10.5px] font-semibold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[13px] text-white">
                    {isVideo ? 'videocam' : 'album'}
                  </span>
                  <span>{isVideo ? 'Official Music Video' : 'Standalone Single'}</span>
                </div>

                <h1 className="text-headline-md sm:text-headline-lg font-extrabold text-white tracking-tight break-words">
                  {track.title}
                </h1>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-body-sm text-[#888888]">
                  <ArtistLinks
                    artists={track.artists}
                    artist={track.artist}
                    artistId={track.artistId}
                    className="font-semibold text-white inline-block"
                    linkClassName="hover:underline cursor-pointer"
                  />

                  {track.year && <span>• {track.year}</span>}
                  {track.duration > 0 && <span>• {formatDuration(track.duration)}</span>}
                  {track.views && <span>• {track.views}</span>}
                </div>

                {/* Primary Action Buttons */}
                <div className="pt-1.5 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <button
                    type="button"
                    onClick={handlePlay}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white hover:bg-neutral-200 text-black font-bold text-label-md shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {isCurrentPlaying ? 'pause' : 'play_arrow'}
                    </span>
                    <span>{isCurrentPlaying ? 'Pause' : 'Play Now'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleLike(track)}
                    className={`p-2 rounded-full border transition-all active:scale-90 cursor-pointer ${
                      liked
                        ? 'bg-white text-black border-white'
                        : 'bg-transparent border-[#333333] text-[#888888] hover:text-white hover:border-[#666666]'
                    }`}
                    title={liked ? 'Unlike' : 'Like'}
                  >
                    <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: `'FILL' ${liked ? 1 : 0}` }}>
                      favorite
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAddMenuOpen(true)}
                    className="p-2 rounded-full bg-transparent hover:bg-white/[0.05] border border-[#333333] hover:border-[#666666] text-[#888888] hover:text-white transition-all cursor-pointer"
                    title="Add to playlist"
                  >
                    <span className="material-symbols-outlined text-[19px]">playlist_add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-[#0a0a0a] border border-[#222222] text-center space-y-3">
          <p className="text-body-lg text-[#888888]">Could not load this single.</p>
          <BackButton label="Go Back" />
        </div>
      )}

      {addMenuOpen && track && (
        <AddToPlaylistMenu song={track} onClose={() => setAddMenuOpen(false)} />
      )}
    </div>
  );
}
