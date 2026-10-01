import { usePlayer } from '../../context/PlayerContext.jsx';

/**
 * BackButton — Universal history-aware Back button
 * Checks history stack and pops the previous route cleanly using window.history.back()
 * or custom fallback without hardcoded home jumps.
 */
export default function BackButton({
  label = 'Back',
  className = '',
  onClick = null,
}) {
  const { goBack, navHistory } = usePlayer();

  const handleClick = (e) => {
    e.preventDefault();
    if (typeof onClick === 'function') {
      onClick();
    } else {
      goBack();
    }
  };

  const hasHistory = navHistory && navHistory.length > 0;

  return (
    <button
      type="button"
      onClick={handleClick}
      title={hasHistory ? 'Go back to previous page' : 'Return to previous view'}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-all active:scale-95 text-label-md cursor-pointer ${className}`}
    >
      <span className="material-symbols-outlined text-[20px]">arrow_back</span>
      <span>{label}</span>
    </button>
  );
}
