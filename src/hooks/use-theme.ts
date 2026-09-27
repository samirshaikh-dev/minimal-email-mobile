import { themes, type Theme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? themes.dark : themes.light;
}
