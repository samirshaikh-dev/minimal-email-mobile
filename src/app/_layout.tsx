import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useTheme } from '@/hooks/use-theme';
import { ServerProvider } from '@/lib/server-context';

export default function RootLayout() {
  const t = useTheme();

  return (
    <ServerProvider>
      <ThemeProvider
        value={{
          ...DefaultTheme,
          dark: false,
          colors: {
            ...DefaultTheme.colors,
            primary: t.accent,
            background: t.bg,
            card: t.surface,
            text: t.text,
            border: t.border,
            notification: t.danger,
          },
        }}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: t.bg },
            headerTintColor: t.accent,
            headerTitleStyle: { color: t.text },
            contentStyle: { backgroundColor: t.bg },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="job/[id]" options={{ title: 'Job' }} />
        </Stack>
      </ThemeProvider>
    </ServerProvider>
  );
}
