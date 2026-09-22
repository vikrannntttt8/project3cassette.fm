import { useState, useEffect } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { formatDuration } from '../../utils/timeFormat.js';
import AddToPlaylistMenu from '../shared/AddToPlaylistMenu.jsx';
import ImageWithFallback from '../shared/ImageWithFallback.jsx';
import BackButton from '../shared/BackButton.jsx';
import ArtistLinks from '../shared/ArtistLinks.jsx';
import { apiUrl } from '../../utils/apiConfig.js';

export default function ArtistView({ browseId, artistName }) {
  const {
    navigateTo,
    goBack,
    loadSong,
    currentSong,
    isPlaying,
    togglePlay,
    isLiked,
    toggleLike,
    handleEntityClick,
    routeToSongEntity,
    routeToArtistEntity,
  } = usePlayer();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTopSongs, setExpandedTopSongs] = useState(false);
  const [addMenuSong, setAddMenuSong] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!browseId && !artistName) return;

    let mounted = true;
    setLoading(true);
    setError(null);
    setExpandedTopSongs(false);

    const fetchArtist = async () => {
      try {
        let targetId = browseId || artistName;
        if (!targetId) {
          throw new Error('Artist ID could not be resolved');
        }

        const res = await fetch(apiUrl(`/api/artist/${encodeURIComponent(targetId)}`));
        if (!res.ok) {
          // Fallback: search for artist tracks if the specific endpoint returned non-200
          const query = artistName || targetId;
          const searchRes = await fetch(apiUrl(`/api/search?q=${encodeURIComponent(query)}`));
          if (searchRes.ok) {
            const tracks = await searchRes.json();
            if (Array.isArray(tracks) && tracks.length > 0) {
              const fallbackData = {
                name: query,
                thumbnail: tracks[0]?.thumbnail || '',
                description: `Popular tracks and releases by ${query}`,
                topSongs: tracks.slice(0, 20),
                albums: [],
                singles: [],
              };
              if (mounted) setData(fallbackData);
              return;
            }
          }
          throw new Error(`Failed to load artist details (${res.status})`);
        }
        const json = await res.json();
        if (mounted) setData(json);
      } catch (err) {
        if (mounted) setError(err.message || 'Error fetching artist details');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchArtist();
    return () => { mounted = false; };
  }, [browseId, artistName, retryCount]);

  const handlePlaySong = (song, idx) => {
    if (currentSong?.videoId === song.videoId || currentSong?.id === song.id) {
      togglePlay();
      return;
    }
    const queue = data?.topSongs || [song];
    loadSong(song, queue, idx);
  };

  const visibleSongs = expandedTopSongs
    ? (data?.topSongs || [])
    : (data?.topSongs || []).slice(0, 5);

  return (
    <div className="h-full w-full overflow-y-auto pt-16 md:pt-4 pb-28 md:pb-20 px-4 sm:px-8 space-y-8 scroll-smooth bg-[#0e0e0e] text-white no-scrollbar">
      {/* ── Top Bar Navigation ── */}
      <div className="flex items-center gap-4">
        <BackButton label="Back" />
        <span className="text-body-sm text-[#888888]">/ Artist Discography</span>
      </div>

      {/* ── Loading Skeleton ── */}
      {loading && (
        <div className="space-y-6 animate-pulse">
          <div className="h-64 rounded-3xl bg-[#0d0d0d] border border-[#222222] flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="space-y-3">
            <div className="h-6 w-40 bg-[#1a1a1a] rounded-md" />
            <div className="h-14 bg-[#111111] rounded-xl border border-[#1f1f1f]" />
            <div className="h-14 bg-[#111111] rounded-xl border border-[#1f1f1f]" />
            <div className="h-14 bg-[#111111] rounded-xl border border-[#1f1f1f]" />
          </div>
        </div>
      )}

      {/* ── Error Banner ── */}
      {error && !loading && (
        <div className="p-8 rounded-2xl bg-[#141414] border border-[#333333] text-center space-y-4 max-w-lg mx-auto my-12">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[28px]">error</span>
          </div>
          <div>
            <p className="text-body-lg text-white font-semibold">{error}</p>
            <p className="text-body-sm text-neutral-400 mt-1">Unable to retrieve artist information at this time.</p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setRetryCount((c) => c + 1)}
              className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-body-sm hover:bg-neutral-200 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Retry
            </button>
            <BackButton label="Return" className="px-4 py-2 rounded-xl bg-[#222222] text-white hover:bg-[#333333]" />
          </div>
        </div>
      )}

      {/* ── Artist Profile Content ── */}
      {data && !loading && (
        <>
          {/* Hero Banner */}
          <div className="relative rounded-3xl overflow-hidden bg-[#0a0a0a] border border-[#222222] p-6 sm:p-10 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
              <ImageWithFallback
                src={data.thumbnail}
                alt={data.name}
                icon="person"
                iconClassName="text-white/30 text-[64px]"
                className="w-36 h-36 sm:w-48 sm:h-48 aspect-square rounded-full overflow-hidden object-cover border-2 border-[#333333] shadow-2xl flex-shrink-0"
              />

              <div className="flex-1 text-center sm:text-left min-w-0 space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141414] border border-[#333333] text-[#888888] text-[11px] font-semibold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  Verified Artist
                </div>
                <h1 className="text-display-sm sm:text-display-md font-extrabold text-white tracking-tight truncate">
                  {data.name}
                </h1>
                {data.description && (
                  <p className="text-body-sm sm:text-body-md text-[#888888] line-clamp-3 max-w-2xl">
                    {data.description}
                  </p>
                )}

                {data.topSongs && data.topSongs.length > 0 && (
                  <div className="pt-2 flex items-center justify-center sm:justify-start gap-3">
                    <button
                      onClick={() => handlePlaySong(data.topSongs[0], 0)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-label-lg shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        play_arrow
                      </span>
                      Play Top Songs
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── 1. Top Songs (Expandable) ── */}
          {data.topSongs && data.topSongs.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-headline-sm font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-white text-[22px]">bar_chart</span>
                  Top Songs
                </h2>
                <span className="text-body-sm text-[#888888]">{data.topSongs.length} tracks available</span>
              </div>

              <div className="divide-y divide-[#1a1a1a] rounded-2xl bg-[#050505] border border-[#222222] overflow-hidden shadow-2xl">
                {visibleSongs.map((track, idx) => {
                  const isCurrent = currentSong?.videoId === track.videoId || currentSong?.id === track.id;
                  const liked = isLiked(track.id);

                  return (
                    <div
                      key={track.id || idx}
                      onClick={() => handlePlaySong(track, idx)}
                      className={`group flex items-center justify-between p-3.5 hover:bg-white/[0.04] transition-colors cursor-pointer ${
                        isCurrent ? 'bg-white/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-7 text-center text-label-md font-mono text-[#888888] flex-shrink-0 flex items-center justify-center">
                          {isCurrent && isPlaying ? (
                            <span className="material-symbols-outlined text-white text-[20px] animate-pulse">
                              volume_up
                            </span>
                          ) : (
                            <>
                              <span className="group-hover:hidden">{idx + 1}</span>
                              <span className="hidden group-hover:inline text-white material-symbols-outlined text-[20px]">
                                play_arrow
                              </span>
                            </>
                          )}
                        </div>

                        <ImageWithFallback
                          src={track.thumbnail || track.cover}
                          alt={track.title}
                          icon="music_note"
                          iconClassName="text-white/30 text-[20px]"
                          className="w-11 h-11 rounded-lg object-cover flex-shrink-0 shadow-sm border border-[#262626]"
                        />

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
                          <p className="text-label-sm text-[#888888] truncate">
                            <ArtistLinks
                              artists={track.artists}
                              artist={track.artist || data.name}
                              artistId={track.artistId || data.browseId}
                              className="hover:text-white"
                              linkClassName="hover:text-white hover:underline cursor-pointer"
                            />
                            {track.album && (
                              <>
                                {' • '}
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    routeToSongEntity(track);
                                  }}
                                  className="hover:text-white hover:underline cursor-pointer"
                                >
                                  {track.album}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons (Like + Add to playlist) */}
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(track);
                          }}
                          className={`p-1.5 rounded-full transition-transform active:scale-90 ${
                            liked ? 'text-white' : 'text-[#888888] hover:text-white'
                          }`}
                          title={liked ? 'Unlike' : 'Like'}
                        >
                          <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: `'FILL' ${liked ? 1 : 0}` }}>
                            favorite
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddMenuSong(track);
                          }}
                          className="p-1.5 rounded-full text-[#888888] hover:text-white transition-colors"
                          title="Add to playlist"
                        >
                          <span className="material-symbols-outlined text-[19px]">playlist_add</span>
                        </button>

                        {track.duration > 0 && (
                          <span className="text-label-sm font-mono text-[#888888] tabular-nums ml-2 hidden sm:inline">
                            {formatDuration(track.duration)}
                          </span>
                        )}
                        <span className="material-symbols-outlined text-[22px] text-[#666666] group-hover:text-white transition-colors ml-1">
                          play_circle
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {data.topSongs.length > 5 && (
                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    onClick={() => setExpandedTopSongs(!expandedTopSongs)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-transparent border border-[#333333] hover:border-white text-label-md font-medium text-white transition-colors cursor-pointer"
                  >
                    <span>{expandedTopSongs ? 'Show Less' : `Show All (${data.topSongs.length} Songs)`}</span>
                    <span className="material-symbols-outlined text-[18px]">
                      {expandedTopSongs ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ── 2. Albums ── */}
          {data.albums && data.albums.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-headline-sm font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-white text-[22px]">album</span>
                  Albums
                </h2>
                <span className="text-body-sm text-[#888888]">{data.albums.length} releases</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {data.albums.map((alb, i) => (
                  <div
                    key={alb.id || alb.browseId || i}
                    onClick={() => handleEntityClick(alb, { target: 'album' })}
                    className="group flex flex-col p-3 rounded-2xl bg-[#0a0a0a] border border-[#222222] hover:border-white transition-all duration-200 cursor-pointer shadow-lg"
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-neutral-900 border border-[#262626]">
                      <ImageWithFallback
                        src={alb.thumbnail}
                        alt={alb.title}
                        icon="album"
                        iconClassName="text-white/20 text-[40px]"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black shadow-lg">
                          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            play_arrow
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-label-md font-bold text-white truncate group-hover:underline transition-colors">
                      {alb.title}
                    </p>
                    <p className="text-label-sm text-[#888888] mt-0.5">{alb.year || 'Album'}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── 3. Singles & EPs ── */}
          {data.singles && data.singles.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-headline-sm font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-white text-[22px]">disc_full</span>
                  Singles & EPs
                </h2>
                <span className="text-body-sm text-[#888888]">{data.singles.length} releases</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {data.singles.map((single, i) => (
                  <div
                    key={single.id || single.browseId || i}
                    onClick={() => handleEntityClick(single, { target: 'album' })}
                    className="group flex flex-col p-3 rounded-2xl bg-[#0a0a0a] border border-[#222222] hover:border-white transition-all duration-200 cursor-pointer shadow-lg"
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-neutral-900 border border-[#262626]">
                      <ImageWithFallback
                        src={single.thumbnail}
                        alt={single.title}
                        icon="album"
                        iconClassName="text-white/20 text-[40px]"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black shadow-lg">
                          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            play_arrow
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-label-md font-bold text-white truncate group-hover:underline transition-colors">
                      {single.title}
                    </p>
                    <p className="text-label-sm text-[#888888] mt-0.5">{single.year || 'Single'}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── 4. Videos & Live Performances ── */}
          {data.videos && data.videos.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-headline-sm font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-white text-[22px]">smart_display</span>
                  Videos & Live Performances
                </h2>
                <span className="text-body-sm text-[#888888]">{data.videos.length} videos</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {data.videos.map((vid, i) => (
                  <div
                    key={vid.id || vid.videoId || i}
                    onClick={() => handleEntityClick(vid, { target: 'video' })}
                    className="group flex flex-col p-3 rounded-2xl bg-[#0a0a0a] border border-[#222222] hover:border-white transition-all duration-200 cursor-pointer shadow-lg"
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-neutral-900 border border-[#262626]">
                      <ImageWithFallback
                        src={vid.thumbnail}
                        alt={vid.title}
                        icon="smart_display"
                        iconClassName="text-white/20 text-[40px]"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black shadow-lg">
                          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            play_arrow
                          </span>
                        </div>
                      </div>
                      {vid.duration > 0 && (
                        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                          {formatDuration(vid.duration)}
                        </span>
                      )}
                    </div>

                    <p className="text-label-md font-bold text-white line-clamp-2 group-hover:underline transition-colors">
                      {vid.title}
                    </p>
                    {vid.views && <p className="text-label-sm text-[#888888] mt-1">{vid.views}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── 5. Playlists by Artist ── */}
          {data.playlists && data.playlists.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-headline-sm font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-white text-[22px]">featured_play_list</span>
                  Playlists by Artist
                </h2>
                <span className="text-body-sm text-[#888888]">{data.playlists.length} playlists</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {data.playlists.map((pl, i) => (
                  <div
                    key={pl.id || pl.browseId || i}
                    onClick={() => handleEntityClick(pl, { target: 'album' })}
                    className="group flex flex-col p-3 rounded-2xl bg-[#0a0a0a] border border-[#222222] hover:border-white transition-all duration-200 cursor-pointer shadow-lg"
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-neutral-900 border border-[#262626]">
                      <ImageWithFallback
                        src={pl.thumbnail}
                        alt={pl.title}
                        icon="queue_music"
                        iconClassName="text-white/20 text-[40px]"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black shadow-lg">
                          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            play_arrow
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-label-md font-bold text-white truncate group-hover:underline transition-colors">
                      {pl.title}
                    </p>
                    {pl.songCount && <p className="text-label-sm text-[#888888] mt-0.5">{pl.songCount}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── 6. Fans Might Also Like (Similar Artists) ── */}
          {data.similarArtists && data.similarArtists.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-headline-sm font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-white text-[22px]">group</span>
                  Fans Might Also Like
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {data.similarArtists.map((art, i) => (
                  <div
                    key={art.id || art.browseId || i}
                    onClick={() => routeToArtistEntity(art.name, art.id || art.browseId)}
                    className="group flex flex-col items-center text-center p-4 rounded-2xl bg-[#0a0a0a] border border-[#222222] hover:border-white transition-all duration-200 cursor-pointer shadow-lg"
                  >
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden mb-3 border border-[#333333] group-hover:border-white transition-colors shadow-md">
                      <ImageWithFallback
                        src={art.thumbnail}
                        alt={art.name}
                        icon="person"
                        iconClassName="text-white/30 text-[36px]"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <p className="text-label-md font-bold text-white truncate w-full group-hover:underline transition-colors">
                      {art.name}
                    </p>
                    <p className="text-label-sm text-[#888888] mt-0.5 truncate w-full">
                      {art.subscribers || 'Artist'}
                    </p>
                  </div>
                ))}
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
