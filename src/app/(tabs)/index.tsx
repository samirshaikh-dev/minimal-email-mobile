import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  Input,
  KeyValue,
  Label,
  Muted,
  Notice,
  Screen,
  Segmented,
  StatBox,
} from '@/components/ui';
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
      subtitle="Recipients only — the server automatically fills subject, cover letter and resume PDF from storage.">
      <Card>
        <Label>Recipients</Label>
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
        {invalid.length > 0 ? (
          <Notice tone="warning" title="Skipped Invalid Addresses">
            {invalid.join(', ')}
          </Notice>
        ) : null}
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
            ? 'Batches are enqueued for background worker delivery. Best for reliable bulk sending.'
            : 'Delivers immediately through SMTP and reports delivery status synchronously.'}
        </Muted>
        <Button
          label={mode === 'queue' ? 'Queue Applications' : 'Send Batch Now'}
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

      <Card>
        <Label>Server template assets</Label>
        <KeyValue label="Subject" value="data/subject.txt" mono />
        <KeyValue label="Cover Letter" value="data/body.txt" mono />
        <KeyValue label="Attachment" value="Resume PDF from data folder" mono />
      </Card>
    </Screen>
  );
}
