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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="glass-panel rounded-2xl p-6 w-full max-w-sm mx-4 flex flex-col gap-4 border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col min-w-0">
            <h3 className="text-headline-sm font-semibold text-white">Save Song</h3>
            <p className="text-body-sm text-on-surface-variant truncate">{song.title}</p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-white transition-colors p-1">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-[#111111] p-1 rounded-xl border border-[#222222]">
          <button
            onClick={() => { setTab('playlist'); setCreating(false); }}
            className={`flex-1 py-1.5 rounded-lg text-label-md font-medium transition-all ${
              tab === 'playlist' ? 'bg-white text-black font-semibold shadow-sm' : 'text-[#888888] hover:text-white'
            }`}
          >
            Playlists ({playlists.length})
          </button>
          <button
            onClick={() => { setTab('album'); setCreating(false); }}
            className={`flex-1 py-1.5 rounded-lg text-label-md font-medium transition-all ${
              tab === 'album' ? 'bg-white text-black font-semibold shadow-sm' : 'text-[#888888] hover:text-white'
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
              placeholder={tab === 'playlist' ? "Playlist name…" : "Album name…"}
              className="flex-1 bg-black border border-[#333333] rounded-lg px-3 py-2 text-white text-body-md outline-none focus:border-white"
            />
            <button
              onClick={handleCreate}
              className="px-3.5 py-2 rounded-lg text-label-md font-semibold bg-white text-black hover:bg-neutral-200 transition-colors"
            >
              Create
            </button>
            <button onClick={() => setCreating(false)} className="text-[#888888] hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#111111] hover:bg-[#181818] border border-dashed border-[#333333] hover:border-white transition-all text-left cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] text-white">add</span>
            <span className="text-label-lg text-[#888888] hover:text-white">
              {tab === 'playlist' ? 'New Playlist' : 'New Custom Album'}
            </span>
          </button>
        )}

        {/* List */}
        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
          {currentList.length === 0 && (
            <p className="text-body-sm text-[#888888] text-center py-4">
              {tab === 'playlist' ? 'No playlists yet — create one above' : 'No albums yet — create one above'}
            </p>
          )}
          {currentList.map(item => {
            const added = addedIds.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => !added && (tab === 'playlist' ? handleAddPlaylist(item.id) : handleAddAlbum(item.id))}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                  added
                    ? 'bg-white/10 border border-white/20 cursor-default'
                    : 'hover:bg-white/5 border border-transparent hover:border-[#222222]'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-[#141414] border border-[#262626] flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="material-symbols-outlined text-white/30 text-[18px]">
                      {tab === 'playlist' ? 'queue_music' : 'album'}
                    </span>
                  )}
                </div>
                <div className="flex flex-col min-w-0 text-left">
                  <span className={`text-label-lg font-semibold truncate ${added ? 'text-white font-bold' : 'text-white'}`}>
                    {item.title}
                  </span>
                  <span className="text-body-sm text-[#888888]">{item.songs.length} tracks</span>
                </div>
                {added && (
                  <span className="material-symbols-outlined text-white text-[20px] ml-auto flex-shrink-0">check_circle</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
