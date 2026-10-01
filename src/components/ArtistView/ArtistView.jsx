import { useState, useEffect } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
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

  const { artistBanners = true, compactAlbums = false, compactArtists = false } = useSettings();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTopSongs, setExpandedTopSongs] = useState(false);
  const [addMenuSong, setAddMenuSong] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!browseId && !artistName) {
      setLoading(false);
      setError('No artist identifier provided');
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);
    setExpandedTopSongs(false);

    const fetchArtist = async () => {
      try {
        const targetId = browseId || artistName;
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
                id: targetId,
                browseId: targetId,
                name: query,
                thumbnail: tracks[0]?.thumbnail || tracks[0]?.cover || '',
                description: `Popular tracks and releases by ${query}`,
                topSongs: tracks.slice(0, 20),
                albums: [],
                singles: [],
                videos: [],
                playlists: [],
                similarArtists: [],
              };
              if (mounted) setData(fallbackData);
              return;
            }
          }
          throw new Error(`Failed to load artist details (${res.status})`);
        }

        const json = await res.json();
        
        // If the JSON itself contains an error message and has no songs or albums, attempt search fallback
        if (json?.error && (!json.topSongs?.length && !json.albums?.length)) {
          const query = artistName || json.name || targetId;
          const searchRes = await fetch(apiUrl(`/api/search?q=${encodeURIComponent(query)}`));
          if (searchRes.ok) {
            const tracks = await searchRes.json();
            if (Array.isArray(tracks) && tracks.length > 0) {
              const fallbackData = {
                id: targetId,
                browseId: targetId,
                name: query,
                thumbnail: tracks[0]?.thumbnail || tracks[0]?.cover || '',
                description: `Popular tracks and releases by ${query}`,
                topSongs: tracks.slice(0, 20),
                albums: [],
                singles: [],
                videos: [],
                playlists: [],
                similarArtists: [],
              };
              if (mounted) setData(fallbackData);
              return;
            }
          }
        }

        if (mounted) setData(json);
      } catch (err) {
        if (mounted) setError(err?.message || 'Error fetching artist details');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchArtist();
    return () => {
      mounted = false;
    };
  }, [browseId, artistName, retryCount]);

  const handlePlaySong = (song, idx = 0) => {
    if (!song) return;
    if (currentSong?.videoId === song.videoId || (song.id && currentSong?.id === song.id)) {
      togglePlay();
      return;
    }
    const topSongsList = Array.isArray(data?.topSongs) ? data.topSongs : [];
    const queue = topSongsList.length > 0 ? topSongsList : [song];
    loadSong(song, queue, idx);
  };

  // Safe data accessors
  const artistDisplayName =
    data?.name || data?.title || artistName || (typeof browseId === 'string' && !browseId.startsWith('UC') ? browseId : 'Artist');
  const artistThumbnail =
    data?.thumbnail ||
    data?.header?.thumbnails?.[0]?.url ||
    data?.header?.thumbnail ||
    data?.cover ||
    '';
  const artistDescription =
    data?.description ||
    (data?.subscribers ? `${data.subscribers} • Official YouTube Music Artist` : '');

  const topSongsList = Array.isArray(data?.topSongs) ? data.topSongs : [];
  const albumsList = Array.isArray(data?.albums) ? data.albums : [];
  const singlesList = Array.isArray(data?.singles) ? data.singles : [];
  const videosList = Array.isArray(data?.videos) ? data.videos : [];
  const playlistsList = Array.isArray(data?.playlists) ? data.playlists : [];
  const similarArtistsList = Array.isArray(data?.similarArtists) ? data.similarArtists : [];

  const visibleSongs = expandedTopSongs ? topSongsList : topSongsList.slice(0, 5);
  const hasAnyContent =
    topSongsList.length > 0 ||
    albumsList.length > 0 ||
    singlesList.length > 0 ||
    videosList.length > 0 ||
    playlistsList.length > 0 ||
    similarArtistsList.length > 0;

  return (
    <div className="h-full w-full overflow-y-auto pt-[calc(var(--mobile-header-h)+var(--safe-top))] md:pt-4 pb-[calc(var(--mobile-nav-h)+var(--safe-bottom)+6.5rem)] md:pb-20 px-4 sm:px-8 space-y-6 scroll-smooth bg-[#0e0e0e] text-white no-scrollbar">
      {/* ── Top Bar Navigation ── */}
      <div className="flex items-center gap-4">
        <BackButton label="Back" />
        <span className="text-body-sm text-[#888888]">/ Artist Discography</span>
      </div>

      {/* ── Loading Skeleton ── */}
      {loading && (
        <div className="space-y-8 animate-pulse">
          {/* Hero skeleton */}
          <div className="relative rounded-2xl bg-[#141416]/60 border border-white/5 p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6">
            <div className="w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-neutral-800/60 border border-white/5 flex-shrink-0" />
            <div className="flex-1 space-y-3 w-full text-center sm:text-left">
              <div className="h-4 w-28 bg-neutral-800/60 rounded-full mx-auto sm:mx-0" />
              <div className="h-8 sm:h-10 w-48 sm:w-72 bg-neutral-800/80 rounded-lg mx-auto sm:mx-0" />
              <div className="h-3.5 w-full max-w-md bg-neutral-800/40 rounded mx-auto sm:mx-0" />
              <div className="pt-2">
                <div className="h-10 w-36 bg-neutral-800/90 rounded-full mx-auto sm:mx-0" />
              </div>
            </div>
          </div>

          {/* Top songs skeleton */}
          <div className="space-y-3">
            <div className="h-6 w-32 bg-neutral-800/60 rounded-md" />
            <div className="rounded-xl bg-[#141416]/40 border border-white/5 divide-y divide-white/5 overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 min-h-[48px]">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-6 h-4 bg-neutral-800/40 rounded" />
                    <div className="w-10 h-10 rounded-lg bg-neutral-800/60 flex-shrink-0" />
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="h-4 w-44 bg-neutral-800/70 rounded" />
                      <div className="h-3 w-28 bg-neutral-800/40 rounded" />
                    </div>
                  </div>
                  <div className="w-12 h-4 bg-neutral-800/40 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Albums grid skeleton */}
          <div className="space-y-3">
            <div className="h-6 w-24 bg-neutral-800/60 rounded-md" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-3 rounded-2xl bg-[#141416]/40 border border-white/5 space-y-3">
                  <div className="aspect-square rounded-xl bg-neutral-800/60 w-full" />
                  <div className="h-4 w-3/4 bg-neutral-800/70 rounded" />
                  <div className="h-3 w-1/2 bg-neutral-800/40 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Error Banner ── */}
      {error && !loading && (
        <div className="p-8 rounded-2xl bg-[#141416] border border-white/10 text-center space-y-4 max-w-lg mx-auto my-12 shadow-2xl">
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
              className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-body-sm hover:bg-neutral-200 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Retry
            </button>
            <BackButton label="Return" className="px-4 py-2 rounded-xl bg-neutral-800 text-white hover:bg-neutral-700" />
          </div>
        </div>
      )}

      {/* ── Artist Profile Content ── */}
      {data && !loading && (
        <>
          {/* Hero Banner */}
          {artistBanners ? (
            <div className="relative rounded-2xl overflow-hidden bg-[#0a0a0a] border border-[#222222] p-4 sm:p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
                <ImageWithFallback
                  src={artistThumbnail}
                  alt={artistDisplayName}
                  icon="person"
                  iconClassName="text-white/30 text-[48px]"
                  className="w-28 h-28 sm:w-40 sm:h-40 aspect-square rounded-full overflow-hidden object-cover border-2 border-[#333333] shadow-xl flex-shrink-0"
                />

                <div className="flex-1 text-center sm:text-left min-w-0 space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#141414] border border-[#333333] text-[#888888] text-[10.5px] font-semibold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[13px]">verified</span>
                    Verified Artist
                  </div>
                  <h1 className="text-headline-md sm:text-headline-lg font-extrabold text-white tracking-tight truncate">
                    {artistDisplayName}
                  </h1>
                  {artistDescription && (
                    <p className="text-body-xs text-[#888888] line-clamp-2 max-w-2xl">
                      {artistDescription}
                    </p>
                  )}

                  {topSongsList.length > 0 && (
                    <div className="pt-1.5 flex items-center justify-center sm:justify-start gap-3">
                      <button
                        type="button"
                        onClick={() => handlePlaySong(topSongsList[0], 0)}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white hover:bg-neutral-200 text-black font-bold text-label-md shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          play_arrow
                        </span>
                        Play Top Songs
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#101012] border border-white/5">
              <div className="flex items-center gap-3.5 min-w-0">
                <ImageWithFallback
                  src={artistThumbnail}
                  alt={artistDisplayName}
                  icon="person"
                  iconClassName="text-white/30 text-[24px]"
                  className="w-12 h-12 rounded-full object-cover border border-white/10 flex-shrink-0"
                />
                <div className="min-w-0">
                  <h1 className="text-headline-sm font-bold text-white tracking-tight truncate">
                    {artistDisplayName}
                  </h1>
                  <p className="text-body-xs text-neutral-400 truncate">
                    {topSongsList.length} top songs · {albumsList.length} albums
                  </p>
                </div>
              </div>
              {topSongsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => handlePlaySong(topSongsList[0], 0)}
                  className="px-4 py-1.5 rounded-full bg-white text-black font-bold text-label-sm hover:bg-neutral-200 transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    play_arrow
                  </span>
                  Play
                </button>
              )}
            </div>
          )}

          {/* ── 1. Top Songs (Expandable) ── */}
          {topSongsList.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-label-md font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-white text-[18px]">bar_chart</span>
                  Top Songs
                </h2>
                <span className="text-label-xs text-[#888888]">{topSongsList.length} tracks</span>
              </div>

              <div className="divide-y divide-[#1a1a1a] rounded-xl bg-[#050505] border border-[#222222] overflow-hidden shadow-xl">
                {visibleSongs.map((track, idx) => {
                  if (!track) return null;
                  const trackId = track.id || track.videoId || idx;
                  const isCurrent = currentSong?.videoId === track.videoId || (track.id && currentSong?.id === track.id);
                  const liked = isLiked(track.id || track.videoId);
                  const trackTitle = track.title || 'Unknown Title';
                  const trackArtist = track.artist || artistDisplayName;

                  return (
                    <div
                      key={trackId}
                      onClick={() => handlePlaySong(track, idx)}
                      className={`group flex items-center justify-between px-3 py-2 hover:bg-white/[0.04] transition-colors cursor-pointer min-h-[46px] ${
                        isCurrent ? 'bg-white/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-6 text-center text-label-sm font-mono text-[#888888] flex-shrink-0 flex items-center justify-center">
                          {isCurrent && isPlaying ? (
                            <span className="material-symbols-outlined text-white text-[18px] animate-pulse">
                              volume_up
                            </span>
                          ) : (
                            <>
                              <span className="group-hover:hidden">{idx + 1}</span>
                              <span className="hidden group-hover:inline text-white material-symbols-outlined text-[18px]">
                                play_arrow
                              </span>
                            </>
                          )}
                        </div>

                        <ImageWithFallback
                          src={track.thumbnail || track.cover}
                          alt={trackTitle}
                          icon="music_note"
                          iconClassName="text-white/30 text-[18px]"
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 shadow-sm border border-[#262626]"
                        />

                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p
                            onClick={(e) => {
                              e.stopPropagation();
                              routeToSongEntity(track);
                            }}
                            className={`text-label-md font-medium truncate whitespace-nowrap overflow-hidden text-ellipsis transition-colors hover:underline cursor-pointer leading-tight ${
                              isCurrent ? 'text-white font-bold' : 'text-white'
                            }`}
                            title={`View "${trackTitle}"`}
                          >
                            {trackTitle}
                          </p>
                          <p className="text-label-sm text-[#888888] truncate whitespace-nowrap overflow-hidden text-ellipsis">
                            <ArtistLinks
                              artists={track.artists}
                              artist={trackArtist}
                              artistId={track.artistId || data?.browseId || data?.id}
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
                          className="p-1.5 rounded-full text-[#888888] hover:text-white transition-colors cursor-pointer"
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

              {topSongsList.length > 5 && (
                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    onClick={() => setExpandedTopSongs(!expandedTopSongs)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-transparent border border-[#333333] hover:border-white text-label-md font-medium text-white transition-colors cursor-pointer"
                  >
                    <span>{expandedTopSongs ? 'Show Less' : `Show All (${topSongsList.length} Songs)`}</span>
                    <span className="material-symbols-outlined text-[18px]">
                      {expandedTopSongs ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ── 2. Albums ── */}
          {albumsList.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-headline-sm font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-white text-[22px]">album</span>
                  Albums
                </h2>
                <span className="text-body-sm text-[#888888]">{albumsList.length} releases</span>
              </div>

              {compactAlbums ? (
                <div className="flex flex-col gap-2">
                  {albumsList.map((alb, i) => {
                    if (!alb) return null;
                    const albumTitle = alb.title || 'Unknown Album';
                    const albumThumb = alb.thumbnail || alb.cover || '';
                    return (
                      <div
                        key={alb.id || alb.browseId || i}
                        onClick={() => handleEntityClick(alb, { target: 'album' })}
                        className="flex items-center gap-3.5 p-2.5 rounded-xl bg-[#0e0e10] hover:bg-[#151518] border border-white/5 hover:border-white/20 transition-all cursor-pointer group"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-900 flex-shrink-0">
                          <ImageWithFallback
                            src={albumThumb}
                            alt={albumTitle}
                            icon="album"
                            iconClassName="text-white/20 text-[20px]"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-label-md font-semibold text-white truncate group-hover:text-neutral-200">
                            {albumTitle}
                          </p>
                          <p className="text-body-xs text-[#888888]">{alb.year || 'Album'}</p>
                        </div>
                        <span className="material-symbols-outlined text-neutral-500 group-hover:text-white text-[20px] pr-2">
                          chevron_right
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {albumsList.map((alb, i) => {
                    if (!alb) return null;
                    const albumTitle = alb.title || 'Unknown Album';
                    const albumThumb = alb.thumbnail || alb.cover || '';
                    return (
                      <div
                        key={alb.id || alb.browseId || i}
                        onClick={() => handleEntityClick(alb, { target: 'album' })}
                        className="group flex flex-col p-3 rounded-2xl bg-[#0a0a0a] border border-[#222222] hover:border-white transition-all duration-200 cursor-pointer shadow-lg"
                      >
                        <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-neutral-900 border border-[#262626]">
                          <ImageWithFallback
                            src={albumThumb}
                            alt={albumTitle}
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
                          {albumTitle}
                        </p>
                        <p className="text-label-sm text-[#888888] mt-0.5">{alb.year || 'Album'}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ── 3. Singles & EPs ── */}
          {singlesList.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-headline-sm font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-white text-[22px]">disc_full</span>
                  Singles & EPs
                </h2>
                <span className="text-body-sm text-[#888888]">{singlesList.length} releases</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {singlesList.map((single, i) => {
                  if (!single) return null;
                  const singleTitle = single.title || 'Unknown Single';
                  const singleThumb = single.thumbnail || single.cover || '';
                  return (
                    <div
                      key={single.id || single.browseId || i}
                      onClick={() => handleEntityClick(single, { target: 'album' })}
                      className="group flex flex-col p-3 rounded-2xl bg-[#0a0a0a] border border-[#222222] hover:border-white transition-all duration-200 cursor-pointer shadow-lg"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-neutral-900 border border-[#262626]">
                        <ImageWithFallback
                          src={singleThumb}
                          alt={singleTitle}
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
                        {singleTitle}
                      </p>
                      <p className="text-label-sm text-[#888888] mt-0.5">{single.year || 'Single'}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── 4. Videos & Live Performances ── */}
          {videosList.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-headline-sm font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-white text-[22px]">smart_display</span>
                  Videos & Live Performances
                </h2>
                <span className="text-body-sm text-[#888888]">{videosList.length} videos</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {videosList.map((vid, i) => {
                  if (!vid) return null;
                  const vidTitle = vid.title || 'Music Video';
                  const vidThumb = vid.thumbnail || vid.cover || '';
                  return (
                    <div
                      key={vid.id || vid.videoId || i}
                      onClick={() => handleEntityClick(vid, { target: 'video' })}
                      className="group flex flex-col p-3 rounded-2xl bg-[#0a0a0a] border border-[#222222] hover:border-white transition-all duration-200 cursor-pointer shadow-lg"
                    >
                      <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-neutral-900 border border-[#262626]">
                        <ImageWithFallback
                          src={vidThumb}
                          alt={vidTitle}
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
                        {vidTitle}
                      </p>
                      {vid.views && <p className="text-label-sm text-[#888888] mt-1">{vid.views}</p>}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── 5. Playlists by Artist ── */}
          {playlistsList.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-headline-sm font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-white text-[22px]">featured_play_list</span>
                  Playlists by Artist
                </h2>
                <span className="text-body-sm text-[#888888]">{playlistsList.length} playlists</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {playlistsList.map((pl, i) => {
                  if (!pl) return null;
                  const plTitle = pl.title || 'Playlist';
                  const plThumb = pl.thumbnail || pl.cover || '';
                  return (
                    <div
                      key={pl.id || pl.browseId || i}
                      onClick={() => handleEntityClick(pl, { target: 'album' })}
                      className="group flex flex-col p-3 rounded-2xl bg-[#0a0a0a] border border-[#222222] hover:border-white transition-all duration-200 cursor-pointer shadow-lg"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-neutral-900 border border-[#262626]">
                        <ImageWithFallback
                          src={plThumb}
                          alt={plTitle}
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
                        {plTitle}
                      </p>
                      {pl.songCount && <p className="text-label-sm text-[#888888] mt-0.5">{pl.songCount}</p>}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── 6. Fans Might Also Like (Similar Artists) ── */}
          {similarArtistsList.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-headline-sm font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-white text-[22px]">group</span>
                  Fans Might Also Like
                </h2>
              </div>

              {compactArtists ? (
                <div className="flex flex-col gap-2">
                  {similarArtistsList.map((art, i) => {
                    if (!art) return null;
                    const artName = art.name || art.title || 'Similar Artist';
                    const artThumb = art.thumbnail || art.cover || '';
                    const artId = art.id || art.browseId || null;
                    return (
                      <div
                        key={artId || i}
                        onClick={() => routeToArtistEntity(artName, artId)}
                        className="flex items-center gap-3.5 p-2.5 rounded-xl bg-[#0e0e10] hover:bg-[#151518] border border-white/5 hover:border-white/20 transition-all cursor-pointer group"
                      >
                        <div className="w-11 h-11 rounded-full overflow-hidden bg-neutral-900 border border-white/10 flex-shrink-0">
                          <ImageWithFallback
                            src={artThumb}
                            alt={artName}
                            icon="person"
                            iconClassName="text-white/30 text-[20px]"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-label-md font-semibold text-white truncate group-hover:text-neutral-200">
                            {artName}
                          </p>
                          <p className="text-body-xs text-[#888888]">{art.subscribers || 'Artist'}</p>
                        </div>
                        <span className="material-symbols-outlined text-neutral-500 group-hover:text-white text-[20px] pr-2">
                          chevron_right
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {similarArtistsList.map((art, i) => {
                    if (!art) return null;
                    const artName = art.name || art.title || 'Similar Artist';
                    const artThumb = art.thumbnail || art.cover || '';
                    const artId = art.id || art.browseId || null;
                    return (
                      <div
                        key={artId || i}
                        onClick={() => routeToArtistEntity(artName, artId)}
                        className="group flex flex-col items-center text-center p-4 rounded-2xl bg-[#0a0a0a] border border-[#222222] hover:border-white transition-all duration-200 cursor-pointer shadow-lg"
                      >
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden mb-3 border border-[#333333] group-hover:border-white transition-colors shadow-md">
                          <ImageWithFallback
                            src={artThumb}
                            alt={artName}
                            icon="person"
                            iconClassName="text-white/30 text-[36px]"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        <p className="text-label-md font-bold text-white truncate w-full group-hover:underline transition-colors">
                          {artName}
                        </p>
                        <p className="text-label-sm text-[#888888] mt-0.5 truncate w-full">
                          {art.subscribers || 'Artist'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ── Fallback empty discography state ── */}
          {!hasAnyContent && (
            <div className="p-8 rounded-2xl bg-[#141414] border border-[#333333] text-center space-y-3 max-w-lg mx-auto my-8">
              <span className="material-symbols-outlined text-[36px] text-neutral-500">queue_music</span>
              <h3 className="text-label-lg font-bold text-white">No tracks or albums found</h3>
              <p className="text-body-sm text-neutral-400">
                We could not find any releases for {artistDisplayName}.
              </p>
              <div className="pt-2">
                <BackButton label="Back to Discover" className="px-4 py-2 rounded-xl bg-white text-black font-semibold" />
              </div>
            </div>
          )}
        </>
      )}

      {addMenuSong && (
        <AddToPlaylistMenu song={addMenuSong} onClose={() => setAddMenuSong(null)} />
      )}
    </div>
  );
}
