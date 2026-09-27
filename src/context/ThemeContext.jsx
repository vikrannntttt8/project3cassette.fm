import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  DEFAULT_ACCENT_HEX,
  PRESET_PALETTES,
  extractDominantColor,
  applyThemeVariables,
} from '../utils/themeEngine.js';

const ThemeContext = createContext(null);

export function ThemeProvider({ children, currentSong }) {
  // 1. Theme mode: 'default' (monochrome B&W) | 'custom' (settings lock) | 'dynamic' (album art)
  const [themeMode, setThemeModeState] = useState(() => {
    return localStorage.getItem('pulse_theme_mode') || 'default';
  });

  // 2. Custom color picked by user in Settings
  const [customColor, setCustomColorState] = useState(() => {
    return localStorage.getItem('pulse_custom_color') || '#ffffff';
  });

  // 3. Last extracted color from currentSong (used ONLY in 'dynamic' mode)
  const [extractedColor, setExtractedColor] = useState(DEFAULT_ACCENT_HEX);

  // Active color calculation:
  // Priority #1: 'custom' setting locked
  // Priority #2: 'dynamic' from cover art
  // Priority #3: 'default' crisp monochrome B&W (#ffffff)
  const getActiveColor = useCallback(() => {
    if (themeMode === 'custom') return customColor || DEFAULT_ACCENT_HEX;
    if (themeMode === 'dynamic') return extractedColor || DEFAULT_ACCENT_HEX;
    return DEFAULT_ACCENT_HEX;
  }, [themeMode, customColor, extractedColor]);

  // Apply to DOM whenever active theme variables change
  useEffect(() => {
    const activeHex = getActiveColor();
    applyThemeVariables(activeHex);
  }, [getActiveColor]);

  // CONDITIONAL DYNAMIC THEMING: ONLY extract & apply when themeMode === 'dynamic'
  useEffect(() => {
    if (themeMode !== 'dynamic') {
      return;
    }

    let isMounted = true;
    const coverUrl = currentSong?.cover || currentSong?.thumbnail;

    if (!coverUrl) {
      setExtractedColor(DEFAULT_ACCENT_HEX);
      return;
    }

    extractDominantColor(coverUrl).then((color) => {
      if (isMounted && color) {
        setExtractedColor(color);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [themeMode, currentSong?.id, currentSong?.cover, currentSong?.thumbnail]);

  const setThemeMode = (mode) => {
    setThemeModeState(mode);
    localStorage.setItem('pulse_theme_mode', mode);
  };

  const setCustomColor = (hex) => {
    if (!hex) return;
    setCustomColorState(hex);
    setThemeModeState('custom');
    localStorage.setItem('pulse_custom_color', hex);
    localStorage.setItem('pulse_theme_mode', 'custom');
  };

  const value = {
    themeMode,
    setThemeMode,
    customColor,
    setCustomColor,
    extractedColor,
    activeAccentColor: getActiveColor(),
    presetPalettes: PRESET_PALETTES,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
