import { useState, useEffect } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';
import SongRow from '../HomeView/SongRow.jsx';
import AddToPlaylistMenu from '../shared/AddToPlaylistMenu.jsx';

export default function LibraryView({ initialSection = 'playlists' }) {
  const {
    playlists, liked, customAlbums = [],
    createPlaylist, deletePlaylist, renamePlaylist,
    removeFromPlaylist,
    createAlbum, deleteAlbum, renameAlbum, removeFromAlbum,
    loadSong, playCollection, currentSong, isPlaying,
  } = usePlayer();

  const [activeSection, setActiveSection]   = useState(initialSection);
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [activeAlbum, setActiveAlbum]       = useState(null);

  // Forms
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [creatingAlbum, setCreatingAlbum]       = useState(false);
  const [newAlbumTitle, setNewAlbumTitle]       = useState('');
  const [newAlbumArtist, setNewAlbumArtist]     = useState('');

  const [addMenuSong, setAddMenuSong] = useState(null);

  // Sync if prop changes
  useEffect(() => {
    setActiveSection(initialSection);
    setActivePlaylist(null);
    setActiveAlbum(null);
  }, [initialSection]);

  const handleCreatePlaylist = () => {
    if (!newPlaylistTitle.trim()) return;
    createPlaylist(newPlaylistTitle.trim());
    setNewPlaylistTitle('');
    setCreatingPlaylist(false);
  };

  const handleCreateAlbum = () => {
    if (!newAlbumTitle.trim()) return;
    createAlbum(newAlbumTitle.trim(), newAlbumArtist.trim() || 'Custom Collection');
    setNewAlbumTitle('');
    setNewAlbumArtist('');
    setCreatingAlbum(false);
  };

  const pl = activePlaylist
    ? playlists.find(p => p.id === activePlaylist)
    : null;

  const alb = activeAlbum
    ? customAlbums.find(a => a.id === activeAlbum)
    : null;

  const currentItem = pl || alb;

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 px-4 sm:px-6 md:px-8 pl-14 md:pl-8 py-4 bg-[#09090B]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4">
          {(activePlaylist || activeAlbum) && (
            <button
              onClick={() => { setActivePlaylist(null); setActiveAlbum(null); }}
              className="text-on-surface-variant hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-white/5 -ml-1"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
          )}
          <div className="flex flex-col">
            <span className="text-label-sm uppercase tracking-widest text-on-surface-variant">
              {currentItem ? (pl ? 'Playlist' : 'Custom Album') : 'Collection'}
            </span>
            <h1 className="text-headline-md sm:text-headline-lg font-bold text-white tracking-tight truncate">
              {currentItem ? currentItem.title : 'My Library'}
            </h1>
          </div>
        </div>

        {!activePlaylist && !activeAlbum && (
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveSection('playlists')}
              className={`px-4 py-2 rounded-full text-label-md font-medium transition-all whitespace-nowrap min-h-[40px] ${
                activeSection === 'playlists'
                  ? 'bg-white text-black'
                  : 'bg-white/8 text-on-surface-variant hover:bg-white/12 hover:text-white'
              }`}
            >
              Playlists ({playlists.length})
            </button>

            <button
              onClick={() => setActiveSection('liked')}
              className={`px-4 py-2 rounded-full text-label-md font-medium transition-all flex items-center gap-1.5 whitespace-nowrap min-h-[40px] ${
                activeSection === 'liked'
                  ? 'bg-white text-black font-semibold'
                  : 'bg-white/8 text-on-surface-variant hover:bg-white/12 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings:"'FILL' 1"}}>favorite</span>
              <span>Liked ({liked.length})</span>
            </button>

            <button
              onClick={() => setActiveSection('albums')}
              className={`px-4 py-2 rounded-full text-label-md font-medium transition-all whitespace-nowrap min-h-[40px] ${
                activeSection === 'albums'
                  ? 'bg-white text-black'
                  : 'bg-white/8 text-on-surface-variant hover:bg-white/12 hover:text-white'
              }`}
            >
              Custom Albums ({customAlbums.length})
            </button>
          </div>
        )}
      </header>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 pb-36">
        {/* Detail view for Playlist */}
        {activePlaylist && pl && (
          <CollectionDetail
            item={pl}
            type="playlist"
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlaySong={(song, idx) => loadSong(song, pl.songs, idx)}
            onRemoveSong={(songId) => removeFromPlaylist(pl.id, songId)}
            onDelete={() => { deletePlaylist(pl.id); setActivePlaylist(null); }}
            onRename={(title) => renamePlaylist(pl.id, title)}
            onPlayAll={() => playCollection(pl.songs, 0)}
            onAddToPlaylist={setAddMenuSong}
          />
        )}

        {/* Detail view for Custom Album */}
        {activeAlbum && alb && (
          <CollectionDetail
            item={alb}
            type="album"
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlaySong={(song, idx) => loadSong(song, alb.songs, idx)}
            onRemoveSong={(songId) => removeFromAlbum(alb.id, songId)}
            onDelete={() => { deleteAlbum(alb.id); setActiveAlbum(null); }}
            onRename={(title, artist) => renameAlbum(alb.id, title, artist)}
            onPlayAll={() => playCollection(alb.songs, 0)}
            onAddToPlaylist={setAddMenuSong}
          />
        )}

        {/* ── Playlists Section ──────────────────────────────── */}
        {!activePlaylist && !activeAlbum && activeSection === 'playlists' && (
          <div className="flex flex-col gap-6">
            {creatingPlaylist ? (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#111111] border border-white/10">
                <span className="material-symbols-outlined text-white text-[22px]">queue_music</span>
                <input
                  autoFocus
                  value={newPlaylistTitle}
                  onChange={e => setNewPlaylistTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreatePlaylist()}
                  placeholder="Playlist name…"
                  className="flex-1 bg-transparent border-none outline-none text-white text-body-lg placeholder:text-outline"
                />
                <button
                  onClick={handleCreatePlaylist}
                  className="px-4 py-1.5 rounded-full bg-white text-black text-label-md font-semibold hover:bg-white/90 transition-colors"
                >
                  Create
                </button>
                <button onClick={() => setCreatingPlaylist(false)} className="text-on-surface-variant hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreatingPlaylist(true)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0a0a0a] border border-dashed border-white/20 hover:border-white/50 transition-all group min-h-[48px]"
              >
                <span className="material-symbols-outlined text-[22px] text-white">add_circle</span>
                <span className="text-body-lg text-on-surface-variant group-hover:text-white transition-colors">Create New Playlist</span>
              </button>
            )}

            {playlists.length === 0 && !creatingPlaylist && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <span className="material-symbols-outlined text-[56px] text-white/10">library_music</span>
                <p className="text-headline-sm text-on-surface-variant">No playlists created yet</p>
                <p className="text-body-md text-outline">Click create above or save songs with the + button</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {playlists.map(p => (
                <button
                  key={p.id}
                  onClick={() => setActivePlaylist(p.id)}
                  className="group flex flex-col gap-2 rounded-xl p-3 bg-[#0e0e0e] border border-[#222222] hover:border-white/30 transition-all text-left"
                >
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-white/5">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-white/15 text-[40px]">queue_music</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
                        <span className="material-symbols-outlined text-black text-[20px]" style={{fontVariationSettings:"'FILL' 1"}}>play_arrow</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-label-lg font-semibold text-white truncate group-hover:text-neutral-300 transition-colors">{p.title}</p>
                    <p className="text-body-sm text-on-surface-variant">{p.songs.length} tracks</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Liked Songs Section ────────────────────────────── */}
        {!activePlaylist && !activeAlbum && activeSection === 'liked' && (
          <div className="flex flex-col gap-4">
            {liked.length > 0 && (
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-body-md text-on-surface-variant font-medium">
                  {liked.length} {liked.length === 1 ? 'song' : 'songs'} saved
                </span>
                <button
                  onClick={() => playCollection(liked, 0)}
                  className="flex items-center gap-2 px-5 py-2 rounded-full bg-white text-black font-semibold text-label-md hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                  <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings:"'FILL' 1"}}>play_arrow</span>
                  Play All Liked
                </button>
              </div>
            )}

            {liked.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <span className="material-symbols-outlined text-[56px] text-white/20">favorite_border</span>
                <p className="text-headline-sm text-on-surface-variant">No liked songs yet</p>
                <p className="text-body-md text-outline">Hit the heart icon on any song, card, or player bar to save it here</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {liked.map((song, i) => {
                  const sId = song.id || song.videoId;
                  const curId = currentSong?.id || currentSong?.videoId;
                  return (
                    <SongRow
                      key={sId || i}
                      song={song}
                      index={i}
                      isActive={Boolean(sId && curId && sId === curId)}
                      isPlaying={Boolean(sId && curId && sId === curId && isPlaying)}
                      onPlay={() => loadSong(song, liked, i)}
                      onAddToPlaylist={() => setAddMenuSong(song)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Custom Albums Section ──────────────────────────── */}
        {!activePlaylist && !activeAlbum && activeSection === 'albums' && (
          <div className="flex flex-col gap-6">
            {creatingAlbum ? (
              <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[#111111] border border-white/10 max-w-md">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-white text-[22px]">album</span>
                  <span className="text-headline-sm font-semibold text-white">Create Custom Album</span>
                </div>
                <input
                  autoFocus
                  value={newAlbumTitle}
                  onChange={e => setNewAlbumTitle(e.target.value)}
                  placeholder="Album title…"
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-body-md outline-none focus:border-white/40"
                />
                <input
                  value={newAlbumArtist}
                  onChange={e => setNewAlbumArtist(e.target.value)}
                  placeholder="Curator / Artist name…"
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-body-md outline-none focus:border-white/40"
                />
                <div className="flex items-center gap-2 justify-end mt-1">
                  <button
                    onClick={() => setCreatingAlbum(false)}
                    className="px-4 py-1.5 rounded-lg text-on-surface-variant hover:text-white transition-colors text-label-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateAlbum}
                    className="px-4 py-1.5 rounded-lg bg-white text-black font-semibold text-label-md hover:bg-white/90 transition-colors"
                  >
                    Create Album
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCreatingAlbum(true)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0a0a0a] border border-dashed border-white/20 hover:border-white/50 transition-all group"
              >
                <span className="material-symbols-outlined text-[22px] text-white">add_circle</span>
                <span className="text-body-lg text-on-surface-variant group-hover:text-white transition-colors">Create Custom Album</span>
              </button>
            )}

            {customAlbums.length === 0 && !creatingAlbum && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <span className="material-symbols-outlined text-[56px] text-white/10">album</span>
                <p className="text-headline-sm text-on-surface-variant">No custom albums yet</p>
                <p className="text-body-md text-outline">Group playlists and tracks into your personalized albums</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {customAlbums.map(a => (
                <button
                  key={a.id}
                  onClick={() => setActiveAlbum(a.id)}
                  className="group flex flex-col gap-2 rounded-xl p-3 bg-[#0e0e0e] border border-[#222222] hover:border-white/30 transition-all text-left"
                >
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-white/5">
                    {a.thumbnail ? (
                      <img src={a.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#181818]">
                        <span className="material-symbols-outlined text-white/15 text-[40px]">album</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
                        <span className="material-symbols-outlined text-black text-[20px]" style={{fontVariationSettings:"'FILL' 1"}}>play_arrow</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-label-lg font-semibold text-white truncate group-hover:text-neutral-300 transition-colors">{a.title}</p>
                    <p className="text-body-sm text-on-surface-variant truncate">{a.artist} · {a.songs.length} tracks</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── Add to Playlist / Album Menu ────────────────────── */}
      {addMenuSong && (
        <AddToPlaylistMenu song={addMenuSong} onClose={() => setAddMenuSong(null)} />
      )}
    </div>
  );
}

function CollectionDetail({ item, type, currentSong, isPlaying, onPlaySong, onRemoveSong, onDelete, onRename, onPlayAll, onAddToPlaylist }) {
  const [editing, setEditing] = useState(false);
  const [title,   setTitle]   = useState(item.title);

  const handleRename = () => {
    if (title.trim()) onRename(title.trim(), item.artist);
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-end gap-6 flex-wrap sm:flex-nowrap">
        <div className="w-36 h-36 rounded-2xl overflow-hidden bg-[#161616] border border-[#222222] flex-shrink-0 shadow-2xl">
          {item.thumbnail ? (
            <img src={item.thumbnail} className="w-full h-full object-cover" alt="" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-white/20 text-[56px]">
                {type === 'album' ? 'album' : 'queue_music'}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <span className="text-label-sm uppercase tracking-widest text-on-surface-variant font-semibold">
            {type === 'album' ? 'Custom Album' : 'Custom Playlist'}
          </span>
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRename()}
                className="bg-white/5 border border-white/30 rounded-lg px-3 py-1 text-white text-headline-md outline-none"
              />
              <button onClick={handleRename} className="text-white hover:text-neutral-300 transition-colors">
                <span className="material-symbols-outlined text-[22px]">check</span>
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="text-left group">
              <h2 className="text-headline-xl font-bold text-white tracking-tight group-hover:text-neutral-300 transition-colors">{item.title}</h2>
            </button>
          )}
          <p className="text-body-md text-on-surface-variant">
            {item.artist ? `${item.artist} · ` : ''}{item.songs.length} songs
          </p>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={onPlayAll}
              disabled={!item.songs.length}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-white text-black font-semibold text-label-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings:"'FILL' 1"}}>play_arrow</span>
              Play All
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/8 text-on-surface-variant hover:bg-red-500/20 hover:text-red-400 transition-all text-label-md"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Track list */}
      {item.songs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-white/10">music_off</span>
          <p className="text-headline-sm text-on-surface-variant">Collection is empty</p>
          <p className="text-body-md text-outline">Add songs using the + button on any track row</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {item.songs.map((song, i) => (
            <div key={song.id} className="group flex items-center">
              <div className="flex-1 min-w-0">
                <SongRow
                  song={song}
                  index={i}
                  isActive={currentSong?.id === song.id}
                  isPlaying={currentSong?.id === song.id && isPlaying}
                  onPlay={() => onPlaySong(song, i)}
                  onAddToPlaylist={() => onAddToPlaylist(song)}
                />
              </div>
              <button
                onClick={() => onRemoveSong(song.id)}
                className="flex-shrink-0 ml-2 p-2 rounded-lg text-outline hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                title="Remove track"
              >
                <span className="material-symbols-outlined text-[18px]">remove_circle_outline</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
