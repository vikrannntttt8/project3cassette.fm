import { usePlayer } from '../context/PlayerContext.jsx';

const NAV_ITEMS = [
  { icon: 'home',          label: 'Home Feed', view: 'home'    },
  { icon: 'local_library', label: 'Library',   view: 'library' },
  { icon: 'favorite',      label: 'Favorites', view: 'liked'   },
];

export default function Sidebar() {
  const { view, setView, playlists, liked, currentSong, playCollection, customAlbums = [] } = usePlayer();

  return (
    <aside className="h-full w-64 bg-[#0d0e14] flex flex-col justify-between p-3.5 border-r-2 border-black select-none overflow-hidden shadow-[3px_0px_0px_0px_#000]">
      <div className="flex flex-col gap-3 min-h-0">
        {/* Neo-Brutalist Brand Header */}
        <div className="flex items-center gap-2.5 p-2.5 bg-[#CCFF00] border-2 border-black shadow-neo-sm rounded-2xl text-black">
          <div className="w-8 h-8 rounded-xl bg-black text-[#CCFF00] flex items-center justify-center font-black text-base border-2 border-black shadow-sm">
            ⚡
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-black text-base tracking-tight uppercase leading-none text-black">PULSE</span>
            <span className="text-[9px] font-mono font-black tracking-wider uppercase opacity-80">AUDIO STUDIO</span>
          </div>
          <div className="ml-auto">
            <span className="neo-badge bg-black text-[#CCFF00] text-[8px] py-0.5 px-2 border-black">PRO</span>
          </div>
        </div>

        {/* Somnath Mahanta DM Style: User Profile Status Pill */}
        <div className="p-2.5 rounded-2xl bg-[#161722] border-2 border-black shadow-neo-sm flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-[#86EFAC] text-black font-black text-xs border-2 border-black flex items-center justify-center shadow-sm">
              AR
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#86EFAC] border-2 border-black rounded-full" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black text-white truncate">Alex River</span>
            <span className="text-[9px] font-mono text-[#86EFAC] flex items-center gap-1 leading-none font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#86EFAC] animate-ping" />
              ONLINE // 320K
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-col gap-1.5 flex-shrink-0">
          {NAV_ITEMS.map(item => {
            const isActive = view === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150 w-full text-left font-bold text-sm ${
                  isActive
                    ? 'bg-white text-black font-black border-2 border-black shadow-neo translate-x-0.5'
                    : 'text-zinc-400 hover:text-white bg-[#13141c] hover:bg-[#1c1d29] border-2 border-zinc-800 hover:border-black'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    item.view === 'liked' && isActive
                      ? 'text-[#FF2E93]'
                      : isActive
                      ? 'text-black'
                      : 'text-zinc-400'
                  }`}
                  style={{ fontVariationSettings: item.view === 'liked' && (liked.length > 0 || isActive) ? "'FILL' 1" : undefined }}
                >
                  {item.icon}
                </span>
                <span className="tracking-tight uppercase text-xs">{item.label}</span>
                {item.view === 'liked' && liked.length > 0 && (
                  <span className={`ml-auto neo-badge ${isActive ? 'bg-[#FF2E93] text-white border-black' : 'bg-[#FF2E93]/20 text-[#FF2E93] border-transparent'}`}>
                    {liked.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="border-b-2 border-black/90 my-0.5" />

        {/* Direct Channels (Playlists & Custom Albums as DM inbox threads) */}
        <div className="flex flex-col gap-1 min-h-0 flex-1 overflow-hidden">
          <div className="flex items-center justify-between px-1 mb-1 flex-shrink-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#FDA4AF]">forum</span>
              DIRECT CHANNELS
            </span>
            <button
              onClick={() => setView('library')}
              className="neo-btn bg-[#86EFAC] text-black w-6 h-6 rounded-md flex items-center justify-center font-black"
              title="New channel / playlist"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>

          <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 pr-0.5">
            {playlists.length === 0 && customAlbums.length === 0 && (
              <div className="p-3 bg-[#14151e] rounded-xl border-2 border-dashed border-zinc-800 text-center">
                <p className="text-[10px] font-mono text-zinc-500 uppercase">NO ACTIVE CHANNELS</p>
                <button
                  onClick={() => setView('library')}
                  className="mt-1.5 text-[10px] font-black text-[#86EFAC] uppercase underline"
                >
                  Create Channel +
                </button>
              </div>
            )}
            {playlists.map(pl => (
              <button
                key={pl.id}
                onClick={() => {
                  if (pl.songs.length) playCollection(pl.songs, 0);
                }}
                className="flex items-center gap-2.5 p-2 rounded-xl border-2 border-transparent hover:border-black bg-[#14151e] hover:bg-[#1d1f2c] transition-all text-left w-full group hover:shadow-neo-sm"
              >
                <div className="w-8 h-8 rounded-full bg-[#FDA4AF]/20 border border-black flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {pl.thumbnail
                    ? <img src={pl.thumbnail} className="w-full h-full object-cover" alt="" />
                    : <span className="material-symbols-outlined text-[16px] text-[#FDA4AF]">queue_music</span>
                  }
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-zinc-200 truncate group-hover:text-white">
                      {pl.title}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">{pl.songs.length}t</span>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-400 truncate">Audio Stream Channel</span>
                </div>
              </button>
            ))}

            {customAlbums.map(album => (
              <button
                key={album.id}
                onClick={() => {
                  if (album.songs.length) playCollection(album.songs, 0);
                }}
                className="flex items-center gap-2.5 p-2 rounded-xl border-2 border-transparent hover:border-black bg-[#14151e] hover:bg-[#1d1f2c] transition-all text-left w-full group hover:shadow-neo-sm"
              >
                <div className="w-8 h-8 rounded-full bg-[#7DD3FC]/20 border border-black flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {album.thumbnail
                    ? <img src={album.thumbnail} className="w-full h-full object-cover" alt="" />
                    : <span className="material-symbols-outlined text-[16px] text-[#7DD3FC]">album</span>
                  }
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-zinc-200 truncate group-hover:text-white">
                      {album.title}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">{album.songs.length}t</span>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-400 truncate">Custom Studio LP</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audio Engine Live Badge */}
      <div className="flex-shrink-0 pt-2 flex flex-col gap-2">
        <div className="p-2.5 rounded-2xl border-2 border-black bg-[#14151f] shadow-neo-sm flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#86EFAC] animate-pulse border border-black flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black uppercase text-[#86EFAC] tracking-wider leading-none">
              PULSE ENGINE // 320K
            </span>
            <span className="text-[9px] font-mono text-zinc-400 leading-tight mt-0.5">
              LOSSLESS AUDIO ROUTE
            </span>
          </div>
        </div>

        {/* Now playing mini in sidebar */}
        {currentSong && (
          <div className="p-2 bg-[#171924] rounded-2xl border-2 border-black shadow-neo-sm flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 border border-black bg-zinc-800">
              {currentSong.thumbnail ? (
                <img src={currentSong.thumbnail} className="w-full h-full object-cover" alt="" />
              ) : (
                <span className="material-symbols-outlined text-xs text-white/30 m-auto">music_note</span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black text-white truncate">{currentSong.title}</span>
              <span className="text-[10px] font-mono text-zinc-400 truncate">{currentSong.artist}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

