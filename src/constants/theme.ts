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
    bg: '#FFFFFF',
    surface: '#FAFAFA',
    surfaceAlt: '#F4F4F5',
    border: '#E4E4E7',
    text: '#18181B',
    muted: '#52525B',
    faint: '#A1A1AA',
    accent: '#4F46E5',
    accentSoft: '#EEF2FF',
    onAccent: '#FFFFFF',
    success: '#15803D',
    successSoft: '#F0FDF4',
    danger: '#B91C1C',
    dangerSoft: '#FEF2F2',
    warning: '#B45309',
    warningSoft: '#FFFBEB',
  },
  dark: {
    dark: true,
    bg: '#09090B',
    surface: '#111113',
    surfaceAlt: '#1C1C1F',
    border: '#27272A',
    text: '#FAFAFA',
    muted: '#A1A1AA',
    faint: '#71717A',
    accent: '#818CF8',
    accentSoft: '#1E1B4B',
    onAccent: '#0B0B0F',
    success: '#4ADE80',
    successSoft: '#052E16',
    danger: '#F87171',
    dangerSoft: '#450A0A',
    warning: '#FBBF24',
    warningSoft: '#422006',
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
