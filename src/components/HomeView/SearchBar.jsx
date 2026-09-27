import { useRef, useEffect } from 'react';

export default function SearchBar({ query, onChange, onClear, onSubmit, loading = false }) {
  const inputRef = useRef(null);

  // Keyboard shortcut: Cmd+K / Ctrl+K focuses search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return; // Guard against multiple submits
    if (onSubmit) {
      onSubmit(query);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex items-center bg-[#18181a] rounded-full px-4 py-2 gap-2.5 border border-white/10 focus-within:border-accent transition-all shadow-inner"
    >
      {/* Icon: Spinner while fetching, otherwise Search Icon */}
      {loading ? (
        <div className="w-[19px] h-[19px] border-2 border-accent border-t-transparent rounded-full animate-spin flex-shrink-0" />
      ) : (
        <span className="material-symbols-outlined text-neutral-400 text-[19px] flex-shrink-0">
          search
        </span>
      )}

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search songs, albums, artists…"
        className="bg-transparent border-none outline-none text-body-md text-white placeholder:text-neutral-500 w-56 focus:w-80 transition-all duration-300 text-[13.5px]"
      />

      {query ? (
        <div className="flex items-center gap-1">
          {onSubmit && (
            <button
              type="submit"
              disabled={loading}
              title={loading ? "Searching..." : "Submit search (Enter)"}
              className={`text-neutral-400 hover:text-accent transition-colors flex-shrink-0 p-0.5 rounded cursor-pointer ${
                loading ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">
                arrow_forward
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={onClear}
            className="text-neutral-400 hover:text-white transition-colors flex-shrink-0 cursor-pointer p-0.5"
            title="Clear search"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      ) : (
        <kbd className="px-1.5 py-0.5 rounded-md bg-[#222225] border border-white/10 text-neutral-400 text-[11px] font-mono tracking-wider flex-shrink-0">
          ⌘K
        </kbd>
      )}
    </form>
  );
}
