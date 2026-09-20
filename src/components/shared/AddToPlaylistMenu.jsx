import { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext.jsx';

/**
 * Full-screen overlay that lets the user pick or create a playlist or custom album
 * to add a song to.
 */
export default function AddToPlaylistMenu({ song, onClose }) {
  const { playlists, addToPlaylist, createPlaylist, customAlbums = [], addToAlbum, createAlbum } = usePlayer();
  const [tab, setTab]             = useState('playlist'); // 'playlist' | 'album'
  const [newTitle, setNewTitle]   = useState('');
  const [creating, setCreating]   = useState(false);
  const [addedIds, setAddedIds]   = useState([]);

  const handleAddPlaylist = (playlistId) => {
    addToPlaylist(playlistId, song);
    setAddedIds(prev => [...prev, playlistId]);
  };

  const handleAddAlbum = (albumId) => {
    addToAlbum(albumId, song);
    setAddedIds(prev => [...prev, albumId]);
  };

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    if (tab === 'playlist') {
      const id = createPlaylist(newTitle.trim());
      addToPlaylist(id, song);
      setAddedIds(prev => [...prev, id]);
    } else {
      const id = createAlbum(newTitle.trim(), song.artist || 'Various Artists');
      addToAlbum(id, song);
      setAddedIds(prev => [...prev, id]);
    }
    setNewTitle('');
    setCreating(false);
  };

  const currentList = tab === 'playlist' ? playlists : customAlbums;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      <div
        className="neo-card p-5 w-full max-w-sm mx-4 flex flex-col gap-4 bg-[#14151c] border-2 border-black shadow-neo-lg"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b-2 border-black">
          <div className="flex flex-col min-w-0">
            <span className="neo-badge bg-[#CCFF00] text-black text-[9px] font-black self-start mb-0.5">
              SAVE TO COLLECTION
            </span>
            <h3 className="text-sm font-black uppercase text-white truncate">{song.title}</h3>
            <p className="text-[10px] font-mono text-zinc-400 truncate">{song.artist}</p>
          </div>
          <button
            onClick={onClose}
            className="neo-btn p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white border border-black flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[18px] block">close</span>
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 p-1 bg-zinc-900/80 rounded-xl border border-zinc-800">
          <button
            onClick={() => { setTab('playlist'); setCreating(false); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
              tab === 'playlist'
                ? 'bg-[#CCFF00] text-black border border-black shadow-neo-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Playlists ({playlists.length})
          </button>
          <button
            onClick={() => { setTab('album'); setCreating(false); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
              tab === 'album'
                ? 'bg-[#00F0FF] text-black border border-black shadow-neo-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Albums ({customAlbums.length})
          </button>
        </div>

        {/* Create new */}
        {creating ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder={tab === 'playlist' ? "Playlist Name..." : "Album Name..."}
              className="flex-1 bg-zinc-900 border-2 border-black rounded-lg px-3 py-1.5 text-white text-xs font-bold uppercase tracking-wider outline-none focus:border-[#CCFF00]"
            />
            <button
              onClick={handleCreate}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors ${
                tab === 'playlist' ? 'neo-btn-lime' : 'neo-btn-cyan'
              }`}
            >
              Add
            </button>
            <button
              onClick={() => setCreating(false)}
              className="neo-btn p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white border border-black"
            >
              <span className="material-symbols-outlined text-[16px] block">close</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 border-2 border-dashed border-zinc-700 hover:border-[#CCFF00] transition-all text-left group shadow-neo-sm"
          >
            <div className={`w-6 h-6 rounded-md border border-black flex items-center justify-center font-black text-black text-xs ${tab === 'playlist' ? 'bg-[#CCFF00]' : 'bg-[#00F0FF]'}`}>
              +
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-zinc-300 group-hover:text-white">
              {tab === 'playlist' ? 'NEW PLAYLIST' : 'NEW CUSTOM ALBUM'}
            </span>
          </button>
        )}

        {/* List */}
        <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-0.5">
          {currentList.length === 0 && (
            <p className="text-xs font-mono text-zinc-500 text-center py-4 uppercase">
              {tab === 'playlist' ? 'No playlists yet' : 'No albums yet'}
            </p>
          )}
          {currentList.map(item => {
            const added = addedIds.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => !added && (tab === 'playlist' ? handleAddPlaylist(item.id) : handleAddAlbum(item.id))}
                className={`flex items-center gap-2.5 p-2 rounded-xl transition-all ${
                  added
                    ? 'bg-[#CCFF00]/15 border-2 border-[#CCFF00] cursor-default'
                    : 'bg-zinc-900/40 hover:bg-zinc-800/90 border-2 border-transparent hover:border-black hover:shadow-neo-sm'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-black flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="material-symbols-outlined text-zinc-500 text-[16px]">
                      {tab === 'playlist' ? 'queue_music' : 'album'}
                    </span>
                  )}
                </div>
                <div className="flex flex-col min-w-0 text-left">
                  <span className={`text-xs font-black uppercase tracking-tight truncate ${added ? 'text-[#CCFF00]' : 'text-white'}`}>
                    {item.title}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">{item.songs.length} TRACKS</span>
                </div>
                {added && (
                  <span className="neo-badge bg-[#CCFF00] text-black text-[8px] py-0 px-1 border border-black ml-auto font-black flex-shrink-0">
                    ADDED ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
