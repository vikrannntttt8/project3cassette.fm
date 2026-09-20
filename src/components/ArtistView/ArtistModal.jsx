import { useState, useEffect } from 'react';
import { formatDuration } from '../../utils/timeFormat.js';
import ImageWithFallback from '../shared/ImageWithFallback.jsx';

/**
 * ArtistModal — Dedicated artist view with discography, top songs, and albums
 */
export default function ArtistModal({ artistId, artistName, onClose, onSelectTrack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!artistId && !artistName) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    const fetchArtist = async () => {
      try {
        let targetId = artistId || artistName;
        if (!targetId) {
          throw new Error('Artist ID not found');
        }

        const res = await fetch(`/api/artist/${encodeURIComponent(targetId)}`);
        if (!res.ok) {
          const query = artistName || targetId;
          const searchRes = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          if (searchRes.ok) {
            const tracks = await searchRes.json();
            if (Array.isArray(tracks) && tracks.length > 0) {
              const fallbackData = {
                name: query,
                thumbnail: tracks[0]?.thumbnail || '',
                description: `Songs by ${query}`,
                topSongs: tracks.slice(0, 15),
                albums: [],
                singles: [],
              };
              if (mounted) setData(fallbackData);
              return;
            }
          }
          throw new Error(`Failed to load artist (${res.status})`);
        }
        const json = await res.json();
        if (mounted) setData(json);
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchArtist();
    return () => { mounted = false; };
  }, [artistId, artistName]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-[#0a0a0a] border border-[#222222] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative h-44 sm:h-52 bg-[#121212] border-b border-[#222222] p-6 flex flex-col justify-end">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-neutral-400 hover:text-white hover:bg-black/80 transition-colors border border-white/10"
            title="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          <div className="flex items-end gap-4">
            <ImageWithFallback
              src={data?.thumbnail}
              alt={data?.name || ''}
              icon="person"
              iconClassName="text-white/40 text-[36px]"
              className="w-20 h-20 sm:w-24 sm:h-24 aspect-square rounded-full overflow-hidden object-cover border-2 border-white/20 shadow-lg flex-shrink-0"
            />
            <div className="min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Artist Discography</span>
              <h2 className="text-headline-md font-bold text-white truncate">
                {data?.name || artistName || 'Loading Artist...'}
              </h2>
              {data?.description && (
                <p className="text-body-sm text-neutral-400 line-clamp-2 mt-1">{data.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-[#0a0a0a]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <p className="text-body-md text-neutral-400">Loading discography...</p>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-8">
              <p className="text-body-md text-neutral-300">{error}</p>
            </div>
          )}

          {data && !loading && (
            <>
              {/* Top Songs */}
              {data.topSongs && data.topSongs.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-label-lg font-bold text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-white text-[18px]">music_note</span>
                      Top Releases & Songs
                    </h3>
                  </div>
                  <div className="divide-y divide-[#1e1e1e] rounded-xl bg-[#111111] border border-[#222222] overflow-hidden">
                    {data.topSongs.map((track, idx) => (
                      <div
                        key={track.id || idx}
                        onClick={() => onSelectTrack?.(track)}
                        className="group flex items-center gap-3 p-3 hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <span className="w-5 text-center text-label-sm font-mono text-neutral-400 group-hover:hidden">
                          {idx + 1}
                        </span>
                        <span className="w-5 text-center hidden group-hover:inline text-white material-symbols-outlined text-[18px]">
                          play_arrow
                        </span>
                        <ImageWithFallback
                          src={track.thumbnail || track.cover}
                          alt={track.title}
                          icon="music_note"
                          iconClassName="text-white/30 text-[18px]"
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-label-md font-medium text-white truncate group-hover:text-neutral-300 transition-colors">
                            {track.title}
                          </p>
                          <p className="text-label-sm text-neutral-400 truncate">{track.artist}</p>
                        </div>
                        {track.duration > 0 && (
                          <span className="text-label-sm font-mono text-neutral-400 tabular-nums">
                            {formatDuration(track.duration)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Albums */}
              {data.albums && data.albums.length > 0 && (
                <div>
                  <h3 className="text-label-lg font-bold text-white flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-white text-[18px]">album</span>
                    Albums
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {data.albums.map((alb, i) => (
                      <div
                        key={alb.id || i}
                        className="p-3 rounded-xl bg-[#111111] border border-[#222222] hover:border-white/30 transition-colors"
                      >
                        <ImageWithFallback
                          src={alb.thumbnail}
                          alt={alb.title}
                          icon="album"
                          iconClassName="text-white/20 text-[28px]"
                          className="w-full aspect-square rounded-lg object-cover mb-2"
                        />
                        <p className="text-label-md font-semibold text-white truncate">{alb.title}</p>
                        <p className="text-label-sm text-neutral-400">{alb.year || 'Album'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Singles & EPs */}
              {data.singles && data.singles.length > 0 && (
                <div>
                  <h3 className="text-label-lg font-bold text-white flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-white text-[18px]">disc_full</span>
                    Singles & EPs
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {data.singles.map((single, i) => (
                      <div
                        key={single.id || i}
                        className="p-3 rounded-xl bg-[#111111] border border-[#222222] hover:border-white/30 transition-colors"
                      >
                        <ImageWithFallback
                          src={single.thumbnail}
                          alt={single.title}
                          icon="album"
                          iconClassName="text-white/20 text-[28px]"
                          className="w-full aspect-square rounded-lg object-cover mb-2"
                        />
                        <p className="text-label-md font-semibold text-white truncate">{single.title}</p>
                        <p className="text-label-sm text-neutral-400">{single.year || 'Single'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos & Live Performances */}
              {data.videos && data.videos.length > 0 && (
                <div>
                  <h3 className="text-label-lg font-bold text-white flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-white text-[18px]">smart_display</span>
                    Videos & Live
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.videos.map((vid, i) => (
                      <div
                        key={vid.id || i}
                        onClick={() => onSelectTrack?.({
                          id: vid.videoId || vid.id,
                          videoId: vid.videoId || vid.id,
                          title: vid.title,
                          artist: data.name,
                          thumbnail: vid.thumbnail,
                          cover: vid.cover || vid.thumbnail,
                          duration: vid.duration,
                          type: 'song',
                        })}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
                          <ImageWithFallback
                            src={vid.thumbnail}
                            alt={vid.title}
                            icon="smart_display"
                            iconClassName="text-white/20 text-[28px]"
                            className="w-full h-full object-cover"
                          />
                          {vid.duration > 0 && (
                            <span className="absolute bottom-1.5 right-1.5 px-1 py-0.5 rounded bg-black/80 text-[10px] text-white">
                              {formatDuration(vid.duration)}
                            </span>
                          )}
                        </div>
                        <p className="text-label-md font-semibold text-white truncate">{vid.title}</p>
                        {vid.views && <p className="text-label-sm text-outline">{vid.views}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
