export default function SearchBar({ query, onChange, onClear }) {
  return (
    <div className="relative flex items-center bg-[#181920] rounded-xl px-3.5 py-2 gap-2.5 border-2 border-black shadow-neo-sm focus-within:shadow-neo-lime focus-within:border-black transition-all">
      <span className="material-symbols-outlined text-zinc-400 text-[20px] flex-shrink-0">search</span>
      <input
        type="text"
        value={query}
        onChange={e => onChange(e.target.value)}
        placeholder="Search track, artist, album..."
        className="bg-transparent border-none outline-none font-bold text-xs text-white placeholder:text-zinc-500 placeholder:font-medium w-48 sm:w-64 focus:w-80 transition-all duration-200 uppercase tracking-wide"
      />
      {query ? (
        <button
          onClick={onClear}
          className="neo-btn bg-zinc-800 hover:bg-black text-zinc-300 hover:text-white rounded-md w-6 h-6 flex items-center justify-center transition-colors flex-shrink-0"
          title="Clear search"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      ) : (
        <span className="neo-badge bg-black text-zinc-400 text-[10px] py-0.5 px-1.5 border border-zinc-700 flex-shrink-0 font-mono">
          ⌘K
        </span>
      )}
    </div>
  );
}
