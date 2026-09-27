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
  Mono,
  Muted,
  Notice,
  Progress,
  Screen,
  StatBox,
} from '@/components/ui';
import { space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useJob } from '@/hooks/use-job';
import { failureInfo, jobStateTone } from '@/lib/failures';
import { mailpitUrl } from '@/lib/config';
import { formatTimestamp } from '@/lib/format';
import { tap } from '@/lib/haptics';
import { useServer } from '@/lib/server-context';
import { untrackJob } from '@/lib/store';

export default function JobDetailScreen() {
  const t = useTheme();
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

  const progressPercent = Math.round((data?.progress ?? 0) * 100);

  return (
    <Screen contentStyle={{ gap: space.lg }}>
      <Stack.Screen options={{ title: `Job #${jobId}` }} />

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ gap: 2 }}>
            <Label>Execution state</Label>
            <Mono style={{ fontSize: 16, fontWeight: '700' }}>#{jobId}</Mono>
          </View>
          <Badge label={data?.state ?? 'unknown'} tone={jobStateTone(data?.state)} />
        </View>

        {isPolling ? (
          <View style={{ gap: space.xs }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Label>Live progress</Label>
              <Mono style={{ color: t.muted, fontSize: 12 }}>{progressPercent}%</Mono>
            </View>
            <Progress value={data?.progress ?? 0} />
            <Muted>Polling worker state every 2 seconds...</Muted>
          </View>
        ) : null}

        <KeyValue label="Attempts" value={String(data?.attemptsMade ?? 0)} mono />
        <KeyValue label="Queued at" value={formatTimestamp(data?.timestamp)} />

        <Button
          label={copied ? 'Job ID Copied to Clipboard!' : 'Copy Job ID'}
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
        <Notice tone="danger" title="Worker execution failed">
          {data.failedReason}
        </Notice>
      ) : null}

      {data?.result ? (
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Label>Delivery results</Label>
            <Badge
              label={data.result.failed > 0 ? 'Partial Failure' : 'All Sent'}
              tone={data.result.failed > 0 ? 'warning' : 'success'}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <StatBox label="Total" value={data.result.total} />
            <StatBox label="Sent" value={data.result.sent} tone="success" />
            <StatBox
              label="Failed"
              value={data.result.failed}
              tone={data.result.failed > 0 ? 'danger' : 'muted'}
            />
          </View>
        </Card>
      ) : null}

      {data?.result?.failures.length ? (
        <Card>
          <Label>Failed recipients ({data.result.failures.length})</Label>
          {data.result.failures.map((failure) => {
            const info = failureInfo(failure.reason);
            return (
              <View
                key={failure.email}
                style={{
                  gap: 4,
                  padding: space.md,
                  backgroundColor: t.surfaceAlt,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: t.border,
                }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Mono style={{ fontWeight: '600' }}>{failure.email}</Mono>
                  <Badge label={info.label} tone="danger" />
                </View>
                <Muted>{failure.error}</Muted>
                {info.hint ? <Muted style={{ color: t.faint }}>{info.hint}</Muted> : null}
              </View>
            );
          })}
        </Card>
      ) : null}

      <Card>
        <Label>Actions</Label>
        <Button label="Refresh Status Now" variant="secondary" onPress={() => void refresh()} />
        <Button
          label="Open Mailpit Web UI"
          variant="secondary"
          onPress={() => void Linking.openURL(mailpitUrl(baseUrl))}
        />
        <Button label="Remove Job from Tracking List" variant="ghost" onPress={() => void onRemove()} />
      </Card>
    </Screen>
  );
}
