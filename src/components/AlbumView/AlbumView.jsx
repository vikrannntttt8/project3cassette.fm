import { useState, useEffect } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { formatDuration } from '../../utils/timeFormat.js';
import AddToPlaylistMenu from '../shared/AddToPlaylistMenu.jsx';
import ImageWithFallback from '../shared/ImageWithFallback.jsx';
import BackButton from '../shared/BackButton.jsx';
import ArtistLinks from '../shared/ArtistLinks.jsx';
import { apiUrl } from '../../utils/apiConfig.js';

export default function AlbumView({ browseId, initialData }) {
  const {
    navigateTo,
    goBack,
    playAlbum,
    currentSong,
    isPlaying,
    togglePlay,
    isLiked,
    toggleLike,
    routeToSongEntity,
    routeToArtistEntity,
  } = usePlayer();
  const [data, setData] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData?.tracks);
  const [error, setError] = useState(null);
  const [addMenuSong, setAddMenuSong] = useState(null);

  useEffect(() => {
    if (!browseId) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    const fetchAlbum = async () => {
      try {
        const res = await fetch(apiUrl(`/api/album/${browseId}`));
        if (!res.ok) throw new Error(`Failed to load album details (${res.status})`);
        const json = await res.json();
        if (mounted) setData(json);
      } catch (err) {
        if (mounted) setError(err.message || 'Error fetching album details');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAlbum();
    return () => { mounted = false; };
  }, [browseId]);

  const handlePlayAlbum = (startIndex = 0) => {
    if (!data?.tracks?.length) return;
    playAlbum(data.tracks, startIndex);
  };

  const handleTrackClick = (track, idx) => {
    if (currentSong?.videoId === track.videoId || currentSong?.id === track.id) {
      togglePlay();
      return;
    }
    handlePlayAlbum(idx);
  };

  return (
    <div className="h-full w-full overflow-y-auto pt-[calc(var(--mobile-header-h)+var(--safe-top))] md:pt-4 pb-[calc(var(--mobile-nav-h)+var(--safe-bottom)+6.5rem)] md:pb-20 px-4 sm:px-8 space-y-6 scroll-smooth bg-[#0e0e0e] text-white no-scrollbar">
      {/* ── Top Navigation Bar ── */}
      <div className="flex items-center gap-4">
        <BackButton label="Back" />
        <span className="text-body-sm text-[#888888]">/ Album Release</span>
      </div>

      {/* ── Loading Skeleton ── */}
      {loading && (
        <div className="space-y-6 animate-pulse">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-end">
            <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl bg-[#141414] border border-[#222222] flex-shrink-0" />
            <div className="space-y-3 w-full max-w-md">
              <div className="h-4 w-20 bg-[#1a1a1a] rounded" />
              <div className="h-8 w-64 bg-[#1a1a1a] rounded-lg" />
              <div className="h-5 w-40 bg-[#1a1a1a] rounded" />
              <div className="h-10 w-36 bg-[#1a1a1a] rounded-full mt-4" />
            </div>
          </div>
          <div className="space-y-2 pt-6">
            <div className="h-12 bg-[#111111] rounded-xl border border-[#1f1f1f]" />
            <div className="h-12 bg-[#111111] rounded-xl border border-[#1f1f1f]" />
            <div className="h-12 bg-[#111111] rounded-xl border border-[#1f1f1f]" />
          </div>
        </div>
      )}

      {/* ── Error Banner ── */}
      {error && !loading && (
        <div className="p-6 rounded-2xl bg-[#141414] border border-[#333333] text-center space-y-3">
          <p className="text-body-lg text-white font-semibold">{error}</p>
          <BackButton label="Return to Previous View" className="px-4 py-2 bg-white text-black hover:bg-neutral-200" />
        </div>
      )}

      {/* ── Album Profile Content ── */}
      {data && !loading && (
        <>
          {/* Header Banner */}
          <div className="relative rounded-2xl overflow-hidden bg-[#0a0a0a] border border-[#222222] p-4 sm:p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
              <ImageWithFallback
                src={data.thumbnail || data.cover}
                alt={data.title}
                icon="album"
                iconClassName="text-white/30 text-[48px]"
                className="w-32 h-32 sm:w-44 sm:h-44 rounded-xl object-cover border border-[#262626] shadow-xl flex-shrink-0"
              />

              <div className="flex-1 text-center sm:text-left min-w-0 space-y-2">
                <span className="inline-block text-[10.5px] font-semibold uppercase tracking-wider text-[#888888] px-2 py-0.5 rounded-full bg-[#141414] border border-[#333333]">
                  Album Release
                </span>
                <h1 className="text-headline-md sm:text-headline-lg font-extrabold text-white tracking-tight leading-tight">
                  {data.title}
                </h1>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-body-sm text-white/80">
                  <ArtistLinks
                    artists={data.artists}
                    artist={data.artist}
                    artistId={data.artistId}
                    className="font-semibold text-white inline-block"
                    linkClassName="hover:underline cursor-pointer"
                  />
                  {data.year && (
                    <>
                      <span className="text-[#666666]">•</span>
                      <span className="text-[#888888]">{data.year}</span>
                    </>
                  )}
                  {data.tracks && (
                    <>
                      <span className="text-[#666666]">•</span>
                      <span className="text-[#888888]">{data.tracks.length} songs</span>
                    </>
                  )}
                </div>

                {data.description && (
                  <p className="text-body-xs text-[#888888] line-clamp-2 max-w-xl">
                    {data.description}
                  </p>
                )}

                {/* Primary Play Album Action */}
                {data.tracks && data.tracks.length > 0 && (
                  <div className="pt-2">
                    <button
                      onClick={() => handlePlayAlbum(0)}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white hover:bg-neutral-200 text-black font-bold text-label-md shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        play_arrow
                      </span>
                      Play Album
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tracklist Table */}
          {data.tracks && data.tracks.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-label-md font-bold text-white uppercase tracking-wider">
                  Tracklist
                </h2>
                <span className="text-label-xs text-[#888888]">Duration</span>
              </div>

              <div className="divide-y divide-[#1a1a1a] rounded-xl bg-[#050505] border border-[#222222] overflow-hidden shadow-xl">
                {data.tracks.map((track, idx) => {
                  const isCurrent = currentSong?.videoId === track.videoId || currentSong?.id === track.id;
                  return (
                    <div
                      key={track.id || idx}
                      onClick={() => handleTrackClick(track, idx)}
                      className={`group flex items-center justify-between px-3 py-2 transition-all cursor-pointer min-h-[46px] select-none ${
                        isCurrent ? 'bg-accent/15 text-accent' : 'bg-[#18181a]/45 hover:bg-[#18181a] text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-6 text-center text-label-sm font-mono text-neutral-500 flex-shrink-0 flex items-center justify-center">
                          {isCurrent && isPlaying ? (
                            <span className="material-symbols-outlined text-accent text-[17px]">
                              graphic_eq
                            </span>
                          ) : (
                            <>
                              <span className="group-hover:hidden">{track.trackNumber || idx + 1}</span>
                              <span className="hidden group-hover:inline text-white material-symbols-outlined text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                play_arrow
                              </span>
                            </>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p
                            className={`text-label-md font-semibold truncate whitespace-nowrap overflow-hidden text-ellipsis transition-colors leading-tight ${
                              isCurrent ? 'text-accent font-bold' : 'text-white'
                            }`}
                            title={track.title}
                          >
                            {track.title}
                          </p>
                          <ArtistLinks
                            artists={track.artists}
                            artist={track.artist || data.artist}
                            artistId={track.artistId || data.artistId}
                            className="text-[11px] text-neutral-400 truncate block mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        {/* Like button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(track);
                          }}
                          className={`p-1.5 rounded-full transition-transform active:scale-90 cursor-pointer ${
                            isLiked(track.id) ? 'text-accent' : 'text-neutral-500 hover:text-white'
                          }`}
                          title={isLiked(track.id) ? 'Unlike' : 'Like'}
                        >
                          <span className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: `'FILL' ${isLiked(track.id) ? 1 : 0}` }}>
                            favorite
                          </span>
                        </button>

                        {/* Add to playlist button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddMenuSong(track);
                          }}
                          className="p-1.5 rounded-full text-neutral-500 hover:text-white transition-colors cursor-pointer"
                          title="Add to playlist"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            playlist_add
                          </span>
                        </button>

                        {/* Duration */}
                        <span className="text-[11px] text-neutral-500 font-mono min-w-[34px] text-right hidden sm:inline-block">
                          {formatDuration(track.duration)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {addMenuSong && (
        <AddToPlaylistMenu song={addMenuSong} onClose={() => setAddMenuSong(null)} />
      )}
    </div>
  );
}
