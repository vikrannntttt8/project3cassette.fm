import { usePlayer } from '../context/PlayerContext.jsx';

const NAV_ITEMS = [
  { icon: 'home',          label: 'Home',     view: 'home'    },
  { icon: 'local_library', label: 'Library',  view: 'library' },
  { icon: 'favorite',      label: 'Liked',    view: 'liked'   },
];

export default function Sidebar() {
  const { view, setView, playlists, liked, playCollection, customAlbums = [], setIsSettingsOpen } = usePlayer();

  return (
    <aside className="h-full w-60 bg-black flex flex-col justify-between py-4 px-3 border-r border-[#1a1a1a] select-none overflow-hidden">
      <div className="flex flex-col gap-4 min-h-0">
        {/* Logo — cassette.fm */}
        <div
          onClick={() => setView('home')}
          className="flex items-center px-2 py-1.5 flex-shrink-0 cursor-pointer group"
          title="cassette.fm"
        >
          <span className="font-cassette text-[26px] text-white tracking-tight select-none leading-none group-hover:opacity-90 transition-opacity">
            cassette.fm
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-shrink-0">
          {NAV_ITEMS.map(item => {
            const isActive = view === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 w-full text-left cursor-pointer ${
                  isActive
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-[#888888] hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: item.view === 'liked' && liked.length > 0 ? "'FILL' 1" : undefined }}
                >
                  {item.icon}
                </span>
                <span className="text-body-md font-medium">{item.label}</span>
                {item.view === 'liked' && liked.length > 0 && (
                  <span className={`ml-auto text-label-sm font-mono px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-black/15 text-black font-bold' : 'bg-white/10 text-white'
                  }`}>
                    {liked.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="h-px bg-[#1a1a1a] flex-shrink-0" />

        {/* Playlists & Custom Albums */}
        <div className="flex flex-col gap-0.5 min-h-0 flex-1 overflow-hidden">
          <div className="flex items-center justify-between px-2 mb-1 flex-shrink-0">
            <span className="text-label-sm uppercase tracking-widest text-[#666666]">Playlists & Albums</span>
            <button
              onClick={() => setView('library')}
              className="text-[#666666] hover:text-white transition-colors p-1"
              title="Manage playlists & albums"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>
          <div className="flex flex-col gap-0.5 overflow-y-auto flex-1 pr-1">
            {playlists.length === 0 && customAlbums.length === 0 && (
              <p className="text-body-sm text-[#666666] px-2 py-2">No playlists yet</p>
            )}
            {playlists.map(pl => (
              <button
                key={pl.id}
                onClick={() => {
                  if (pl.songs.length) playCollection(pl.songs, 0);
                }}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-[#888888] hover:bg-white/[0.05] hover:text-white transition-colors text-left w-full group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-md bg-[#141414] border border-[#222222] flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {pl.thumbnail
                    ? <img src={pl.thumbnail} className="w-full h-full object-cover" alt="" />
                    : <span className="material-symbols-outlined text-[14px] text-[#888888]">queue_music</span>
                  }
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-body-sm font-medium truncate group-hover:text-white transition-colors">
                    {pl.title}
                  </span>
                  <span className="text-label-sm text-[#666666]">{pl.songs.length} tracks</span>
                </div>
              </button>
            ))}

            {customAlbums.map(album => (
              <button
                key={album.id}
                onClick={() => {
                  if (album.songs.length) playCollection(album.songs, 0);
                }}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-[#888888] hover:bg-white/[0.05] hover:text-white transition-colors text-left w-full group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-md bg-[#141414] border border-[#222222] flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {album.thumbnail
                    ? <img src={album.thumbnail} className="w-full h-full object-cover" alt="" />
                    : <span className="material-symbols-outlined text-[14px] text-[#888888]">album</span>
                  }
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-body-sm font-medium truncate group-hover:text-white transition-colors">
                    {album.title}
                  </span>
                  <span className="text-label-sm text-[#666666]">{album.songs.length} tracks</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Settings button anchored to bottom left */}
      <div className="flex-shrink-0 pt-2 border-t border-[#1a1a1a] mt-auto">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="sidebar-settings-btn flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[#888888] hover:text-white hover:bg-white/[0.05] transition-all duration-150 w-full text-left group min-h-[44px] cursor-pointer"
          title="Settings"
        >
          <span className="material-symbols-outlined text-[20px] text-[#666666] group-hover:text-white group-hover:rotate-45 transition-transform duration-300">
            settings
          </span>
          <span className="text-body-md font-medium">Settings</span>
        </button>
      </div>
    </aside>
  );
}
