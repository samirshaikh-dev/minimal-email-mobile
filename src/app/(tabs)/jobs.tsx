import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { FlatList, Platform, Pressable, RefreshControl, Text, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  Empty,
  Input,
  Label,
  Mono,
  Muted,
  Progress,
  StatBox,
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
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />
      }
      ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
      ListHeaderComponent={
        <View style={{ gap: space.lg, marginBottom: space.lg }}>
          <View style={{ gap: space.xs, paddingBottom: space.xs }}>
            <Text style={{ color: t.text, fontSize: 26, fontWeight: '700', letterSpacing: -0.6 }}>
              Jobs & Queue
            </Text>
            <Text style={{ color: t.muted, fontSize: 13, lineHeight: 19 }}>
              Monitor background queue dispatch runs created on this device. Pull down to refresh.
            </Text>
          </View>

          <Card>
            <Label>Inspect specific job</Label>
            <Input
              value={lookup}
              onChangeText={setLookup}
              placeholder="e.g. 104"
              keyboardType="number-pad"
            />
            <Button
              label="Open Job Inspector"
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
                paddingHorizontal: 2,
              }}>
              <Label>{jobs.length} tracked batches</Label>
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
                  Clear completed ({finishedIds.length})
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <View style={{ gap: space.lg }}>
          <Empty
            title="No Tracked Jobs"
            subtitle="Batches enqueued from Quick Send or Compose will be tracked here with live telemetry."
          />
          <Button label="Dispatch First Batch" onPress={() => router.navigate('/(tabs)')} />
        </View>
      }
      renderItem={({ item }) => {
        const status = states[item.id];
        const state = status?.state;
        const result = status?.result;
        const active = state !== undefined && ACTIVE_STATES.has(state);
        const progressPercent = Math.round((status?.progress ?? 0) * 100);

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
              ...Platform.select({
                ios: {
                  shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 3,
                },
                android: {
                  elevation: 1,
                },
                web: {
                  boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
                },
              }),
            })}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <Mono style={{ fontWeight: '600', fontSize: 14 }}>#{item.id}</Mono>
                <Muted>{timeAgo(item.createdAt)}</Muted>
              </View>
              <Badge label={state ?? item.mode} tone={jobStateTone(state)} />
            </View>

            {active ? (
              <View style={{ gap: space.xs }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Label>Processing</Label>
                  <Mono style={{ fontSize: 12, color: t.muted }}>{progressPercent}%</Mono>
                </View>
                <Progress value={status?.progress ?? 0} />
              </View>
            ) : null}

            {result ? (
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <StatBox label="Total" value={item.total} />
                <StatBox label="Sent" value={result.sent} tone="success" />
                <StatBox
                  label="Failed"
                  value={result.failed}
                  tone={result.failed > 0 ? 'danger' : 'muted'}
                />
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <StatBox label="Recipients" value={item.total} tone="muted" />
                <StatBox label="Mode" value={item.mode.toUpperCase()} tone="accent" />
              </View>
            )}
          </Pressable>
        );
      }}
    />
  );
}
