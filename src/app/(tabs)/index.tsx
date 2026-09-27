import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Badge, Button, Card, Input, KeyValue, Label, Muted, Notice, Screen, Segmented } from '@/components/ui';
import { space } from '@/constants/theme';
import { ApiError, isQueueReceipt, sendEmails } from '@/lib/api';
import { notify, tap } from '@/lib/haptics';
import { parseRecipients } from '@/lib/recipients';
import { useServer } from '@/lib/server-context';
import { trackJob } from '@/lib/store';
import type { SendMode, SendReport } from '@/lib/types';

export default function SendScreen() {
  const { baseUrl, status } = useServer();
  const [raw, setRaw] = useState('');
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

    tap();
    setBusy(true);
    setError(null);
    setQueued(null);
    setReport(null);

    try {
      const response = await sendEmails(baseUrl, valid, mode);
      if (isQueueReceipt(response)) {
        await trackJob({
          id: response.jobId,
          total: response.total,
          mode,
          createdAt: Date.now(),
        });
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
      title="Quick Send"
      subtitle="Recipients only — the server fills in the subject, cover letter and resume PDF from its data folder.">
      <Card>
        <Label hint="Comma, space or newline separated">Recipients</Label>
        <Input
          multiline
          value={raw}
          onChangeText={setRaw}
          placeholder="recruiter@tech.com, hiring@startup.io"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          invalid={raw.length > 0 && valid.length === 0}
        />
        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
          <Badge
            label={`${valid.length} valid`}
            tone={valid.length > 0 ? 'success' : 'muted'}
          />
          {invalid.length > 0 ? <Badge label={`${invalid.length} invalid`} tone="warning" /> : null}
        </View>
        {invalid.length > 0 ? <Muted>Skipped: {invalid.join(', ')}</Muted> : null}
      </Card>

      <Card>
        <Label hint="Queue needs Redis on the server. Sync delivers inline and returns results.">
          Delivery mode
        </Label>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'queue', label: 'Queue' },
            { value: 'sync', label: 'Sync' },
          ]}
        />
        <Button
          label={mode === 'queue' ? 'Queue applications' : 'Send now'}
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
          <Badge label={report.failed > 0 ? 'Partial failure' : 'Delivered'} tone={report.failed > 0 ? 'warning' : 'success'} />
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

      <Card>
        <Label>Attached by the server</Label>
        <Muted>Subject from data/subject.txt</Muted>
        <Muted>Body from data/body.txt</Muted>
        <Muted>Resume PDF from the data folder</Muted>
      </Card>
    </Screen>
  );
}
