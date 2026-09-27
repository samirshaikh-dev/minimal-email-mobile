export type Theme = {
  dark: boolean;
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  muted: string;
  faint: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
};

export const themes = {
  light: {
    dark: false,
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    border: '#E2E8F0',
    text: '#0F172A',
    muted: '#475569',
    faint: '#94A3B8',
    accent: '#4F46E5',
    accentSoft: '#EEF2FF',
    onAccent: '#FFFFFF',
    success: '#16A34A',
    successSoft: '#F0FDF4',
    danger: '#DC2626',
    dangerSoft: '#FEF2F2',
    warning: '#D97706',
    warningSoft: '#FFFBEB',
  },
  dark: {
    // Dark mode removed: alias to light theme to enforce light-only mood
    dark: false,
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    border: '#E2E8F0',
    text: '#0F172A',
    muted: '#475569',
    faint: '#94A3B8',
    accent: '#4F46E5',
    accentSoft: '#EEF2FF',
    onAccent: '#FFFFFF',
    success: '#16A34A',
    successSoft: '#F0FDF4',
    danger: '#DC2626',
    dangerSoft: '#FEF2F2',
    warning: '#D97706',
    warningSoft: '#FFFBEB',
  },
} satisfies Record<'light' | 'dark', Theme>;

export type Tone = 'accent' | 'success' | 'danger' | 'warning' | 'muted';

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const MAX_CONTENT_WIDTH = 640;
