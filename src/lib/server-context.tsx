import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getHealth } from '@/lib/api';
import { ENV_BASE_URL, normalizeBaseUrl } from '@/lib/config';
import { readBaseUrl, writeBaseUrl } from '@/lib/store';

export type HealthStatus = 'checking' | 'online' | 'offline';

type ServerContextValue = {
  baseUrl: string;
  envBaseUrl: string;
  isOverridden: boolean;
  status: HealthStatus;
  latency: number | null;
  checkedAt: number | null;
  refresh: () => Promise<void>;
  setBaseUrl: (value: string) => Promise<void>;
  resetBaseUrl: () => Promise<void>;
};

const ServerContext = createContext<ServerContextValue | null>(null);

async function checkHealth(baseUrl: string) {
  const startedAt = Date.now();
  try {
    const health = await getHealth(baseUrl);
    return {
      status: (health?.status === 'ok' ? 'online' : 'offline') as HealthStatus,
      latency: Date.now() - startedAt,
    };
  } catch {
    return { status: 'offline' as HealthStatus, latency: null };
  }
}

export function ServerProvider({ children }: { children: ReactNode }) {
  const [override, setOverride] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const [status, setStatus] = useState<HealthStatus>('checking');
  const [latency, setLatency] = useState<number | null>(null);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);

  const baseUrl = override ?? ENV_BASE_URL;

  const applyHealth = useCallback((result: { status: HealthStatus; latency: number | null }) => {
    setStatus(result.status);
    setLatency(result.latency);
    setCheckedAt(Date.now());
  }, []);

  useEffect(() => {
    readBaseUrl()
      .then((stored) => {
        if (stored && (stored.includes('localhost') || stored.includes('10.0.2.2'))) {
          void writeBaseUrl(null);
          setOverride(null);
        } else {
          setOverride(stored);
        }
      })
      .finally(() => setRestored(true));
  }, []);

  useEffect(() => {
    if (!restored) return;
    let alive = true;
    void checkHealth(baseUrl).then((result) => {
      if (alive) applyHealth(result);
    });
    return () => {
      alive = false;
    };
  }, [restored, baseUrl, applyHealth]);

  const refresh = useCallback(async () => {
    setStatus('checking');
    applyHealth(await checkHealth(baseUrl));
  }, [baseUrl, applyHealth]);

  const setBaseUrl = useCallback(async (value: string) => {
    const next = normalizeBaseUrl(value);
    setOverride(next);
    await writeBaseUrl(next);
  }, []);

  const resetBaseUrl = useCallback(async () => {
    setOverride(null);
    await writeBaseUrl(null);
  }, []);

  const value = useMemo<ServerContextValue>(
    () => ({
      baseUrl,
      envBaseUrl: ENV_BASE_URL,
      isOverridden: override !== null,
      status,
      latency,
      checkedAt,
      refresh,
      setBaseUrl,
      resetBaseUrl,
    }),
    [baseUrl, override, status, latency, checkedAt, refresh, setBaseUrl, resetBaseUrl]
  );

  return <ServerContext.Provider value={value}>{children}</ServerContext.Provider>;
}

export function useServer() {
  const value = useContext(ServerContext);
  if (!value) throw new Error('useServer must be used inside <ServerProvider>.');
  return value;
}
