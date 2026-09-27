import { useCallback, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Linking, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  KeyValue,
  Label,
  Muted,
  Notice,
  Progress,
  Screen,
} from '@/components/ui';
import { useJob } from '@/hooks/use-job';
import { failureInfo, jobStateTone } from '@/lib/failures';
import { mailpitUrl } from '@/lib/config';
import { formatTimestamp } from '@/lib/format';
import { tap } from '@/lib/haptics';
import { useServer } from '@/lib/server-context';
import { untrackJob } from '@/lib/store';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const jobId = Array.isArray(id) ? id[0] : (id ?? '');
  const { baseUrl } = useServer();
  const { data, error, isPolling, refresh } = useJob(baseUrl, jobId);
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    tap();
    await Clipboard.setStringAsync(jobId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }, [jobId]);

  const onRemove = useCallback(async () => {
    await untrackJob(jobId);
    router.back();
  }, [jobId]);

  return (
    <Screen contentStyle={{ gap: 16 }}>
      <Stack.Screen options={{ title: `Job #${jobId}` }} />

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Label>State</Label>
          <Badge label={data?.state ?? 'unknown'} tone={jobStateTone(data?.state)} />
        </View>
        {isPolling ? <Progress value={data?.progress ?? 0} /> : null}
        {isPolling && data ? (
          <Muted>
            {Math.round((data.progress ?? 0) * 100)}% · polling the worker every 2 seconds
          </Muted>
        ) : null}
        <KeyValue label="Job" value={`#${jobId}`} mono />
        <KeyValue label="Attempts" value={String(data?.attemptsMade ?? 0)} mono />
        <KeyValue label="Queued at" value={formatTimestamp(data?.timestamp)} />
        <Button
          label={copied ? 'Copied' : 'Copy job id'}
          variant="secondary"
          onPress={() => void onCopy()}
        />
      </Card>

      {error ? (
        <Notice tone="danger" title="Cannot read status">
          {error}
          {error.includes('Redis') ? ' Start Redis on the server or send with sync mode.' : ''}
        </Notice>
      ) : null}

      {data?.failedReason ? (
        <Notice tone="danger" title="Job failed">
          {data.failedReason}
        </Notice>
      ) : null}

      {data?.result ? (
        <Card>
          <Label>Delivery</Label>
          <KeyValue label="Total" value={String(data.result.total)} mono />
          <KeyValue label="Sent" value={String(data.result.sent)} tone="success" mono />
          <KeyValue
            label="Failed"
            value={String(data.result.failed)}
            tone={data.result.failed > 0 ? 'danger' : undefined}
            mono
          />
        </Card>
      ) : null}

      {data?.result?.failures.length ? (
        <Card>
          <Label>Failed recipients</Label>
          {data.result.failures.map((failure) => {
            const info = failureInfo(failure.reason);
            return (
              <View key={failure.email} style={{ gap: 2 }}>
                <KeyValue label={failure.email} value={info.label} tone="danger" />
                <Muted>{failure.error}</Muted>
                {info.hint ? <Muted>{info.hint}</Muted> : null}
              </View>
            );
          })}
        </Card>
      ) : null}

      <Button label="Refresh" variant="secondary" onPress={() => void refresh()} />
      <Button
        label="Open Mailpit"
        variant="secondary"
        onPress={() => void Linking.openURL(mailpitUrl(baseUrl))}
      />
      <Button label="Remove from list" variant="ghost" onPress={() => void onRemove()} />
    </Screen>
  );
}
