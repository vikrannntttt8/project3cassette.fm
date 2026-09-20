export default function SearchBar({ query, onChange, onClear }) {
  return (
    <div className="relative flex items-center bg-black rounded-full px-4 py-2 gap-2 border border-[#2a2a2a] focus-within:border-white transition-all">
      <span className="material-symbols-outlined text-[#888888] text-[18px] flex-shrink-0">search</span>
      <input
        type="text"
        value={query}
        onChange={e => onChange(e.target.value)}
        placeholder="Songs, albums, artists…"
        className="bg-transparent border-none outline-none text-body-md text-white placeholder:text-[#666666] w-52 focus:w-72 transition-all duration-300"
      />
      {query ? (
        <button onClick={onClear} className="text-[#888888] hover:text-white transition-colors flex-shrink-0">
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      ) : (
        <kbd className="px-1.5 py-0.5 rounded bg-[#181818] border border-[#2a2a2a] text-[#888888] text-label-sm tracking-wider flex-shrink-0">⌘K</kbd>
      )}
    </div>
  );
}
