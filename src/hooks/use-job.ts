import { useCallback, useEffect, useState } from 'react';

import { ApiError, getJobStatus } from '@/lib/api';
import type { JobStatus } from '@/lib/types';

const POLL_INTERVAL = 2000;

const isTerminal = (state?: string) => state === 'completed' || state === 'failed';

type Snapshot = { id: string; status: JobStatus | null; error: string | null };

const empty: Snapshot = { id: '', status: null, error: null };

/** Polls GET /send/status/:jobId until the queue job reaches a terminal state. */
export function useJob(baseUrl: string, jobId?: string) {
  const [snapshot, setSnapshot] = useState<Snapshot>(empty);

  useEffect(() => {
    if (!jobId) return;

    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      try {
        const status = await getJobStatus(baseUrl, jobId);
        if (!alive) return;
        setSnapshot({ id: jobId, status, error: null });
        if (isTerminal(status.state)) return;
      } catch (cause) {
        if (!alive) return;
        setSnapshot({
          id: jobId,
          status: null,
          error: cause instanceof ApiError ? cause.message : 'Could not read job status.',
        });
        return;
      }
      timer = setTimeout(tick, POLL_INTERVAL);
    };

    void tick();

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [baseUrl, jobId]);

  const refresh = useCallback(async () => {
    if (!jobId) return;
    try {
      setSnapshot({ id: jobId, status: await getJobStatus(baseUrl, jobId), error: null });
    } catch (cause) {
      setSnapshot({
        id: jobId,
        status: null,
        error: cause instanceof ApiError ? cause.message : 'Could not read job status.',
      });
    }
  }, [baseUrl, jobId]);

  const current = snapshot.id === jobId ? snapshot : empty;

  return {
    data: current.status,
    error: current.error,
    isPolling: Boolean(jobId) && !current.error && !isTerminal(current.status?.state),
    refresh,
  };
}
