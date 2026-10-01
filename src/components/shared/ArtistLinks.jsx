import { usePlayer } from '../../context/PlayerContext.jsx';

/**
 * ArtistLinks: Renders individual, clickable links for each artist in a track.
 * Supports:
 * - Array of artist objects: [{ name: '...', id: '...', browseId: '...' }]
 * - Array of artist strings: ['Artist 1', 'Artist 2']
 * - Comma-separated string: "Artist 1, Artist 2, Artist 3"
 *
 * On mobile (< 768px), by default disables pointer events so tapping the track row
 * triggers track playback rather than navigation.
 * On desktop (>= 768px), allows navigating directly to artist discography.
 */
export default function ArtistLinks({
  artists,
  artist,
  artistId,
  className = '',
  linkClassName = '',
  onClickArtist = null,
  allowMobileClick = false,
}) {
  const { routeToArtistEntity } = usePlayer();

  let list = [];

  if (Array.isArray(artists) && artists.length > 0) {
    list = artists.map((a) => {
      if (!a) return null;
      if (typeof a === 'string') {
        const trimmed = a.trim();
        return trimmed ? { name: trimmed, id: artistId || null } : null;
      }
      const name = (a.name || a.title || a.artist || '').trim();
      const id = a.id || a.browseId || a.artistId || a.channelId || a.author?.id || artistId || null;
      return name ? { name, id } : null;
    }).filter(Boolean);
  } else if (typeof artist === 'string' && artist.trim()) {
    const parts = artist.split(/,\s*/);
    list = parts.map((name, i) => ({
      name: name.trim(),
      id: i === 0 ? artistId || null : null,
    })).filter((a) => a.name);
  } else if (artist && typeof artist === 'object') {
    const name = (artist.name || artist.title || artist.artist || '').trim();
    const id = artist.id || artist.browseId || artist.artistId || artist.channelId || artist.author?.id || artistId || null;
    if (name) {
      list = [{ name, id }];
    }
  }

  if (list.length === 0) {
    return <span className={className}>Unknown Artist</span>;
  }

  const handleClick = (e, a) => {
    // Only process on desktop or if explicitly allowed
    if (typeof window !== 'undefined' && window.innerWidth < 768 && !allowMobileClick) {
      return;
    }
    e.stopPropagation();
    if (!a || (!a.name && !a.id)) {
      console.warn('[ArtistLinks] Guard triggered: missing artist data', a);
      return;
    }
    if (onClickArtist) {
      onClickArtist(a.name, a.id);
    } else {
      routeToArtistEntity(a.name, a.id);
    }
  };

  const mobilePointerClass = allowMobileClick ? 'pointer-events-auto' : 'pointer-events-none md:pointer-events-auto';

  return (
    <span className={`${className} ${mobilePointerClass}`}>
      {list.map((a, idx) => (
        <span key={idx}>
          <span
            onClick={(e) => handleClick(e, a)}
            className={`cursor-default md:cursor-pointer md:hover:underline md:hover:text-white transition-colors ${linkClassName}`}
            title={`View artist "${a.name}"`}
          >
            {a.name}
          </span>
          {idx < list.length - 1 && <span className="text-inherit">, </span>}
        </span>
      ))}
    </span>
  );
}
