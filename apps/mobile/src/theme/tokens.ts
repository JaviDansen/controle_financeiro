export const font = {
  sans: undefined,   // usa fonte do sistema (Geist via expo-font quando disponível)
  mono: undefined,   // usa fonte monospace do sistema
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  full: 999,
} as const;

export const spacing = {
  screenH: 22,  // padding horizontal das telas
  cardPad: 16,  // padding interno dos cards
} as const;

export const typography = {
  heroBalance: 40,
  h1: 28,
  h2: 17,
  body: 15,
  caption: 12,
  micro: 11,
  mono: {
    balance: 20,
    stat: 18,
    body: 15,
    caption: 12,
  },
} as const;
