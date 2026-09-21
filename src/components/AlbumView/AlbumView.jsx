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
    <div className="h-full w-full overflow-y-auto pb-32 pt-4 px-4 sm:px-8 space-y-8 scroll-smooth bg-black text-white">
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
          <div className="relative rounded-3xl overflow-hidden bg-[#0a0a0a] border border-[#222222] p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
              <ImageWithFallback
                src={data.thumbnail || data.cover}
                alt={data.title}
                icon="album"
                iconClassName="text-white/30 text-[64px]"
                className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl object-cover border border-[#262626] shadow-2xl flex-shrink-0"
              />

              <div className="flex-1 text-center sm:text-left min-w-0 space-y-2.5">
                <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-[#888888] px-2.5 py-0.5 rounded-full bg-[#141414] border border-[#333333]">
                  Album Release
                </span>
                <h1 className="text-headline-lg sm:text-display-sm font-extrabold text-white tracking-tight leading-tight">
                  {data.title}
                </h1>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-body-md text-white/80">
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
                  <p className="text-body-sm text-[#888888] line-clamp-2 max-w-xl">
                    {data.description}
                  </p>
                )}

                {/* Primary Play Album Action */}
                {data.tracks && data.tracks.length > 0 && (
                  <div className="pt-3">
                    <button
                      onClick={() => handlePlayAlbum(0)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-label-lg shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
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
            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-label-lg font-bold text-white uppercase tracking-wider">
                  Tracklist
                </h2>
                <span className="text-label-sm text-[#888888]">Duration</span>
              </div>

              <div className="divide-y divide-[#1a1a1a] rounded-2xl bg-[#050505] border border-[#222222] overflow-hidden shadow-2xl">
                {data.tracks.map((track, idx) => {
                  const isCurrent = currentSong?.videoId === track.videoId || currentSong?.id === track.id;
                  return (
                    <div
                      key={track.id || idx}
                      onClick={() => handleTrackClick(track, idx)}
                      className={`group flex items-center justify-between p-3.5 hover:bg-white/[0.04] transition-colors cursor-pointer ${
                        isCurrent ? 'bg-white/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-8 text-center text-label-md font-mono text-[#888888] flex-shrink-0 flex items-center justify-center">
                          {isCurrent && isPlaying ? (
                            <span className="material-symbols-outlined text-white text-[20px] animate-pulse">
                              volume_up
                            </span>
                          ) : (
                            <>
                              <span className="group-hover:hidden">{track.trackNumber || idx + 1}</span>
                              <span className="hidden group-hover:inline text-white material-symbols-outlined text-[20px]">
                                play_arrow
                              </span>
                            </>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            onClick={(e) => {
                              e.stopPropagation();
                              routeToSongEntity(track);
                            }}
                            className={`text-label-md font-medium truncate transition-colors hover:underline cursor-pointer ${
                              isCurrent ? 'text-white font-bold' : 'text-white'
                            }`}
                            title={`View "${track.title}"`}
                          >
                            {track.title}
                          </p>
                          <ArtistLinks
                            artists={track.artists}
                            artist={track.artist || data.artist}
                            artistId={track.artistId || data.artistId}
                            className="text-label-sm text-[#888888] truncate block"
                            linkClassName="hover:text-white hover:underline cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-3">
                        {/* Like button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(track);
                          }}
                          className={`p-1.5 rounded-full transition-transform active:scale-90 ${
                            isLiked(track.id) ? 'text-white' : 'text-[#888888] hover:text-white'
                          }`}
                          title={isLiked(track.id) ? 'Unlike' : 'Like'}
                        >
                          <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: `'FILL' ${isLiked(track.id) ? 1 : 0}` }}>
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
                          className="p-1.5 rounded-full text-[#888888] hover:text-white transition-colors"
                          title="Add to playlist"
                        >
                          <span className="material-symbols-outlined text-[19px]">
                            playlist_add
                          </span>
                        </button>

                        {/* Duration */}
                        <span className="text-label-sm text-[#888888] font-mono min-w-[36px] text-right hidden sm:inline-block">
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
