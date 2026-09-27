import { Linking, View } from 'react-native';


import {
  Badge,
  Button,
  Card,
  KeyValue,
  Label,
  Mono,
  Notice,
  Screen,
  StatusDot,
} from '@/components/ui';
import { space } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { environmentLabel } from '@/lib/config';
import { formatLatency, timeAgo } from '@/lib/format';
import { tap } from '@/lib/haptics';
import { useServer } from '@/lib/server-context';
import { clearJobs } from '@/lib/store';

export default function SettingsScreen() {
  const t = useTheme();
  const { baseUrl, status, latency, checkedAt, refresh } = useServer();

  return (
    <Screen
      title="Settings"
      subtitle="Worker diagnostics, server connection health, and developer information.">
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
            The target backend did not respond. Check that the service is running and the URL is correct.
          </Notice>
        ) : null}
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ gap: 2 }}>
            <Label >Developer info</Label>
          </View>
          <Badge label="Samir Shaikh" tone="accent" />
        </View>
        <KeyValue label="Portfolio" value="samir-portfolio-dev.vercel.app" mono />
        <KeyValue label="Phone" value="8320927182" mono />
        <KeyValue label="Email" value="shaikh.samir.work@gmail.com" mono />
        <Button
          label="Open Portfolio"
          variant="secondary"
          onPress={() => void Linking.openURL('https://samir-portfolio-dev.vercel.app/')}
        />
      </Card>
        
      <Card>
        <Label>Storage & data</Label>
        <Button label="Clear Local Job History" variant="danger" onPress={() => void clearJobs()} />
      </Card>
    </Screen>
  );
}
