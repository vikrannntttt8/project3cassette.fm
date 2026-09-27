/**
 * themeEngine.js — Dynamic Canvas Color Extraction & Theme Engine
 * Extracts dominant, vibrant accent colors from album artwork
 * and applies CSS custom properties dynamically to :root.
 */

export const DEFAULT_ACCENT_HEX = '#f59e0b'; // Cassette Warm Gold

export const PRESET_PALETTES = [
  { id: 'gold',    name: 'Cassette Gold', hex: '#f59e0b', ring: 'ring-amber-500' },
  { id: 'rose',    name: 'Rose Pink',     hex: '#f43f5e', ring: 'ring-rose-500' },
  { id: 'violet',  name: 'Neon Violet',   hex: '#a855f7', ring: 'ring-violet-500' },
  { id: 'cyan',    name: 'Electric Cyan', hex: '#06b6d4', ring: 'ring-cyan-500' },
  { id: 'emerald', name: 'Emerald Wave',  hex: '#10b981', ring: 'ring-emerald-500' },
  { id: 'orange',  name: 'Sunset Orange', hex: '#fb923c', ring: 'ring-orange-500' },
  { id: 'blue',    name: 'Electric Blue', hex: '#3b82f6', ring: 'ring-blue-500' },
  { id: 'ruby',    name: 'Crimson Ruby',  hex: '#ef4444', ring: 'ring-red-500' },
];

export function hexToRgb(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r, g, b) {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const h = Math.max(0, Math.min(255, Math.round(x))).toString(16);
        return h.length === 1 ? '0' + h : h;
      })
      .join('')
  );
}

export function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  let l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s, l };
}

export function hslToHex(h, s, l) {
  h = (h % 360 + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

/**
 * Extracts dominant vibrant color from an image URL using canvas pixel sampling.
 * @param {string} imageUrl
 * @returns {Promise<string>} hex color
 */
export async function extractDominantColor(imageUrl) {
  if (!imageUrl || typeof window === 'undefined') return DEFAULT_ACCENT_HEX;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.referrerPolicy = 'no-referrer';

    const timer = setTimeout(() => {
      resolve(DEFAULT_ACCENT_HEX);
    }, 2500);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const size = 48;
        canvas.width = size;
        canvas.height = size;

        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size).data;

        const colorScores = [];
        const step = 4 * 2; // sample every 2nd pixel for speed

        for (let i = 0; i < imageData.length; i += step) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const a = imageData[i + 3];

          if (a < 128) continue; // skip transparent

          const { h, s, l } = rgbToHsl(r, g, b);

          // Skip extreme darks, extreme bright whites, and low-saturation grays
          if (l < 0.15 || l > 0.88) continue;
          if (s < 0.20) continue;

          // Vibrancy score: prioritize rich saturation and balanced lightness
          const vibrancy = s * (1 - Math.abs(l - 0.55));
          colorScores.push({ h, s, l, r, g, b, vibrancy });
        }

        if (colorScores.length === 0) {
          resolve(DEFAULT_ACCENT_HEX);
          return;
        }

        // Sort by vibrancy score descending
        colorScores.sort((a, b) => b.vibrancy - a.vibrancy);

        // Pick top vibrant candidate and optimize for dark mode readability
        const best = colorScores[0];
        const targetL = Math.max(0.48, Math.min(0.64, best.l));
        const targetS = Math.max(0.65, Math.min(0.95, best.s));

        const finalHex = hslToHex(best.h, targetS, targetL);
        resolve(finalHex);
      } catch (err) {
        console.warn('[ThemeEngine] Canvas extraction failed (CORS or canvas error), using fallback:', err);
        resolve(DEFAULT_ACCENT_HEX);
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve(DEFAULT_ACCENT_HEX);
    };

    img.src = imageUrl;
  });
}

/**
 * Injects CSS custom variables into :root for dynamic theming with smooth transitions.
 */
export function applyThemeVariables(hexColor) {
  if (typeof document === 'undefined') return;
  const hex = hexColor || DEFAULT_ACCENT_HEX;
  const { r, g, b } = hexToRgb(hex);
  const root = document.documentElement;

  root.style.setProperty('--accent-color', hex);
  root.style.setProperty('--accent-color-rgb', `${r}, ${g}, ${b}`);
  root.style.setProperty('--accent-color-glow', `rgba(${r}, ${g}, ${b}, 0.35)`);
  root.style.setProperty('--accent-hover', hslToHex(rgbToHsl(r, g, b).h, 0.85, 0.60));
  root.style.setProperty('--accent-subtle', `rgba(${r}, ${g}, ${b}, 0.15)`);
  root.style.setProperty('--accent-border', `rgba(${r}, ${g}, ${b}, 0.30)`);
}
