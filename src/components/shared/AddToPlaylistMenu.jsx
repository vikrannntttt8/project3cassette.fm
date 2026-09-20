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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm select-none animate-fade-in"
      onClick={onClose}
    >
      <div
        className="neo-card p-5 w-full max-w-sm mx-4 flex flex-col gap-4 bg-[#14151e] border-2 border-black shadow-neo-lg rounded-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b-2 border-black">
          <div className="flex flex-col min-w-0">
            <span className="neo-badge bg-[#86EFAC] text-black text-[9px] font-black self-start mb-0.5">
              SAVE TO COLLECTION
            </span>
            <h3 className="text-sm font-black uppercase text-white truncate">{song.title}</h3>
            <p className="text-[10px] font-mono text-zinc-400 truncate">{song.artist}</p>
          </div>
          <button
            onClick={onClose}
            className="neo-btn p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white border border-black flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[18px] block">close</span>
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 p-1 bg-zinc-900/90 rounded-full border border-zinc-800">
          <button
            onClick={() => { setTab('playlist'); setCreating(false); }}
            className={`flex-1 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-150 ${
              tab === 'playlist'
                ? 'bg-[#86EFAC] text-black border border-black shadow-neo-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Channels ({playlists.length})
          </button>
          <button
            onClick={() => { setTab('album'); setCreating(false); }}
            className={`flex-1 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-150 ${
              tab === 'album'
                ? 'bg-[#7DD3FC] text-black border border-black shadow-neo-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Studio LPs ({customAlbums.length})
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
              placeholder={tab === 'playlist' ? "Channel Name..." : "Studio LP Name..."}
              className="flex-1 bg-zinc-900 border-2 border-black rounded-xl px-3 py-1.5 text-white text-xs font-bold uppercase tracking-wider outline-none focus:border-[#86EFAC]"
            />
            <button
              onClick={handleCreate}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${
                tab === 'playlist' ? 'neo-btn-mint' : 'neo-btn-cyan'
              }`}
            >
              Add
            </button>
            <button
              onClick={() => setCreating(false)}
              className="neo-btn p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white border border-black"
            >
              <span className="material-symbols-outlined text-[16px] block">close</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800 border-2 border-dashed border-zinc-700 hover:border-[#86EFAC] transition-all duration-200 text-left group shadow-neo-sm"
          >
            <div className={`w-6 h-6 rounded-lg border border-black flex items-center justify-center font-black text-black text-xs ${tab === 'playlist' ? 'bg-[#86EFAC]' : 'bg-[#7DD3FC]'}`}>
              +
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-zinc-300 group-hover:text-white">
              {tab === 'playlist' ? 'NEW CHANNEL' : 'NEW STUDIO LP'}
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
