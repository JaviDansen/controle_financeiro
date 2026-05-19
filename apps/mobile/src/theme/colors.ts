// Equivalentes hex dos CSS vars oklch do design
export const colors = {
  bg: '#ECE7DC',
  surface: '#FBFAF6',
  ink: '#15151A',
  ink2: '#3B3B43',
  muted: '#8B8B92',
  hairline: 'rgba(21,21,26,0.10)',
  accent: '#3D8B4E',       // oklch(0.55 0.13 150)
  accentSoft: '#DDF0E4',   // oklch(0.92 0.04 150)
  accentInk: '#1E5229',    // oklch(0.32 0.09 150)
  pos: '#3D8B4E',          // oklch(0.55 0.13 150)
  neg: '#B85732',          // oklch(0.55 0.15 28)
  negSoft: '#F7E8E0',      // oklch(0.94 0.03 28)
} as const;

export type ColorToken = keyof typeof colors;
