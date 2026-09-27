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
  const {
    baseUrl,
    envBaseUrl,
    isOverridden,
    status,
    latency,
    checkedAt,
    refresh,
    setBaseUrl,
    resetBaseUrl,
  } = useServer();
  const [draft, setDraft] = useState(baseUrl);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sourceLabel = isOverridden
    ? 'Custom device override active'
    : ENV_API_URL.trim()
      ? 'From EXPO_PUBLIC_API_URL'
      : 'Default platform fallback';

  const onSave = async () => {
    if (!isBaseUrlValid(draft)) {
      setError('Enter a full URL including protocol, e.g. http://10.0.2.2:4000');
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
      subtitle="Configure backend connectivity, local environment presets, and debugging tools.">
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Label>Worker health</Label>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: t.surfaceAlt,
                paddingHorizontal: space.sm,
                paddingVertical: 3,
                borderRadius: 999,
              }}>
              <StatusDot status={status} />
              <Mono style={{ color: t.text, fontSize: 11, fontWeight: '600' }}>
                {status === 'online'
                  ? `ONLINE${latency !== null ? ` · ${formatLatency(latency)}` : ''}`
                  : status === 'offline'
                    ? 'OFFLINE'
                    : 'CHECKING'}
              </Mono>
            </View>
            <Badge
              label={environmentLabel(baseUrl)}
              tone={environmentLabel(baseUrl) === 'Production' ? 'accent' : 'muted'}
            />
          </View>
        </View>
        <KeyValue label="Target Endpoint" value={baseUrl} mono />
        {checkedAt !== null ? <KeyValue label="Last Ping" value={timeAgo(checkedAt)} /> : null}
        <Button
          label="Ping Server"
          variant="secondary"
          onPress={() => {
            tap();
            void refresh();
          }}
        />
        {status === 'offline' ? (
          <Notice tone="warning" title="Backend Unreachable">
            On Android emulators use host 10.0.2.2 instead of localhost. On physical devices use your local Wi-Fi IP address.
          </Notice>
        ) : null}
      </Card>

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
        <Button label="Save and Reconnect" onPress={onSave} loading={busy} />
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
          <Button label="Reset to Environment Default" variant="ghost" onPress={() => void resetBaseUrl()} />
        ) : null}
        <KeyValue label="Bundled default" value={envBaseUrl} mono />
      </Card>

      <Card>
        <Label hint="Local Docker mail catcher — zero emails hit real inboxes">Email preview (Mailpit)</Label>
        <Muted>
          All messages sent in local development are trapped by Mailpit for visual inspection.
        </Muted>
        <KeyValue label="Mailpit Web UI" value={mailpitUrl(baseUrl)} mono />
        <Button
          label="Open Mailpit in Browser"
          variant="secondary"
          onPress={() => void Linking.openURL(mailpitUrl(baseUrl))}
        />
      </Card>

      <Card>
        <Label hint="Permanently wipe local device telemetry">Storage & data</Label>
        <Muted>Clears the tracked BullMQ job history stored on this device in AsyncStorage.</Muted>
        <Button label="Clear Local Job History" variant="danger" onPress={() => void clearJobs()} />
      </Card>
    </Screen>
  );
}
