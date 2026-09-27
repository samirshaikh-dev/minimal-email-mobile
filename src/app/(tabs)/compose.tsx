import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Switch, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  Muted,
  Notice,
  Screen,
  Segmented,
  StatBox,
} from '@/components/ui';
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
      subtitle="Full control over subject, message body and resume PDF attachment. Empty fields fall back to server templates.">
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
        {invalid.length > 0 ? (
          <Notice tone="warning" title="Skipped Invalid Addresses">
            {invalid.join(', ')}
          </Notice>
        ) : null}
      </Card>

      <Card>
        <Label>Subject line</Label>
        <Input
          value={subject}
          onChangeText={setSubject}
          placeholder="Server default: Application for Full-Stack Developer"
          autoCapitalize="sentences"
        />
        <Label>Message body</Label>
        <Input
          multiline
          value={body}
          onChangeText={setBody}
          placeholder="Write your custom email content. Newlines will be formatted automatically."
        />
      </Card>

      <Card>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: space.md,
          }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Label>Attachment</Label>
            <Muted>Attach resume PDF to every email</Muted>
          </View>
          <Switch
            value={attachPdf}
            onValueChange={setAttachPdf}
            trackColor={{ false: t.surfaceAlt, true: t.accent }}
            thumbColor={t.onAccent}
          />
        </View>
      </Card>

      <Card>
        <Label>Delivery mode</Label>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'queue', label: 'Queue (BullMQ)' },
            { value: 'sync', label: 'Sync (Direct)' },
          ]}
        />
        <Muted>
          {mode === 'queue'
            ? 'Enqueues batch to Redis. Recommended for robust, fault-tolerant delivery.'
            : 'Sends immediately in this request and returns live delivery diagnostics.'}
        </Muted>
        <Button
          label={mode === 'queue' ? 'Enqueue Campaign' : 'Send Campaign Now'}
          onPress={onSend}
          loading={busy}
          disabled={valid.length === 0}
        />
      </Card>

      {error ? <Notice tone="danger" title="Dispatch failed">{error}</Notice> : null}

      {queued ? (
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Badge label="Queued in BullMQ" tone="accent" />
            <Muted>Job #{queued.jobId}</Muted>
          </View>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <StatBox label="Recipients" value={queued.total} tone="accent" />
            <StatBox label="Status" value="QUEUED" tone="muted" />
          </View>
          <Button
            label="Track Job Progress"
            variant="secondary"
            onPress={() => router.push({ pathname: '/job/[id]', params: { id: queued.jobId } })}
          />
        </Card>
      ) : null}

      {report ? (
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Badge
              label={report.failed > 0 ? 'Partial Failure' : 'All Delivered'}
              tone={report.failed > 0 ? 'warning' : 'success'}
            />
            <Muted>Sync Dispatch</Muted>
          </View>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <StatBox label="Total" value={report.total} />
            <StatBox label="Sent" value={report.sent} tone="success" />
            <StatBox label="Failed" value={report.failed} tone={report.failed > 0 ? 'danger' : 'muted'} />
          </View>
          {report.failures.length > 0 ? (
            <View style={{ gap: space.xs }}>
              <Label>Failures ({report.failures.length})</Label>
              {report.failures.slice(0, 5).map((failure) => (
                <Muted key={failure.email}>
                  {failure.email} — {failure.reason}: {failure.error}
                </Muted>
              ))}
            </View>
          ) : null}
        </Card>
      ) : null}
    </Screen>
  );
}
