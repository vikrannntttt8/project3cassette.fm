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
    <div className="h-full flex flex-col overflow-y-auto select-none">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 px-6 sm:px-8 py-3.5 bg-[#0a0b0f]/90 backdrop-blur-md border-b-2 border-black shadow-[0_2px_0px_0px_#000]">
        <div className="flex items-center gap-4">
          {(activePlaylist || activeAlbum) && (
            <button
              onClick={() => { setActivePlaylist(null); setActiveAlbum(null); }}
              className="neo-btn p-2 rounded-2xl bg-[#181926] border-2 border-black text-white hover:bg-black"
            >
              <span className="material-symbols-outlined text-[20px] block">arrow_back</span>
            </button>
          )}
          <div className="flex flex-col">
            <span className="neo-badge bg-[#86EFAC] text-black text-[9px] py-0 px-2 font-black inline-block self-start mb-0.5">
              {currentItem ? (pl ? 'CHANNEL ARCHIVE' : 'STUDIO ALBUM') : 'COLLECTION STUDIO'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              {currentItem ? currentItem.title : 'My Library Bento'}
            </h1>
          </div>
        </div>

        {!activePlaylist && !activeAlbum && (
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveSection('playlists')}
              className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-150 ${
                activeSection === 'playlists'
                  ? 'bg-[#86EFAC] text-black border-2 border-black shadow-neo-sm translate-x-0.5'
                  : 'bg-[#151620] text-zinc-400 border-2 border-zinc-800 hover:border-black hover:text-white'
              }`}
            >
              Channels ({playlists.length})
            </button>

            <button
              onClick={() => setActiveSection('liked')}
              className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 ${
                activeSection === 'liked'
                  ? 'bg-[#FDA4AF] text-black border-2 border-black shadow-neo-sm translate-x-0.5'
                  : 'bg-[#151620] text-zinc-400 border-2 border-zinc-800 hover:border-black hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings:"'FILL' 1"}}>favorite</span>
              <span>Favorites ({liked.length})</span>
            </button>

            <button
              onClick={() => setActiveSection('albums')}
              className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-150 ${
                activeSection === 'albums'
                  ? 'bg-[#7DD3FC] text-black border-2 border-black shadow-neo-sm translate-x-0.5'
                  : 'bg-[#151620] text-zinc-400 border-2 border-zinc-800 hover:border-black hover:text-white'
              }`}
            >
              Studio LPs ({customAlbums.length})
            </button>
          </div>
        )}
      </header>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="flex-1 px-6 sm:px-8 py-6 pb-36">
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
          <div className="flex flex-col gap-6 animate-fade-in">
            {creatingPlaylist ? (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#161824] border-2 border-black shadow-neo-sm max-w-lg">
                <span className="material-symbols-outlined text-[#86EFAC] text-[24px]">queue_music</span>
                <input
                  autoFocus
                  value={newPlaylistTitle}
                  onChange={e => setNewPlaylistTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreatePlaylist()}
                  placeholder="Enter channel / playlist name..."
                  className="flex-1 bg-transparent border-none outline-none text-white font-bold text-sm placeholder:text-zinc-500 uppercase tracking-wide"
                />
                <button
                  onClick={handleCreatePlaylist}
                  className="neo-btn-mint px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-black"
                >
                  Create
                </button>
                <button onClick={() => setCreatingPlaylist(false)} className="neo-btn p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white border border-black">
                  <span className="material-symbols-outlined text-[16px] block">close</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreatingPlaylist(true)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#14151e] border-2 border-dashed border-zinc-700 hover:border-[#86EFAC] hover:bg-[#1a1c28] transition-all duration-200 group max-w-sm text-left shadow-neo-sm"
              >
                <div className="w-8 h-8 rounded-xl bg-[#86EFAC] text-black border-2 border-black flex items-center justify-center font-black">
                  +
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-zinc-300 group-hover:text-white transition-colors">
                  CREATE NEW CHANNEL
                </span>
              </button>
            )}

            {playlists.length === 0 && !creatingPlaylist && (
              <div className="neo-card p-12 bg-[#14151e] border-2 border-black shadow-neo text-center flex flex-col items-center gap-2 max-w-md mx-auto my-10 animate-fade-in">
                <span className="material-symbols-outlined text-[48px] text-zinc-600">library_music</span>
                <p className="text-sm font-black uppercase text-zinc-300 tracking-wider">NO CHANNELS CREATED YET</p>
                <p className="text-xs font-mono text-zinc-500">Click the button above or save tracks via the + button</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {playlists.map(p => (
                <button
                  key={p.id}
                  onClick={() => setActivePlaylist(p.id)}
                  className="group flex flex-col gap-2 rounded-2xl p-2.5 bg-[#14151e] hover:bg-[#1c1f2e] border-2 border-black shadow-neo-sm hover:shadow-neo hover:-translate-y-0.5 transition-all duration-200 text-left"
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-900 border-2 border-black">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                        <span className="material-symbols-outlined text-[#FDA4AF] text-[36px]">queue_music</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-[#86EFAC] border-2 border-black flex items-center justify-center shadow-neo-sm">
                        <span className="material-symbols-outlined text-black text-[22px]" style={{fontVariationSettings:"'FILL' 1"}}>play_arrow</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-0.5">
                    <p className="text-xs font-black uppercase text-white truncate group-hover:text-[#86EFAC] transition-colors">{p.title}</p>
                    <p className="text-[10px] font-mono text-zinc-400 mt-0.5">{p.songs.length} TRACKS</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Liked Songs Section ────────────────────────────── */}
        {!activePlaylist && !activeAlbum && activeSection === 'liked' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {liked.length > 0 && (
              <div className="flex items-center justify-between pb-3 border-b-2 border-black">
                <span className="neo-badge bg-[#FDA4AF] text-black text-[10px] font-mono border border-black shadow-neo-sm font-bold">
                  {liked.length} FAVORITE {liked.length === 1 ? 'TRACK' : 'TRACKS'}
                </span>
                <button
                  onClick={() => playCollection(liked, 0)}
                  className="neo-btn-rose flex items-center gap-2 px-4 py-2 rounded-2xl text-xs uppercase font-black tracking-wider shadow-neo-sm"
                >
                  <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings:"'FILL' 1"}}>play_arrow</span>
                  PLAY ALL FAVORITES
                </button>
              </div>
            )}

            {liked.length === 0 ? (
              <div className="neo-card p-12 bg-[#14151e] border-2 border-black shadow-neo text-center flex flex-col items-center gap-2 max-w-md mx-auto my-10 animate-fade-in">
                <span className="material-symbols-outlined text-[48px] text-[#FDA4AF]/50">favorite_border</span>
                <p className="text-sm font-black uppercase text-zinc-300 tracking-wider">NO FAVORITE TRACKS YET</p>
                <p className="text-xs font-mono text-zinc-500">Hit the heart button on any track to add it to your favorites</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {liked.map((song, i) => (
                  <SongRow
                    key={song.id}
                    song={song}
                    index={i}
                    isActive={currentSong?.id === song.id}
                    isPlaying={currentSong?.id === song.id && isPlaying}
                    onPlay={() => loadSong(song, liked, i)}
                    onAddToPlaylist={() => setAddMenuSong(song)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Custom Albums Section ──────────────────────────── */}
        {!activePlaylist && !activeAlbum && activeSection === 'albums' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {creatingAlbum ? (
              <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[#161824] border-2 border-black shadow-neo-sm max-w-md">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#7DD3FC] text-[22px]">album</span>
                  <span className="text-xs font-black uppercase tracking-wider text-white">NEW STUDIO LP</span>
                </div>
                <input
                  autoFocus
                  value={newAlbumTitle}
                  onChange={e => setNewAlbumTitle(e.target.value)}
                  placeholder="Album Title..."
                  className="bg-zinc-900 border-2 border-black rounded-xl px-3.5 py-2 text-white text-xs font-bold uppercase tracking-wider outline-none focus:border-[#7DD3FC]"
                />
                <input
                  value={newAlbumArtist}
                  onChange={e => setNewAlbumArtist(e.target.value)}
                  placeholder="Artist / Curator Name..."
                  className="bg-zinc-900 border-2 border-black rounded-xl px-3.5 py-2 text-white text-xs font-bold uppercase tracking-wider outline-none focus:border-[#7DD3FC]"
                />
                <div className="flex items-center gap-2 justify-end mt-1">
                  <button
                    onClick={() => setCreatingAlbum(false)}
                    className="neo-btn px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold uppercase border border-black"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateAlbum}
                    className="neo-btn-cyan px-4 py-1.5 rounded-xl text-xs font-black uppercase border border-black shadow-neo-sm"
                  >
                    Create LP
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCreatingAlbum(true)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#14151e] border-2 border-dashed border-zinc-700 hover:border-[#7DD3FC] hover:bg-[#1a1c28] transition-all duration-200 group max-w-sm text-left shadow-neo-sm"
              >
                <div className="w-8 h-8 rounded-xl bg-[#7DD3FC] text-black border-2 border-black flex items-center justify-center font-black">
                  +
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-zinc-300 group-hover:text-white transition-colors">
                  CREATE CUSTOM LP
                </span>
              </button>
            )}

            {customAlbums.length === 0 && !creatingAlbum && (
              <div className="neo-card p-12 bg-[#14151e] border-2 border-black shadow-neo text-center flex flex-col items-center gap-2 max-w-md mx-auto my-10 animate-fade-in">
                <span className="material-symbols-outlined text-[48px] text-zinc-600">album</span>
                <p className="text-sm font-black uppercase text-zinc-300 tracking-wider">NO CUSTOM LPS YET</p>
                <p className="text-xs font-mono text-zinc-500">Group your favorite songs into custom studio albums</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {customAlbums.map(album => (
                <button
                  key={album.id}
                  onClick={() => setActiveAlbum(album.id)}
                  className="group flex flex-col gap-2 rounded-2xl p-2.5 bg-[#14151e] hover:bg-[#1c1f2e] border-2 border-black shadow-neo-sm hover:shadow-neo hover:-translate-y-0.5 transition-all duration-200 text-left"
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-900 border-2 border-black">
                    {album.thumbnail ? (
                      <img src={album.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                        <span className="material-symbols-outlined text-[#7DD3FC] text-[36px]">album</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-[#7DD3FC] border-2 border-black flex items-center justify-center shadow-neo-sm">
                        <span className="material-symbols-outlined text-black text-[22px]" style={{fontVariationSettings:"'FILL' 1"}}>play_arrow</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-0.5">
                    <p className="text-xs font-black uppercase text-white truncate group-hover:text-[#7DD3FC] transition-colors">{album.title}</p>
                    <p className="text-[10px] font-mono text-zinc-400 mt-0.5">{album.artist} · {album.songs.length} TRACKS</p>
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
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="neo-card p-6 bg-[#13141e] border-2 border-black shadow-neo flex items-end gap-6 flex-wrap sm:flex-nowrap">
        <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden bg-zinc-900 border-2 border-black shadow-neo-sm flex-shrink-0">
          {item.thumbnail ? (
            <img src={item.thumbnail} className="w-full h-full object-cover" alt="" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-zinc-700 text-[56px]">
                {type === 'album' ? 'album' : 'queue_music'}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <span className="neo-badge bg-[#86EFAC] text-black text-[9px] font-black self-start">
            {type === 'album' ? 'STUDIO LP' : 'DIRECT CHANNEL'}
          </span>
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRename()}
                className="bg-zinc-900 border-2 border-black rounded-xl px-3.5 py-1.5 text-white text-base font-black uppercase outline-none focus:border-[#86EFAC]"
              />
              <button onClick={handleRename} className="neo-btn-mint p-2 rounded-xl">
                <span className="material-symbols-outlined text-[18px] block">check</span>
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="text-left group flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight group-hover:text-[#86EFAC] transition-colors">{item.title}</h2>
              <span className="material-symbols-outlined text-zinc-500 group-hover:text-white text-[18px]">edit</span>
            </button>
          )}
          <p className="text-xs font-mono text-zinc-400">
            {item.artist ? `${item.artist} · ` : ''}{item.songs.length} TRACKS ARCHIVED
          </p>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={onPlayAll}
              disabled={!item.songs.length}
              className="neo-btn-mint flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings:"'FILL' 1"}}>play_arrow</span>
              PLAY ALL TRACKS
            </button>
            <button
              onClick={onDelete}
              className="neo-btn p-2 px-3 rounded-2xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border-2 border-black transition-all text-xs font-bold uppercase"
            >
              <span className="material-symbols-outlined text-[16px] inline-block align-middle mr-1">delete</span>
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Track list */}
      {item.songs.length === 0 ? (
        <div className="neo-card p-12 bg-[#14151b] border-2 border-black shadow-neo text-center flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-[48px] text-zinc-600">music_off</span>
          <p className="text-sm font-black uppercase text-zinc-300 tracking-wider">COLLECTION IS EMPTY</p>
          <p className="text-xs font-mono text-zinc-500">Add tracks using the + button on any track row</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
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
                className="neo-btn ml-2 p-1.5 rounded-lg bg-zinc-900 border-2 border-black text-zinc-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                title="Remove track"
              >
                <span className="material-symbols-outlined text-[18px] block">remove_circle_outline</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
