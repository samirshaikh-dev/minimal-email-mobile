import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Switch, View } from 'react-native';

import { Badge, Button, Card, Input, KeyValue, Label, Muted, Notice, Screen, Segmented } from '@/components/ui';
import { space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, isQueueReceipt, sendEmails } from '@/lib/api';
import { notify, tap } from '@/lib/haptics';
import { parseRecipients } from '@/lib/recipients';
import { useServer } from '@/lib/server-context';
import { trackJob } from '@/lib/store';
import type { EmailEntry, SendMode, SendReport } from '@/lib/types';

export default function ComposeScreen() {
  const t = useTheme();
  const { baseUrl, status } = useServer();
  const [raw, setRaw] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachPdf, setAttachPdf] = useState(true);
  const [mode, setMode] = useState<SendMode>('queue');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queued, setQueued] = useState<{ jobId: string; total: number } | null>(null);
  const [report, setReport] = useState<SendReport | null>(null);

  const { valid, invalid } = useMemo(() => parseRecipients(raw), [raw]);

  const onSend = async () => {
    if (status === 'offline') {
      setError('The backend is unreachable. Check the base URL in Settings.');
      return;
    }
    if (valid.length === 0) {
      setError('Add at least one valid email address.');
      return;
    }

    const trimmedBody = body.trim();
    const emails: EmailEntry[] = valid.map((to) => ({
      to,
      subject: subject.trim() || undefined,
      html: trimmedBody ? `<p>${trimmedBody.replace(/\n/g, '<br/>')}</p>` : undefined,
      text: trimmedBody || undefined,
      attachPdf,
    }));

    tap();
    setBusy(true);
    setError(null);
    setQueued(null);
    setReport(null);

    try {
      const response = await sendEmails(baseUrl, emails, mode);
      if (isQueueReceipt(response)) {
        await trackJob({ id: response.jobId, total: response.total, mode, createdAt: Date.now() });
        setQueued({ jobId: response.jobId, total: response.total });
      } else {
        setReport(response);
      }
      setRaw('');
      notify(true);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not send the batch.');
      notify(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      title="Compose"
      subtitle="Full control over subject, body and the resume attachment. Leave fields empty to fall back to the server templates.">
      <Card>
        <Label>Recipients</Label>
        <Input
          multiline
          value={raw}
          onChangeText={setRaw}
          placeholder="alex@example.com, sarah@company.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          invalid={raw.length > 0 && valid.length === 0}
        />
        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
          <Badge label={`${valid.length} valid`} tone={valid.length > 0 ? 'success' : 'muted'} />
          {invalid.length > 0 ? <Badge label={`${invalid.length} invalid`} tone="warning" /> : null}
        </View>
        {invalid.length > 0 ? <Muted>Skipped: {invalid.join(', ')}</Muted> : null}
      </Card>

      <Card>
        <Label hint="Optional">Subject</Label>
        <Input
          value={subject}
          onChangeText={setSubject}
          placeholder="Server default from data/subject.txt"
          autoCapitalize="sentences"
        />
        <Label hint="Optional">Message</Label>
        <Input
          multiline
          value={body}
          onChangeText={setBody}
          placeholder="Write the email body. Line breaks become &lt;br/&gt;."
        />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: space.md,
          }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Muted>Attach resume PDF</Muted>
            <Label hint="Any PDF in the server data folder is attached when the server has no explicit entry.">
              Server attachment
            </Label>
          </View>
          <Switch
            value={attachPdf}
            onValueChange={setAttachPdf}
            trackColor={{ false: t.surfaceAlt, true: t.accent }}
            thumbColor={t.bg}
          />
        </View>
      </Card>

      <Card>
        <Label>Delivery mode</Label>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'queue', label: 'Queue' },
            { value: 'sync', label: 'Sync' },
          ]}
        />
        <Button
          label={mode === 'queue' ? 'Enqueue batch' : 'Send immediately'}
          onPress={onSend}
          loading={busy}
          disabled={valid.length === 0}
        />
      </Card>

      {error ? <Notice tone="danger" title="Dispatch failed">{error}</Notice> : null}

      {queued ? (
        <Card>
          <Badge label="Queued" tone="accent" />
          <KeyValue label="Job" value={`#${queued.jobId}`} mono />
          <KeyValue label="Recipients" value={String(queued.total)} mono />
          <Button
            label="Track job"
            variant="secondary"
            onPress={() => router.push({ pathname: '/job/[id]', params: { id: queued.jobId } })}
          />
        </Card>
      ) : null}

      {report ? (
        <Card>
          <Badge
            label={report.failed > 0 ? 'Partial failure' : 'Delivered'}
            tone={report.failed > 0 ? 'warning' : 'success'}
          />
          <KeyValue label="Total" value={String(report.total)} mono />
          <KeyValue label="Sent" value={String(report.sent)} tone="success" mono />
          <KeyValue
            label="Failed"
            value={String(report.failed)}
            tone={report.failed > 0 ? 'danger' : undefined}
            mono
          />
          {report.failures.slice(0, 5).map((failure) => (
            <Muted key={failure.email}>
              {failure.email} — {failure.reason}: {failure.error}
            </Muted>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
