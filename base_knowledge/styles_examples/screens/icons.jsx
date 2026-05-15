// Minimal stroke icons — 20x20 viewBox, currentColor.
// Kept geometric and simple; never anything more complex than a square/circle/line composition.

const Icon = {
  Home: (p) => (
    <svg viewBox="0 0 20 20" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5 10 4l7 5.5V16a1 1 0 0 1-1 1h-3v-5H7v5H4a1 1 0 0 1-1-1V9.5Z"/>
    </svg>
  ),
  Tx: (p) => (
    <svg viewBox="0 0 20 20" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h10M14 7l-3-3M14 7l-3 3"/>
      <path d="M16 13H6M6 13l3-3M6 13l3 3"/>
    </svg>
  ),
  Card: (p) => (
    <svg viewBox="0 0 20 20" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="5" width="15" height="11" rx="2"/>
      <path d="M2.5 9h15"/>
      <path d="M5.5 13h2"/>
    </svg>
  ),
  Goal: (p) => (
    <svg viewBox="0 0 20 20" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7"/>
      <circle cx="10" cy="10" r="3.5"/>
      <circle cx="10" cy="10" r="0.6" fill="currentColor"/>
    </svg>
  ),
  Profile: (p) => (
    <svg viewBox="0 0 20 20" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="7" r="3"/>
      <path d="M3.5 17c1-3.4 3.6-5 6.5-5s5.5 1.6 6.5 5"/>
    </svg>
  ),
  Plus: (p) => (
    <svg viewBox="0 0 20 20" width={p.size||20} height={p.size||20} fill="none" stroke="currentColor" strokeWidth={p.sw||2} strokeLinecap="round">
      <path d="M10 4v12M4 10h12"/>
    </svg>
  ),
  ChevR: (p) => (
    <svg viewBox="0 0 20 20" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth={p.sw||1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4l6 6-6 6"/>
    </svg>
  ),
  ChevL: (p) => (
    <svg viewBox="0 0 20 20" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth={p.sw||1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 4l-6 6 6 6"/>
    </svg>
  ),
  Eye: (p) => (
    <svg viewBox="0 0 20 20" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth={p.sw||1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 10s3-6 8.5-6 8.5 6 8.5 6-3 6-8.5 6S1.5 10 1.5 10Z"/>
      <circle cx="10" cy="10" r="2.5"/>
    </svg>
  ),
  EyeOff: (p) => (
    <svg viewBox="0 0 20 20" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth={p.sw||1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l14 14"/>
      <path d="M6.5 5.5C7.6 4.9 8.7 4.5 10 4.5c5.5 0 8.5 5.5 8.5 5.5a14 14 0 0 1-2.5 3"/>
      <path d="M13.5 13.5A4 4 0 0 1 6.5 6.5"/>
      <path d="M1.5 10s1.4-2.7 4.3-4.5"/>
    </svg>
  ),
  ArrowUp: (p) => (
    <svg viewBox="0 0 20 20" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth={p.sw||2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 16V5M5 10l5-5 5 5"/>
    </svg>
  ),
  ArrowDn: (p) => (
    <svg viewBox="0 0 20 20" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth={p.sw||2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 4v11M5 10l5 5 5-5"/>
    </svg>
  ),
  Bell: (p) => (
    <svg viewBox="0 0 20 20" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 14V9a5 5 0 0 1 10 0v5l1.5 2h-13L5 14Z"/>
      <path d="M8.5 17.5a2 2 0 0 0 3 0"/>
    </svg>
  ),
  Search: (p) => (
    <svg viewBox="0 0 20 20" width={p.size||18} height={p.size||18} fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="5.5"/><path d="M13 13l3.5 3.5"/>
    </svg>
  ),
  More: (p) => (
    <svg viewBox="0 0 20 20" width={p.size||18} height={p.size||18} fill="currentColor">
      <circle cx="4" cy="10" r="1.6"/><circle cx="10" cy="10" r="1.6"/><circle cx="16" cy="10" r="1.6"/>
    </svg>
  ),
  Filter: (p) => (
    <svg viewBox="0 0 20 20" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5h14M5.5 10h9M8 15h4"/>
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 20 20" width={p.size||14} height={p.size||14} fill="none" stroke="currentColor" strokeWidth={p.sw||2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10.5l4 4 8-9"/>
    </svg>
  ),
  Calendar: (p) => (
    <svg viewBox="0 0 20 20" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="14" height="13" rx="2"/>
      <path d="M3 8.5h14M7 3v3M13 3v3"/>
    </svg>
  ),
  Lock: (p) => (
    <svg viewBox="0 0 20 20" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="9" width="12" height="8" rx="2"/>
      <path d="M7 9V6.5a3 3 0 0 1 6 0V9"/>
    </svg>
  ),
  Mail: (p) => (
    <svg viewBox="0 0 20 20" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="4.5" width="15" height="11" rx="2"/>
      <path d="M3 6l7 5 7-5"/>
    </svg>
  ),
  Wifi: (p) => (
    <svg viewBox="0 0 20 20" width={p.size||16} height={p.size||16} fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 7.5c4.5-4 11.5-4 16 0M5 11c2.7-2.4 7.3-2.4 10 0"/>
      <circle cx="10" cy="14.5" r="1" fill="currentColor"/>
    </svg>
  ),
};

window.Icon = Icon;
