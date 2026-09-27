export type EmailEntry =
  | string
  | {
      to: string;
      subject?: string;
      html?: string;
      text?: string;
      attachPdf?: boolean;
    };

export type Failure = {
  email: string;
  subject?: string;
  reason: string;
  error: string;
};

export type SendReport = {
  total: number;
  sent: number;
  failed: number;
  failures: Failure[];
};

export type QueueReceipt = {
  ok: boolean;
  message: string;
  jobId: string;
  total: number;
  statusUrl: string;
};

export type JobStatus = {
  ok: boolean;
  jobId: string;
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | string;
  progress: number;
  result: SendReport | null;
  failedReason: string | null;
  attemptsMade: number;
  timestamp: string;
};

export type SendMode = 'queue' | 'sync';

export type TrackedJob = {
  id: string;
  total: number;
  mode: SendMode;
  createdAt: number;
};
