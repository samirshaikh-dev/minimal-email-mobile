const FAILURES: Record<string, { label: string; hint: string }> = {
  auth_failed: {
    label: 'SMTP auth rejected',
    hint: 'Verify SMTP_USER / SMTP_PASS in the server environment.',
  },
  dns_error: {
    label: 'SMTP host not resolved',
    hint: 'The server cannot reach the mail host. Check its network or DNS.',
  },
  invalid_address: {
    label: 'Invalid address',
    hint: 'Fix the address and resend to this recipient only.',
  },
  smtp_error: {
    label: 'Mail server error',
    hint: 'Mailbox full, rate limited, or the connection was dropped.',
  },
};

export function failureInfo(reason?: string) {
  return (
    (reason ? FAILURES[reason] : undefined) ?? {
      label: reason || 'Unknown error',
      hint: '',
    }
  );
}

export function jobStateTone(state?: string) {
  switch (state) {
    case 'completed':
      return 'success' as const;
    case 'failed':
      return 'danger' as const;
    case 'active':
      return 'accent' as const;
    default:
      return 'muted' as const;
  }
}
