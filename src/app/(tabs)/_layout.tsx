import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useTheme } from '@/hooks/use-theme';
import { select } from '@/lib/haptics';

export default function TabsLayout() {
  const t = useTheme();

  return (
    <NativeTabs
      backgroundColor={t.bg}
      tintColor={t.accent}
      iconColor={{ default: t.faint, selected: t.accent }}
      labelStyle={{
        default: { color: t.faint, fontSize: 11 },
        selected: { color: t.accent, fontSize: 11 },
      }}
      screenListeners={{
        tabPress: () => select(),
      }}
      tabBarRespectsIMEInsets>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="paperplane.fill" md="send" />
        <NativeTabs.Trigger.Label>Send</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="compose">
        <NativeTabs.Trigger.Icon sf="square.and.pencil" md="edit_note" />
        <NativeTabs.Trigger.Label>Compose</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="jobs">
        <NativeTabs.Trigger.Icon sf="tray.full.fill" md="inventory_2" />
        <NativeTabs.Trigger.Label>Jobs</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
