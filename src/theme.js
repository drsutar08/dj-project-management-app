import { useColorScheme } from 'react-native';
import { useStore } from './store';

// Lavender background, deep navy text, bright purple accent, and a set of
// bold tile colours for the Home grid.
const tiles = {
  purple: '#7a3ff0',
  green: '#16b57a',
  blue: '#3a5ff0',
  orange: '#f5a414',
  pink: '#f04f7d',
  violet: '#8b4ff2',
};

const light = {
  // The screen itself is white, as in the design; cards lift off it with a soft purple shadow and hairline.
  bg: '#ffffff', surface: '#ffffff', surface2: '#f4f2fc', line: '#ece8f8',
  heroBg: '#f6f3ff', heroLine: '#e9e3ff',
  fg: '#14113a', muted: '#6d698d', accent: '#5a2ee6', accent2: '#8c6bff', accentInk: '#ffffff',
  ink: '#1c1452', ink2: '#2f1d8f', inkFg: '#ffffff', inkMuted: 'rgba(255,255,255,0.7)',
  plum: '#4f2bd6', good: '#109a63', warn: '#d48300', bad: '#e0405a',
  goodBg: '#dcf5ea', warnBg: '#fff1d6', badBg: '#fde5ea', plumBg: '#ebe6ff',
  tabBg: '#ffffff', tiles,
  dark: false,
};
const dark = {
  bg: '#0c0a1e', surface: '#17142f', surface2: '#211d3f', line: '#2d2853',
  heroBg: '#1d1940', heroLine: '#2f2a5c',
  fg: '#f3f1ff', muted: '#a5a1c8', accent: '#8a6bff', accent2: '#b39dff', accentInk: '#ffffff',
  ink: '#1c1550', ink2: '#2c1f7a', inkFg: '#ffffff', inkMuted: 'rgba(255,255,255,0.68)',
  plum: '#b9a7ff', good: '#4fd494', warn: '#ffbe55', bad: '#ff7a8c',
  goodBg: '#0f2e22', warnBg: '#34260f', badBg: '#3a1620', plumBg: '#2a2356',
  tabBg: '#17142f', tiles,
  dark: true,
};

// Light unless the user picks otherwise in Settings: 'light' (default), 'dark', or 'system' to follow the phone.
export function useTheme() {
  const scheme = useColorScheme();
  const mode = useStore()?.settings?.theme || 'light';
  if (mode === 'dark') return dark;
  if (mode === 'system') return scheme === 'dark' ? dark : light;
  return light;
}

export const tone = (c, t) =>
  ({
    plum: { bg: c.plumBg, fg: c.plum },
    good: { bg: c.goodBg, fg: c.good },
    warn: { bg: c.warnBg, fg: c.warn },
    bad: { bg: c.badBg, fg: c.bad },
  })[t] || { bg: c.surface2, fg: c.fg };

export const shadow = {
  shadowColor: '#2a1d7a',
  shadowOpacity: 0.08,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
};
