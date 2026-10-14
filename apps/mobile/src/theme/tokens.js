/**
 * cassette.fm Visual Design System Tokens
 * Supports both PWA Chill Charcoal and Pure OLED Black.
 */

export const themes = {
  charcoal: {
    name: 'charcoal',
    bg: '#0c0c0e',
    surface: '#151517',
    surfaceElevated: '#1e1e22',
    card: '#18181a',
    cardActive: '#222226',
    border: 'rgba(255, 255, 255, 0.08)',
    borderSubtle: 'rgba(255, 255, 255, 0.04)',
    textPrimary: '#FFFFFF',
    textSecondary: '#A1A1AA',
    textDisabled: '#71717A',
    accent: '#FFFFFF',
    accentSecondary: '#FF4D4D',
    danger: '#FF5252',
    overlayScrim: 'rgba(0, 0, 0, 0.75)',
    actionPill: '#1c1c1f',
  },
  oled: {
    name: 'oled',
    bg: '#000000',
    surface: '#000000',
    surfaceElevated: '#0a0a0a',
    card: '#080808',
    cardActive: '#161616',
    border: '#1F1F1F',
    borderSubtle: '#141414',
    textPrimary: '#FFFFFF',
    textSecondary: '#A8A8A8',
    textDisabled: '#5C5C5C',
    accent: '#FFFFFF',
    accentSecondary: '#FF4D4D',
    danger: '#FF5252',
    overlayScrim: 'rgba(0, 0, 0, 0.85)',
    actionPill: '#0e0e0e',
  },
};

export function getThemeColors(style = 'charcoal') {
  return themes[style] || themes.charcoal;
}

// Default export uses charcoal to match the chill PWA aesthetic
export const colors = themes.charcoal;

export const typography = {
  display: {
    fontFamily: 'Shrikhand',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '400',
  },
  wordmark: {
    fontFamily: 'Shrikhand',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '400',
    letterSpacing: -0.3,
  },
  titleL: {
    fontFamily: 'Inter',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  titleM: {
    fontFamily: 'Inter',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  body: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  caption: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
};
