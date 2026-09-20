import { usePlayer } from '../context/PlayerContext.jsx';

const NAV_ITEMS = [
  { icon: 'home',          label: 'Home',     view: 'home'    },
  { icon: 'local_library', label: 'Library',  view: 'library' },
  { icon: 'favorite',      label: 'Liked',    view: 'liked'   },
];

export default function Sidebar() {
  const { view, setView, playlists, liked, currentSong, playCollection, customAlbums = [] } = usePlayer();

  return (
    <aside className="h-full w-64 bg-[#0e0f14] flex flex-col justify-between p-3.5 border-r-2 border-black select-none overflow-hidden shadow-[2px_0px_0px_0px_#000]">
      <div className="flex flex-col gap-4 min-h-0">
        {/* Neo-Brutalist Logo */}
        <div className="flex items-center gap-2.5 p-2 bg-[#CCFF00] border-2 border-black shadow-neo-sm rounded-xl text-black">
          <div className="w-8 h-8 rounded-lg bg-black text-[#CCFF00] flex items-center justify-center font-black text-base border-2 border-black shadow-sm">
            ⚡
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tight uppercase leading-none text-black">PULSE</span>
            <span className="text-[9px] font-mono font-extrabold tracking-widest uppercase opacity-75">BENTO STUDIO</span>
          </div>
          <div className="ml-auto">
            <span className="neo-badge bg-black text-[#CCFF00] text-[9px] py-0.5 px-1.5">v2.0</span>
          </div>
        </div>

        {/* Navigation */}
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
                    : 'text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border-2 border-zinc-800 hover:border-black'
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
                  <span className={`ml-auto neo-badge ${isActive ? 'bg-[#FF2E93] text-white' : 'bg-[#FF2E93]/20 text-[#FF2E93] border-none'}`}>
                    {liked.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="border-b-2 border-black/80 my-0.5" />

        {/* Playlists & Custom Albums Section */}
        <div className="flex flex-col gap-1 min-h-0 flex-1 overflow-hidden">
          <div className="flex items-center justify-between px-1 mb-1 flex-shrink-0">
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">Library Bento</span>
            <button
              onClick={() => setView('library')}
              className="neo-btn bg-[#CCFF00] text-black w-6 h-6 rounded-md flex items-center justify-center font-black"
              title="New playlist or album"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>
          <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 pr-0.5">
            {playlists.length === 0 && customAlbums.length === 0 && (
              <div className="p-3 bg-zinc-900/40 rounded-xl border-2 border-dashed border-zinc-800 text-center">
                <p className="text-xs font-mono text-zinc-500 uppercase">NO PLAYLISTS YET</p>
              </div>
            )}
            {playlists.map(pl => (
              <button
                key={pl.id}
                onClick={() => {
                  if (pl.songs.length) playCollection(pl.songs, 0);
                }}
                className="flex items-center gap-2.5 p-2 rounded-xl border-2 border-transparent hover:border-black bg-zinc-900/40 hover:bg-zinc-800/90 transition-all text-left w-full group hover:shadow-neo-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-[#FF2E93]/20 border border-black flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {pl.thumbnail
                    ? <img src={pl.thumbnail} className="w-full h-full object-cover" alt="" />
                    : <span className="material-symbols-outlined text-[16px] text-[#FF2E93]">queue_music</span>
                  }
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-zinc-200 truncate group-hover:text-white">
                    {pl.title}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">{pl.songs.length} TRACKS</span>
                </div>
              </button>
            ))}

            {customAlbums.map(album => (
              <button
                key={album.id}
                onClick={() => {
                  if (album.songs.length) playCollection(album.songs, 0);
                }}
                className="flex items-center gap-2.5 p-2 rounded-xl border-2 border-transparent hover:border-black bg-zinc-900/40 hover:bg-zinc-800/90 transition-all text-left w-full group hover:shadow-neo-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-[#00F0FF]/20 border border-black flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {album.thumbnail
                    ? <img src={album.thumbnail} className="w-full h-full object-cover" alt="" />
                    : <span className="material-symbols-outlined text-[16px] text-[#00F0FF]">album</span>
                  }
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-zinc-200 truncate group-hover:text-white">
                    {album.title}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">{album.songs.length} TRACKS // ALBUM</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audio Engine Live Badge */}
      <div className="flex-shrink-0 pt-2 flex flex-col gap-2">
        <div className="p-2.5 rounded-xl border-2 border-black bg-zinc-900/90 shadow-neo-sm flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#CCFF00] animate-pulse border border-black flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black uppercase text-[#CCFF00] tracking-wider leading-none">
              SAAVN AUDIO ENGINE
            </span>
            <span className="text-[9px] font-mono text-zinc-400 leading-tight mt-0.5">
              320KBPS · HIGH FIDELITY
            </span>
          </div>
        </div>

        {/* Now playing mini if available */}
        {currentSong && (
          <div className="p-2 bg-[#181920] rounded-xl border-2 border-black shadow-neo-sm flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 border border-black bg-zinc-800">
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
