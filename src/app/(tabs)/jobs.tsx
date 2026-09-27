import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  Empty,
  Input,
  KeyValue,
  Label,
  Mono,
  Muted,
  Progress,
  useScreenContentStyle,
} from '@/components/ui';
import { radius, space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getJobStatus } from '@/lib/api';
import { jobStateTone } from '@/lib/failures';
import { timeAgo } from '@/lib/format';
import { medium, tap } from '@/lib/haptics';
import { useServer } from '@/lib/server-context';
import { readJobs, untrackJobs } from '@/lib/store';
import type { JobStatus, TrackedJob } from '@/lib/types';

const MAX_REFRESH = 20;
const ACTIVE_STATES = new Set(['waiting', 'active', 'delayed']);

export default function JobsScreen() {
  const t = useTheme();
  const { baseUrl } = useServer();
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [states, setStates] = useState<Record<string, JobStatus>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [lookup, setLookup] = useState('');
  const content = useScreenContentStyle();

  const load = useCallback(async () => {
    const stored = await readJobs();
    setJobs(stored);

    const entries: [string, JobStatus][] = [];
    for (const job of stored.slice(0, MAX_REFRESH)) {
      try {
        entries.push([job.id, await getJobStatus(baseUrl, job.id)]);
      } catch {
        // A missing or Redis-less job simply shows no state.
      }
    }
    setStates(Object.fromEntries(entries));
  }, [baseUrl]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
    medium();
  }, [load]);

  const open = useCallback((id: string) => {
    tap();
    router.push({ pathname: '/job/[id]', params: { id } });
  }, []);

  const finishedIds = useMemo(
    () =>
      jobs
        .filter((job) => {
          const state = states[job.id]?.state;
          return state !== undefined && !ACTIVE_STATES.has(state);
        })
        .map((job) => job.id),
    [jobs, states]
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: t.bg }}
      data={jobs}
      keyExtractor={(job) => job.id}
      contentContainerStyle={content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.faint} />
      }
      ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
      ListHeaderComponent={
        <View style={{ gap: space.lg, marginBottom: space.lg }}>
          <View style={{ gap: space.xs }}>
            <Text style={{ color: t.text, fontSize: 26, fontWeight: '700', letterSpacing: -0.6 }}>
              Jobs
            </Text>
            <Text style={{ color: t.muted, fontSize: 13, lineHeight: 19 }}>
              Queue jobs created from this device. Pull to refresh their state.
            </Text>
          </View>

          <Card>
            <Label hint="Any job id known to the backend, including ones sent elsewhere.">
              Track a job
            </Label>
            <Input
              value={lookup}
              onChangeText={setLookup}
              placeholder="Job id, e.g. 12"
              keyboardType="number-pad"
            />
            <Button
              label="Open job"
              variant="secondary"
              disabled={lookup.trim().length === 0}
              onPress={() => {
                const id = lookup.trim();
                setLookup('');
                open(id);
              }}
            />
          </Card>

          {jobs.length > 0 ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <Label>{jobs.length} tracked</Label>
              <Pressable
                hitSlop={8}
                disabled={finishedIds.length === 0}
                onPress={() => void untrackJobs(finishedIds).then(load)}>
                <Text
                  style={{
                    color: finishedIds.length > 0 ? t.danger : t.faint,
                    fontSize: 13,
                    fontWeight: '600',
                  }}>
                  Clear completed
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <View style={{ gap: space.lg }}>
          <Empty
            title="No tracked jobs"
            subtitle="Queued batches show up here so you can watch their delivery result."
          />
          <Button label="Send the first batch" onPress={() => router.navigate('/(tabs)')} />
        </View>
      }
      renderItem={({ item }) => {
        const status = states[item.id];
        const state = status?.state;
        const result = status?.result;
        const active = state !== undefined && ACTIVE_STATES.has(state);

        return (
          <Pressable
            onPress={() => open(item.id)}
            style={({ pressed }) => ({
              gap: space.md,
              backgroundColor: pressed ? t.surfaceAlt : t.surface,
              borderColor: t.border,
              borderWidth: 1,
              borderRadius: radius.lg,
              padding: space.lg,
            })}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <Mono>#{item.id}</Mono>
                <Muted>{timeAgo(item.createdAt)}</Muted>
              </View>
              <Badge label={state ?? item.mode} tone={jobStateTone(state)} />
            </View>

            {active ? <Progress value={status?.progress ?? 0} /> : null}

            <KeyValue label="Total" value={String(item.total)} mono />
            {result ? (
              <>
                <KeyValue label="Sent" value={String(result.sent)} tone="success" mono />
                <KeyValue
                  label="Failed"
                  value={String(result.failed)}
                  tone={result.failed > 0 ? 'danger' : undefined}
                  mono
                />
              </>
            ) : null}
          </Pressable>
        );
      }}
    />
  );
}
