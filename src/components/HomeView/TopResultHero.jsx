import ImageWithFallback from '../shared/ImageWithFallback.jsx';

/**
 * TopResultHero
 * Renders a prominent, high-confidence hero card at the top of the "All" search tab.
 * Promotes exact/closest Artist or Album matches above the raw song list.
 */
export default function TopResultHero({ entity, onPlay, onNavigate }) {
  if (!entity) return null;

  const isArtist = entity.type === 'artist';
  const isAlbum = entity.type === 'album';
  const isSong = !isArtist && !isAlbum;

  const badgeText = isArtist ? 'Verified Artist' : isAlbum ? 'Official Album' : 'Top Song Match';
  const badgeIcon = isArtist ? 'verified' : isAlbum ? 'album' : 'music_note';

  const actionLabel = isArtist ? 'View Discography' : isAlbum ? 'Play Album' : 'Play Track';
  const actionIcon = isArtist ? 'person' : 'play_arrow';

  return (
    <div
      onClick={onNavigate}
      className="group relative w-full rounded-2xl bg-[#0a0a0a] border border-[#262626] hover:border-white/40 p-5 sm:p-6 transition-all duration-300 shadow-2xl cursor-pointer overflow-hidden flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6"
    >
      {/* Entity Artwork / Avatar */}
      <div className="flex-shrink-0">
        <ImageWithFallback
          src={entity.thumbnail || entity.cover}
          alt={entity.name || entity.title}
          icon={isArtist ? 'person' : isAlbum ? 'album' : 'music_note'}
          iconClassName="text-white/30 text-[48px]"
          className={`w-28 h-28 sm:w-36 sm:h-36 aspect-square object-cover shadow-2xl transition-transform duration-500 group-hover:scale-105 border border-[#333333] ${
            isArtist ? 'rounded-full overflow-hidden' : 'rounded-2xl'
          }`}
        />
      </div>

      {/* Entity Details */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#161616] border border-[#333333] text-[#888888] text-[11px] font-semibold uppercase tracking-wider">
          <span className="material-symbols-outlined text-[14px] text-white">{badgeIcon}</span>
          <span>{badgeText}</span>
        </div>

        <h2 className="text-headline-md sm:text-headline-lg font-bold text-white tracking-tight truncate group-hover:underline">
          {entity.name || entity.title}
        </h2>

        <p className="text-body-sm text-[#888888] truncate">
          {isArtist && (entity.subscribers || 'Explore full albums, top tracks, and videos')}
          {isAlbum && `${entity.artist || 'Artist'} • ${entity.year || 'Album'}`}
          {isSong && `${entity.artist || 'Artist'} • ${entity.album || 'Single'}`}
        </p>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onPlay) onPlay(entity);
              else if (onNavigate) onNavigate();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-neutral-200 text-black font-semibold text-label-md transition-all shadow-lg active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {actionIcon}
            </span>
            <span>{actionLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
