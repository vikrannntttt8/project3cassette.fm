export default function SearchBar({ query, onChange, onClear }) {
  return (
    <div className="relative flex items-center bg-[#15161f] rounded-full px-4 py-2 gap-2.5 border-2 border-black shadow-neo-sm focus-within:shadow-neo-mint focus-within:border-black transition-all">
      <span className="material-symbols-outlined text-[#86EFAC] text-[20px] flex-shrink-0">search</span>
      <input
        type="text"
        value={query}
        onChange={e => onChange(e.target.value)}
        placeholder="Search track, artist, album, channel..."
        className="bg-transparent border-none outline-none font-bold text-xs text-white placeholder:text-zinc-500 placeholder:font-medium w-48 sm:w-64 focus:w-80 transition-all duration-200 tracking-wide"
      />
      {query ? (
        <button
          onClick={onClear}
          className="neo-btn bg-black hover:bg-[#FDA4AF] text-zinc-300 hover:text-black rounded-full w-5 h-5 flex items-center justify-center transition-colors flex-shrink-0"
          title="Clear search"
        >
          <span className="material-symbols-outlined text-[13px] font-bold">close</span>
        </button>
      ) : (
        <span className="neo-badge bg-black text-[#86EFAC] text-[9px] py-0.5 px-2 border border-black flex-shrink-0 font-mono">
          ⌘K
        </span>
      )}
    </div>
  );
}

