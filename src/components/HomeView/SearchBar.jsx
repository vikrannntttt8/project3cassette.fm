export default function SearchBar({ query, onChange, onClear }) {
  return (
    <div className="relative flex items-center bg-[#18181a] rounded-full px-4 py-2 gap-2.5 border border-white/10 focus-within:border-amber-500 transition-all shadow-inner">
      <span className="material-symbols-outlined text-neutral-400 text-[19px] flex-shrink-0">
        search
      </span>
      <input
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search songs, albums, artists…"
        className="bg-transparent border-none outline-none text-body-md text-white placeholder:text-neutral-500 w-56 focus:w-80 transition-all duration-300 text-[13.5px]"
      />
      {query ? (
        <button
          onClick={onClear}
          className="text-neutral-400 hover:text-white transition-colors flex-shrink-0 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      ) : (
        <kbd className="px-1.5 py-0.5 rounded-md bg-[#222225] border border-white/10 text-neutral-400 text-[11px] font-mono tracking-wider flex-shrink-0">
          ⌘K
        </kbd>
      )}
    </div>
  );
}
