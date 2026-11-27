import { useColorScheme } from 'react-native';

const light = {
  bg: '#f3f1f6', surface: '#ffffff', surface2: '#f0edf4', line: '#e8e3ee',
  fg: '#16111c', muted: '#7b7287', accent: '#ff8a00', accent2: '#ffb547', accentInk: '#1f1100',
  ink: '#1c1325', ink2: '#2e1d40', inkFg: '#fbf7ff', inkMuted: 'rgba(251,247,255,0.62)',
  plum: '#5b2d8a', good: '#12915a', warn: '#c27400', bad: '#d63a4a',
  goodBg: '#e2f6ec', warnBg: '#fff1dc', badBg: '#fde7ea', plumBg: '#efe6f8',
  dark: false,
};
const dark = {
  bg: '#0e0a12', surface: '#19131f', surface2: '#231b2b', line: '#2d2436',
  fg: '#f5f0fa', muted: '#a297ae', accent: '#ffa024', accent2: '#ffc266', accentInk: '#1f1100',
  ink: '#241832', ink2: '#3a2452', inkFg: '#fbf7ff', inkMuted: 'rgba(251,247,255,0.6)',
  plum: '#cfa8f5', good: '#4fd494', warn: '#ffbe55', bad: '#ff7a86',
  goodBg: '#11301f', warnBg: '#352611', badBg: '#3a161c', plumBg: '#2c1f3a',
  dark: true,
};

export function useTheme() {
  return useColorScheme() === 'dark' ? dark : light;
}

export const tone = (c, t) =>
  ({
    plum: { bg: c.plumBg, fg: c.plum },
    good: { bg: c.goodBg, fg: c.good },
    warn: { bg: c.warnBg, fg: c.warn },
    bad: { bg: c.badBg, fg: c.bad },
  })[t] || { bg: c.surface2, fg: c.fg };

export const shadow = {
  shadowColor: '#1c1325',
  shadowOpacity: 0.07,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
};
