import { Platform } from 'react-native';

export const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/** Used when EXPO_PUBLIC_API_URL is empty: the Android emulator cannot reach the host's localhost. */
export const PLATFORM_API_URL = Platform.select({
  android: 'http://10.0.2.2:4000',
  default: 'http://localhost:4000',
});

export const ENV_BASE_URL = ENV_API_URL.trim() || PLATFORM_API_URL;

export function normalizeBaseUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return ENV_BASE_URL;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
}

export function isBaseUrlValid(value: string) {
  return /^https?:\/\/[^\s/]+/i.test(value.trim());
}

/** Mailpit runs next to the backend in local Docker setups. */
export function mailpitUrl(baseUrl: string) {
  try {
    const url = new URL(baseUrl);
    return `${url.protocol}//${url.hostname}:8025`;
  } catch {
    return 'http://localhost:8025';
  }
}

/** Distinguishes a dev machine from a deployed backend in the health pill. */
export function environmentLabel(baseUrl: string) {
  return /^https:\/\//i.test(baseUrl) ? 'Production' : 'Local';
}
