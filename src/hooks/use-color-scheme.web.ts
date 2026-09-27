import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const subscribe = () => () => {};
const onClient = () => true;
const onServer = () => false;

/** Static rendering must emit the light scheme, then switch once the client takes over. */
export function useColorScheme() {
  const isHydrated = useSyncExternalStore(subscribe, onClient, onServer);
  const colorScheme = useRNColorScheme();
  return isHydrated ? colorScheme : 'light';
}
