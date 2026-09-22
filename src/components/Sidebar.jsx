import { usePlayer } from '../context/PlayerContext.jsx';

const NAV_ITEMS = [
  { icon: 'home',          label: 'Home',     view: 'home'    },
  { icon: 'local_library', label: 'Library',  view: 'library' },
];

export default function Sidebar() {
  const { view, setView, playlists, playCollection, customAlbums = [], setIsSettingsOpen } = usePlayer();

  return (
    <aside className="h-full w-full bg-[#0e0e0e] flex flex-col justify-between py-4 px-3.5 border-r border-white/5 select-none overflow-hidden">
      <div className="flex flex-col gap-5 min-h-0">
        {/* Logo — cassette.fm with Amber Dot */}
        <div
          onClick={() => setView('home')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 flex-shrink-0 cursor-pointer group"
          title="cassette.fm"
        >
          <span className="font-cassette text-[26px] text-white tracking-tight select-none leading-none group-hover:text-amber-400 transition-colors">
            cassette.fm
          </span>
          <span className="w-2 h-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
        </div>

        {/* Navigation items (Home & Library) */}
        <nav className="flex flex-col gap-1.5 flex-shrink-0">
          {NAV_ITEMS.map(item => {
            const isActive = view === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-150 w-full text-left cursor-pointer min-h-[44px] ${
                  isActive
                    ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                    : 'text-neutral-400 hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[21px]">
                  {item.icon}
                </span>
                <span className="text-body-md font-semibold">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="h-px bg-white/5 flex-shrink-0" />

        {/* Playlists & Custom Albums */}
        <div className="flex flex-col gap-0.5 min-h-0 flex-1 overflow-hidden">
          <div className="flex items-center justify-between px-2 mb-1.5 flex-shrink-0">
            <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-500">Playlists & Albums</span>
            <button
              onClick={() => setView('library')}
              className="text-neutral-500 hover:text-white transition-colors p-1 cursor-pointer"
              title="Manage playlists & albums"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>
          <div className="flex flex-col gap-1 overflow-y-auto flex-1 pr-1 no-scrollbar">
            {playlists.length === 0 && customAlbums.length === 0 && (
              <p className="text-body-sm text-neutral-600 px-2 py-2">No playlists yet</p>
            )}
            {playlists.map(pl => (
              <button
                key={pl.id}
                onClick={() => {
                  if (pl.songs.length) playCollection(pl.songs, 0);
                }}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-neutral-400 hover:bg-white/[0.05] hover:text-white transition-colors text-left w-full group cursor-pointer min-h-[44px]"
              >
                <div className="w-8 h-8 rounded-lg bg-[#18181a] border border-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {pl.thumbnail
                    ? <img src={pl.thumbnail} className="w-full h-full object-cover" alt="" />
                    : <span className="material-symbols-outlined text-[15px] text-neutral-500">queue_music</span>
                  }
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-body-sm font-semibold truncate group-hover:text-white transition-colors">
                    {pl.title}
                  </span>
                  <span className="text-[11px] text-neutral-500">{pl.songs.length} tracks</span>
                </div>
              </button>
            ))}

            {customAlbums.map(album => (
              <button
                key={album.id}
                onClick={() => {
                  if (album.songs.length) playCollection(album.songs, 0);
                }}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-neutral-400 hover:bg-white/[0.05] hover:text-white transition-colors text-left w-full group cursor-pointer min-h-[44px]"
              >
                <div className="w-8 h-8 rounded-lg bg-[#18181a] border border-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {album.thumbnail
                    ? <img src={album.thumbnail} className="w-full h-full object-cover" alt="" />
                    : <span className="material-symbols-outlined text-[15px] text-neutral-500">album</span>
                  }
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-body-sm font-semibold truncate group-hover:text-white transition-colors">
                    {album.title}
                  </span>
                  <span className="text-[11px] text-neutral-500">{album.songs.length} tracks</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Settings button anchored to bottom left */}
      <div className="flex-shrink-0 pt-2 border-t border-white/5 mt-auto">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="sidebar-settings-btn flex items-center gap-3 px-3 py-2.5 rounded-2xl text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-all duration-150 w-full text-left group min-h-[44px] cursor-pointer"
          title="Settings"
        >
          <span className="material-symbols-outlined text-[20px] text-neutral-500 group-hover:text-amber-400 group-hover:rotate-45 transition-transform duration-300">
            tune
          </span>
          <span className="text-body-md font-semibold">Settings Hub</span>
        </button>
      </div>
    </aside>
  );
}
