import { normalizeBaseUrl } from './config';
import type { EmailEntry, JobStatus, QueueReceipt, SendMode, SendReport } from './types';

const SEND_TIMEOUT = 20_000;
const HEALTH_TIMEOUT = 6_000;
const STATUS_TIMEOUT = 10_000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(baseUrl: string, path: string, timeout: number, init?: RequestInit) {
  const url = `${normalizeBaseUrl(baseUrl)}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    throw new ApiError(
      aborted
        ? `The server did not respond within ${Math.round(timeout / 1000)}s.`
        : `Cannot reach ${url}. Check the base URL in Settings.`,
      0
    );
  } finally {
    clearTimeout(timer);
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : `Request failed with status ${response.status}.`;
    throw new ApiError(message, response.status);
  }
  return body as T;
}

export function getHealth(baseUrl: string) {
  return request<{ status: string }>(baseUrl, '/health', HEALTH_TIMEOUT);
}

export function sendEmails(baseUrl: string, emails: EmailEntry[], mode: SendMode) {
  const path = mode === 'sync' ? '/send?sync=true' : '/send';
  return request<QueueReceipt | SendReport>(baseUrl, path, SEND_TIMEOUT, {
    method: 'POST',
    body: JSON.stringify({ emails }),
  });
}

export function getJobStatus(baseUrl: string, jobId: string) {
  return request<JobStatus>(baseUrl, `/send/status/${encodeURIComponent(jobId)}`, STATUS_TIMEOUT);
}

export function isQueueReceipt(value: unknown): value is QueueReceipt {
  return typeof value === 'object' && value !== null && 'jobId' in value;
}
