import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  DEFAULT_ACCENT_HEX,
  PRESET_PALETTES,
  extractDominantColor,
  applyThemeVariables,
} from '../utils/themeEngine.js';

const ThemeContext = createContext(null);

export function ThemeProvider({ children, currentSong }) {
  // 1. Theme mode: 'dynamic' | 'default' | 'custom'
  const [themeMode, setThemeModeState] = useState(() => {
    return localStorage.getItem('pulse_theme_mode') || 'dynamic';
  });

  // 2. Custom color picked by user
  const [customColor, setCustomColorState] = useState(() => {
    return localStorage.getItem('pulse_custom_color') || '#f59e0b';
  });

  // 3. Last extracted color from currentSong
  const [extractedColor, setExtractedColor] = useState(DEFAULT_ACCENT_HEX);

  // Active color calculation
  const getActiveColor = useCallback(() => {
    if (themeMode === 'default') return DEFAULT_ACCENT_HEX;
    if (themeMode === 'custom') return customColor || DEFAULT_ACCENT_HEX;
    return extractedColor || DEFAULT_ACCENT_HEX;
  }, [themeMode, customColor, extractedColor]);

  // Apply to DOM whenever theme variables change
  useEffect(() => {
    const activeHex = getActiveColor();
    applyThemeVariables(activeHex);
  }, [getActiveColor]);

  // When currentSong changes and mode is dynamic, extract color
  useEffect(() => {
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
  }, [currentSong?.id, currentSong?.cover, currentSong?.thumbnail]);

  const setThemeMode = (mode) => {
    setThemeModeState(mode);
    localStorage.setItem('pulse_theme_mode', mode);
  };

  const setCustomColor = (hex) => {
    setCustomColorState(hex);
    localStorage.setItem('pulse_custom_color', hex);
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
