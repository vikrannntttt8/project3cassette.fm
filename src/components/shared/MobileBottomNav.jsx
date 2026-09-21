import { usePlayer } from "../../context/PlayerContext.jsx";

const MOBILE_NAV = [
  { icon: "home",          label: "Home",    view: "home"    },
  { icon: "local_library", label: "Library", view: "library" },
  { icon: "favorite",      label: "Liked",   view: "liked"   },
];

/**
 * MobileBottomNav — Fixed bottom tab bar for mobile viewports (< md).
 * Replaces the hamburger-drawer pattern with a standard mobile tab bar.
 * Hidden on md+ (desktop sidebar handles nav there).
 */
export default function MobileBottomNav() {
  const { view, setView, liked } = usePlayer();

  return (
    <nav
      className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-t border-[#1a1a1a] select-none"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch" style={{ height: "var(--mobile-nav-h, 56px)" }}>
        {MOBILE_NAV.map((item) => {
          const isActive = view === item.view;
          const showBadge = item.view === "liked" && liked.length > 0;

          return (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all duration-150 cursor-pointer ${
                isActive ? "text-white" : "text-[#666666] hover:text-[#aaaaaa]"
              }`}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              style={{ minHeight: "44px" }}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-white" />
              )}

              <span
                className="material-symbols-outlined text-[22px] leading-none relative"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
                {showBadge && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center">
                    <span className="text-black font-bold" style={{ fontSize: "8px" }}>
                      {liked.length > 9 ? "9+" : liked.length}
                    </span>
                  </span>
                )}
              </span>

              <span className={`text-[10px] font-medium leading-none ${isActive ? "text-white" : ""}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
