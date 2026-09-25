// Simple stroke icons (original). 24x24, currentColor.
import type { ReactNode } from 'react';

const Svg = ({ children, label }: { children: ReactNode; label?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} aria-label={label}>
    {children}
  </svg>
);

export const Icon = {
  life: () => (
    <Svg>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
    </Svg>
  ),
  hustle: () => (
    <Svg>
      <rect x="4" y="8" width="16" height="11" rx="2" />
      <path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 13h16" />
    </Svg>
  ),
  shop: () => (
    <Svg>
      <path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8Z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </Svg>
  ),
  money: () => (
    <Svg>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 9v.01M18 15v.01" />
    </Svg>
  ),
  city: () => (
    <Svg>
      <path d="M3 20h18M5 20V10l4-3v13M9 20V5l6 3v12M15 20v-8l4 2v6" />
    </Svg>
  ),
  journal: () => (
    <Svg>
      <path d="M6 4h11a1 1 0 0 1 1 1v15H7a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1Z" />
      <path d="M9 8h6M9 12h5" />
    </Svg>
  ),
  undo: () => (
    <Svg>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
    </Svg>
  ),
  menu: () => (
    <Svg>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Svg>
  ),
  alert: () => (
    <Svg>
      <path d="M12 4 2.5 20h19Z" />
      <path d="M12 10v4M12 17v.01" />
    </Svg>
  ),
  lock: () => (
    <Svg>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Svg>
  ),
  info: () => (
    <Svg>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8v.01" />
    </Svg>
  ),
};
