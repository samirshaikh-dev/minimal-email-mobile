import { useState } from 'react';
import { Linking, View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  Input,
  KeyValue,
  Label,
  Mono,
  Muted,
  Notice,
  Screen,
  StatusDot,
} from '@/components/ui';
import { space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ENV_API_URL, environmentLabel, isBaseUrlValid, mailpitUrl } from '@/lib/config';
import { formatLatency, timeAgo } from '@/lib/format';
import { notify, tap } from '@/lib/haptics';
import { useServer } from '@/lib/server-context';
import { clearJobs } from '@/lib/store';

const PRESETS = [
  { label: 'iOS simulator', url: 'http://localhost:4000' },
  { label: 'Android emulator', url: 'http://10.0.2.2:4000' },
];

export default function SettingsScreen() {
  const t = useTheme();
  const { baseUrl, envBaseUrl, isOverridden, status, latency, checkedAt, refresh, setBaseUrl, resetBaseUrl } =
    useServer();
  const [draft, setDraft] = useState(baseUrl);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sourceLabel = isOverridden
    ? 'Device override'
    : ENV_API_URL.trim()
      ? 'From EXPO_PUBLIC_API_URL'
      : 'Platform default (EXPO_PUBLIC_API_URL is empty)';

  const onSave = async () => {
    if (!isBaseUrlValid(draft)) {
      setError('Enter a full URL, for example http://10.0.2.2:4000');
      return;
    }
    tap();
    setBusy(true);
    setError(null);
    await setBaseUrl(draft);
    setBusy(false);
    notify(true);
  };

  return (
    <Screen
      title="Settings"
      subtitle="The base URL ships in the bundle from EXPO_PUBLIC_API_URL. This screen can override it on the device.">
      <Card>
        <Label hint={sourceLabel}>Backend base URL</Label>
        <Input
          value={draft}
          onChangeText={(value) => {
            setDraft(value);
            setError(null);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="http://localhost:4000"
          onSubmitEditing={onSave}
          invalid={error !== null}
        />
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Button label="Save and test" onPress={onSave} loading={busy} />
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {PRESETS.map((preset) => (
            <Button
              key={preset.url}
              label={preset.label}
              variant="secondary"
              style={{ flex: 1, paddingVertical: space.sm }}
              onPress={() => setDraft(preset.url)}
            />
          ))}
        </View>
        {isOverridden ? (
          <Button label="Use env default" variant="ghost" onPress={() => void resetBaseUrl()} />
        ) : null}
        <KeyValue label="Env default" value={envBaseUrl} mono />
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Label>Connection</Label>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <StatusDot status={status} />
              <Mono style={{ color: t.muted }}>
                {status === 'online'
                  ? `ONLINE ${latency !== null ? formatLatency(latency) : ''}`.trim()
                  : status === 'offline'
                    ? 'OFFLINE'
                    : 'CHECKING'}
              </Mono>
            </View>
            <Badge label={environmentLabel(baseUrl)} tone={environmentLabel(baseUrl) === 'Production' ? 'accent' : 'muted'} />
          </View>
        </View>
        <KeyValue label="Endpoint" value={baseUrl} mono />
        {checkedAt !== null ? <KeyValue label="Checked" value={timeAgo(checkedAt)} /> : null}
        <Button
          label="Ping server"
          variant="secondary"
          onPress={() => {
            tap();
            void refresh();
          }}
        />
        {status === 'offline' ? (
          <Notice tone="warning" title="Unreachable">
            On an Android emulator the host is 10.0.2.2, not localhost. On a physical device use your LAN IP.
          </Notice>
        ) : null}
      </Card>

      <Card>
        <Label>Local delivery</Label>
        <Muted>Docker development routes all mail to Mailpit, so nothing reaches a real inbox.</Muted>
        <KeyValue label="Mailpit" value={mailpitUrl(baseUrl)} mono />
        <Button
          label="Open Mailpit"
          variant="secondary"
          onPress={() => void Linking.openURL(mailpitUrl(baseUrl))}
        />
      </Card>

      <Card>
        <Label>Local data</Label>
        <Muted>Clears the tracked job list stored on this device.</Muted>
        <Button label="Clear job history" variant="danger" onPress={() => void clearJobs()} />
      </Card>
    </Screen>
  );
}
