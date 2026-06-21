// Ícones SVG via react-native-svg. Rodar: npx expo install react-native-svg
import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  sw?: number;
}

const defaults = { size: 20, color: 'currentColor', sw: 1.6 };

export const Icon = {
  Home: ({ size = 20, color = '#15151A', sw = 1.6 }: IconProps) => (
    <Svg viewBox="0 0 20 20" width={size} height={size} fill="none">
      <Path d="M3 9.5 10 4l7 5.5V16a1 1 0 0 1-1 1h-3v-5H7v5H4a1 1 0 0 1-1-1V9.5Z"
        stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),

  Tx: ({ size = 20, color = '#15151A', sw = 1.6 }: IconProps) => (
    <Svg viewBox="0 0 20 20" width={size} height={size} fill="none">
      <Path d="M4 7h10M14 7l-3-3M14 7l-3 3" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 13H6M6 13l3-3M6 13l3 3" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),

  Card: ({ size = 20, color = '#15151A', sw = 1.6 }: IconProps) => (
    <Svg viewBox="0 0 20 20" width={size} height={size} fill="none">
      <Rect x="2.5" y="5" width="15" height="11" rx="2" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2.5 9h15M5.5 13h2" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),

  Profile: ({ size = 20, color = '#15151A', sw = 1.6 }: IconProps) => (
    <Svg viewBox="0 0 20 20" width={size} height={size} fill="none">
      <Circle cx="10" cy="7" r="3" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.5 17c1-3.4 3.6-5 6.5-5s5.5 1.6 6.5 5" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),

  Plus: ({ size = 20, color = '#15151A', sw = 2 }: IconProps) => (
    <Svg viewBox="0 0 20 20" width={size} height={size} fill="none">
      <Path d="M10 4v12M4 10h12" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  ),

  Edit: ({ size = 16, color = '#15151A', sw = 1.6 }: IconProps) => (
    <Svg viewBox="0 0 20 20" width={size} height={size} fill="none">
      <Path d="M4 14.5V16h1.5L15 6.5 13.5 5 4 14.5Z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12.5 6l1.5 1.5" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  ),

  Trash: ({ size = 16, color = '#15151A', sw = 1.6 }: IconProps) => (
    <Svg viewBox="0 0 20 20" width={size} height={size} fill="none">
      <Path d="M4 6h12M8 6V4.5h4V6M6 8l.6 8h6.8L14 8" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8.5 10v4M11.5 10v4" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  ),

  ChevR: ({ size = 14, color = '#15151A', sw = 1.8 }: IconProps) => (
    <Svg viewBox="0 0 20 20" width={size} height={size} fill="none">
      <Path d="M7 4l6 6-6 6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),

  ChevL: ({ size = 14, color = '#15151A', sw = 1.8 }: IconProps) => (
    <Svg viewBox="0 0 20 20" width={size} height={size} fill="none">
      <Path d="M13 4l-6 6 6 6" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),

  Eye: ({ size = 18, color = '#15151A', sw = 1.5 }: IconProps) => (
    <Svg viewBox="0 0 20 20" width={size} height={size} fill="none">
      <Path d="M1.5 10s3-6 8.5-6 8.5 6 8.5 6-3 6-8.5 6S1.5 10 1.5 10Z" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="10" cy="10" r="2.5" stroke={color} strokeWidth={sw} />
    </Svg>
  ),

  EyeOff: ({ size = 18, color = '#15151A', sw = 1.5 }: IconProps) => (
    <Svg viewBox="0 0 20 20" width={size} height={size} fill="none">
      <Path d="M3 3l14 14" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M6.5 5.5C7.6 4.9 8.7 4.5 10 4.5c5.5 0 8.5 5.5 8.5 5.5a14 14 0 0 1-2.5 3" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M13.5 13.5A4 4 0 0 1 6.5 6.5M1.5 10s1.4-2.7 4.3-4.5" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  ),

  ArrowUp: ({ size = 14, color = '#15151A', sw = 2 }: IconProps) => (
    <Svg viewBox="0 0 20 20" width={size} height={size} fill="none">
      <Path d="M10 16V5M5 10l5-5 5 5" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),

  ArrowDn: ({ size = 14, color = '#15151A', sw = 2 }: IconProps) => (
    <Svg viewBox="0 0 20 20" width={size} height={size} fill="none">
      <Path d="M10 4v11M5 10l5 5 5-5" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),

  Bell: ({ size = 18, color = '#15151A', sw = 1.6 }: IconProps) => (
    <Svg viewBox="0 0 20 20" width={size} height={size} fill="none">
      <Path d="M5 14V9a5 5 0 0 1 10 0v5l1.5 2h-13L5 14ZM8.5 17.5a2 2 0 0 0 3 0" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),

  Search: ({ size = 18, color = '#15151A', sw = 1.6 }: IconProps) => (
    <Svg viewBox="0 0 20 20" width={size} height={size} fill="none">
      <Circle cx="9" cy="9" r="5.5" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Path d="M13 13l3.5 3.5" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  ),

  Filter: ({ size = 16, color = '#15151A', sw = 1.6 }: IconProps) => (
    <Svg viewBox="0 0 20 20" width={size} height={size} fill="none">
      <Path d="M3 5h14M5.5 10h9M8 15h4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),

  Check: ({ size = 14, color = '#15151A', sw = 2.2 }: IconProps) => (
    <Svg viewBox="0 0 20 20" width={size} height={size} fill="none">
      <Path d="M4 10.5l4 4 8-9" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),

  Calendar: ({ size = 16, color = '#15151A', sw = 1.6 }: IconProps) => (
    <Svg viewBox="0 0 20 20" width={size} height={size} fill="none">
      <Rect x="3" y="4.5" width="14" height="13" rx="2" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 8.5h14M7 3v3M13 3v3" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  ),

  Mail: ({ size = 16, color = '#15151A', sw = 1.6 }: IconProps) => (
    <Svg viewBox="0 0 20 20" width={size} height={size} fill="none">
      <Rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke={color} strokeWidth={sw} />
      <Path d="M3 6l7 5 7-5" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  ),

  Lock: ({ size = 16, color = '#15151A', sw = 1.6 }: IconProps) => (
    <Svg viewBox="0 0 20 20" width={size} height={size} fill="none">
      <Rect x="4" y="9" width="12" height="8" rx="2" stroke={color} strokeWidth={sw} />
      <Path d="M7 9V6.5a3 3 0 0 1 6 0V9" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  ),

  More: ({ size = 18, color = '#15151A' }: IconProps) => (
    <Svg viewBox="0 0 20 20" width={size} height={size}>
      <Circle cx="4" cy="10" r="1.6" fill={color} />
      <Circle cx="10" cy="10" r="1.6" fill={color} />
      <Circle cx="16" cy="10" r="1.6" fill={color} />
    </Svg>
  ),

  Upload: ({ size = 18, color = '#15151A', sw = 1.6 }: IconProps) => (
    <Svg viewBox="0 0 20 20" width={size} height={size} fill="none">
      <Path d="M10 13V4M6 8l4-4 4 4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 15h14" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  ),

  Link: ({ size = 16, color = '#15151A', sw = 1.6 }: IconProps) => (
    <Svg viewBox="0 0 20 20" width={size} height={size} fill="none">
      <Path d="M8.5 11.5a4.24 4.24 0 0 0 6 0l2-2a4.24 4.24 0 0 0-6-6l-1 1" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11.5 8.5a4.24 4.24 0 0 0-6 0l-2 2a4.24 4.24 0 0 0 6 6l1-1" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),

  X: ({ size = 16, color = '#15151A', sw = 2 }: IconProps) => (
    <Svg viewBox="0 0 20 20" width={size} height={size} fill="none">
      <Path d="M5 5l10 10M15 5L5 15" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  ),

  Refresh: ({ size = 16, color = '#15151A', sw = 1.8 }: IconProps) => (
    <Svg viewBox="0 0 20 20" width={size} height={size} fill="none">
      <Path d="M3.5 10a6.5 6.5 0 1 0 1.2-3.8" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.5 4v3.5H7" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),

  Image: ({ size = 16, color = '#15151A', sw = 1.6 }: IconProps) => (
    <Svg viewBox="0 0 20 20" width={size} height={size} fill="none">
      <Rect x="2.5" y="3.5" width="15" height="13" rx="2" stroke={color} strokeWidth={sw} />
      <Circle cx="7.5" cy="8" r="1.5" stroke={color} strokeWidth={sw} />
      <Path d="M2.5 14l4-4 3 3 2.5-2.5 5.5 5.5" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
} as const;
