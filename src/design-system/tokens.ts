/**
 * NORA Design System — locked brand tokens.
 *
 * LOCKED CORE (do not change without a brand decision):
 *   Primary dark green  #0A4D2C
 *   Warm cream canvas   #FDFBF7
 *   Restrained gold     #C9A961
 *   White surface       #FFFFFF
 *
 * Derived tones exist only for accessibility (contrast on light surfaces),
 * elevation, and status semantics. No screen may hardcode a color —
 * every value flows from here.
 */

export const palette = {
  /** Primary NORA dark green — buttons, active nav, financial cards. */
  primary: '#0A4D2C',
  /** Elevated dark green — inner surfaces of dark cards. */
  primaryElev: '#0C5A34',
  /** NORA warm cream — the application canvas. */
  cream: '#FDFBF7',
  /** NORA restrained gold — accents only, never primary surfaces. */
  gold: '#C9A961',
  /** Deeper gold for small text on light surfaces (contrast, WCAG-aware). */
  goldDeep: '#8C6D2F',
  /** White — cards, inputs, modals. */
  white: '#FFFFFF',

  // ── Derived: text ──────────────────────────────────────────────
  text: '#15211B',
  textDim: '#66716A',
  textOnDark: '#FDFBF7',
  textDimOnDark: 'rgba(253, 251, 247, 0.66)',

  // ── Derived: structure ─────────────────────────────────────────
  border: '#E8E4DA',
  borderSubtle: '#F0EDE4',

  // ── Status (semantic, restrained) ──────────────────────────────
  success: '#1E7A46',
  successBg: 'rgba(30, 122, 70, 0.10)',
  danger: '#B3402F',
  dangerBg: 'rgba(179, 64, 47, 0.10)',
  pending: '#8C6D2F',
  pendingBg: 'rgba(201, 169, 97, 0.16)',

  // ── Legacy aliases (kept so existing screens keep compiling) ───
  bg: '#FDFBF7',
  surface: '#FFFFFF',
  dark: '#0A4D2C',
  darkElev: '#0C5A34',
  green: '#1E7A46',
  red: '#B3402F',
  pill: 'rgba(201, 169, 97, 0.16)',
} as const;

/** Typography scale — readable, financial, no decorative faces. */
export const type = {
  display: { fontSize: 28, fontWeight: '800', letterSpacing: -0.3 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.2 },
  heading: { fontSize: 17, fontWeight: '800' },
  subheading: { fontSize: 15, fontWeight: '700' },
  body: { fontSize: 14, fontWeight: '400' },
  bodyStrong: { fontSize: 14, fontWeight: '600' },
  caption: { fontSize: 12, fontWeight: '500' },
  micro: { fontSize: 10, fontWeight: '700' },
} as const;

/** Spacing grid — 4px base. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

/** Corner radii. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/** Elevation — calm, minimal shadows only. */
export const elevation = {
  card: { shadowColor: '#0A4D2C', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  darkCard: { shadowColor: '#032013', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
} as const;

/** Motion — short, calm, reduced-motion friendly. */
export const motion = {
  fast: 120,
  base: 200,
  slow: 320,
} as const;

/** Touch targets — accessibility minimum 44pt. */
export const touchTarget = { min: 44 } as const;
