type P = { className?: string };
const S = ({ children, className }: P & { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    {children}
  </svg>
);

export const Mark = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="var(--ember)" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5Z" /><path d="M3 12.5 12 17l9-4.5" /><path d="M3 17 12 21.5 21 17" />
  </svg>
);
export const Dash = (p: P) => <S {...p}><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h10" /></S>;
export const Plus = (p: P) => <S {...p}><path d="M12 5v14" /><path d="M5 12h14" /></S>;
export const Layers = (p: P) => <S {...p}><path d="M12 3 3 7.5 12 12l9-4.5L12 3Z" /><path d="m3 12.5 9 4.5 9-4.5" /></S>;
export const Gift = (p: P) => <S {...p}><rect x="3" y="9" width="18" height="12" rx="1" /><path d="M3 13h18" /><path d="M12 9v12" /><path d="M12 9S9.5 3.5 7 4.6C5.2 5.4 5.6 9 8.8 9H12Zm0 0s2.5-5.5 5-4.4C18.8 5.4 18.4 9 15.2 9H12Z" /></S>;
export const Cog = (p: P) => <S {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" /></S>;
export const Chevron = (p: P) => <S {...p}><path d="m9 6 6 6-6 6" /></S>;
export const Back = (p: P) => <S {...p}><path d="M15 5l-7 7 7 7" /></S>;
export const Pen = (p: P) => <S {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></S>;
export const Send = (p: P) => <S {...p}><path d="M21 3 10.5 13.5" /><path d="M21 3l-6.8 18-3.7-7.5L3 9.8Z" /></S>;
export const Check = (p: P) => <S {...p}><path d="M20 6 9 17l-5-5" /></S>;
export const Copy = (p: P) => <S {...p}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></S>;
export const Lock = (p: P) => <S {...p}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></S>;
export const Mic = (p: P) => <S {...p}><rect x="9" y="2.5" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3.5" /></S>;
export const Stop = ({ className }: P) => <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden><rect x="7" y="7" width="10" height="10" rx="1.5" /></svg>;
export const Type = (p: P) => <S {...p}><path d="M5 6h14" /><path d="M12 6v13" /></S>;
export const X = (p: P) => <S {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></S>;
export const Refresh = (p: P) => <S {...p}><path d="M20 11a8 8 0 1 0-2.3 6.3" /><path d="M20 5v6h-6" /></S>;
export const Dup = (p: P) => <S {...p}><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M4 16H3.5A1.5 1.5 0 0 1 2 14.5v-11A1.5 1.5 0 0 1 3.5 2h11A1.5 1.5 0 0 1 16 3.5V4" /></S>;
export const Share = (p: P) => <S {...p}><circle cx="18" cy="5" r="2.6" /><circle cx="6" cy="12" r="2.6" /><circle cx="18" cy="19" r="2.6" /><path d="m8.3 10.8 7.4-4.3" /><path d="m8.3 13.2 7.4 4.3" /></S>;
export const Eye = (p: P) => <S {...p}><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" /><circle cx="12" cy="12" r="2.6" /></S>;
export const EyeOff = (p: P) => <S {...p}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><path d="M2 2l20 20" /></S>;
export const Bolt = (p: P) => <S {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></S>;
export const Chart = (p: P) => <S {...p}><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" /></S>;
export const Trash = (p: P) => <S {...p}><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></S>;
export const Shield = (p: P) => <S {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></S>;

/* whitelist icons the generated prototype may reference */
const proto = {
  clock: <S><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></S>,
  phone: <S><path d="M5 3h4l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2Z" /></S>,
  pin: <S><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></S>,
  star: <S><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z" /></S>,
  shield: <S><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6Z" /></S>,
  truck: <S><rect x="2" y="7" width="12" height="9" rx="1" /><path d="M14 10h4l3 3v3h-7Z" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></S>,
  wrench: <S><path d="M15 7a4 4 0 1 0 4 4l2.5 2.5-3 3L16 14a4 4 0 0 0-4-4L4 18l-1-1 8-8Z" /></S>,
  leaf: <S><path d="M20 4c0 9-6 14-12 14a6 6 0 0 1 0-12c4 0 8-1 12-2Z" /><path d="M8 18c2-4 5-7 9-9" /></S>,
  cup: <S><path d="M5 8h11v6a5 5 0 0 1-11 0Z" /><path d="M16 9h2a2.5 2.5 0 0 1 0 5h-2" /><path d="M4 21h13" /></S>,
  scissors: <S><circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><path d="M8 8l12 10" /><path d="M8 16 20 6" /></S>,
  tooth: <S><path d="M12 3c3 0 6 1 6 4 0 5-1 14-3 14s-1-6-3-6-1 6-3 6-3-9-3-14c0-3 3-4 6-4Z" /></S>,
  dumbbell: <S><path d="M4 9v6" /><path d="M20 9v6" /><rect x="7" y="7" width="3" height="10" rx="1" /><rect x="14" y="7" width="3" height="10" rx="1" /><path d="M10 12h4" /></S>,
  brush: <S><path d="M4 20c3 0 5-2 5-5l7-9 3 3-9 7c0 3-2 4-6 4Z" /></S>,
  gavel: <S><path d="m14 3 7 7-3 3-7-7Z" /><path d="M11 9 4 16l3 3 7-7" /><path d="M3 21h9" /></S>,
  camera: <S><rect x="3" y="7" width="18" height="13" rx="2" /><circle cx="12" cy="13" r="3.5" /><path d="M9 7l1.5-2h3L15 7" /></S>,
  spark: <S><path d="M12 3v5" /><path d="M12 16v5" /><path d="M3 12h5" /><path d="M16 12h5" /><path d="m6 6 3 3" /><path d="m15 15 3 3" /><path d="m18 6-3 3" /><path d="m9 15-3 3" /></S>,
} as const;

export type ProtoIconName = keyof typeof proto;
export const ProtoIcon = ({ name, className }: { name: ProtoIconName; className?: string }) => (
  <span className={className}>{proto[name]}</span>
);
