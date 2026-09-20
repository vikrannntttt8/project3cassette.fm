import { usePlayer } from '../../context/PlayerContext.jsx';

/**
 * ArtistLinks: Renders individual, clickable links for each artist in a track.
 * Supports:
 * - Array of artist objects: [{ name: '...', id: '...', browseId: '...' }]
 * - Array of artist strings: ['Artist 1', 'Artist 2']
 * - Comma-separated string: "Artist 1, Artist 2, Artist 3"
 *
 * Each artist has e.stopPropagation() so clicks navigate to their profile
 * without triggering track playback or player dock expansion.
 */
export default function ArtistLinks({
  artists,
  artist,
  artistId,
  className = '',
  linkClassName = '',
  onClickArtist = null,
}) {
  const { routeToArtistEntity } = usePlayer();

  let list = [];

  if (Array.isArray(artists) && artists.length > 0) {
    list = artists.map((a) => {
      if (typeof a === 'string') {
        return { name: a.trim(), id: null };
      }
      return {
        name: (a.name || a.title || '').trim(),
        id: a.id || a.browseId || null,
      };
    }).filter((a) => a.name);
  } else if (typeof artist === 'string' && artist.trim()) {
    const parts = artist.split(/,\s*/);
    list = parts.map((name, i) => ({
      name: name.trim(),
      id: i === 0 ? artistId || null : null,
    })).filter((a) => a.name);
  }

  if (list.length === 0) {
    return <span className={className}>Unknown Artist</span>;
  }

  const handleClick = (e, a) => {
    e.stopPropagation();
    if (onClickArtist) {
      onClickArtist(a.name, a.id);
    } else {
      routeToArtistEntity(a.name, a.id);
    }
  };

  return (
    <span className={className}>
      {list.map((a, idx) => (
        <span key={idx}>
          <span
            onClick={(e) => handleClick(e, a)}
            className={`cursor-pointer hover:underline hover:text-white transition-colors ${linkClassName}`}
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
