const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseRecipients(raw: string) {
  const tokens = Array.from(new Set(raw.split(/[\s,;]+/).map((token) => token.trim()).filter(Boolean)));
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const token of tokens) {
    (EMAIL_PATTERN.test(token) ? valid : invalid).push(token);
  }

  return { valid, invalid };
}

export function isEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}
