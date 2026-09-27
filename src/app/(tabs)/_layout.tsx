import { useEffect } from 'react';
import { Platform } from 'react-native';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useTheme } from '@/hooks/use-theme';
import { select } from '@/lib/haptics';

export default function TabsLayout() {
  const t = useTheme();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const styleId = 'expo-router-bottom-tabs-override';
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }

    style.textContent = `
      /* Move tab navigation bar to footer like mobile */
      div[role="tablist"][aria-label="Main"],
      [class*="navigationMenuRoot"] {
        top: auto !important;
        bottom: 0 !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        position: fixed !important;
        z-index: 1000 !important;
        display: flex !important;
        width: 100% !important;
        max-width: 640px !important;
        height: 60px !important;
        border-radius: 0 !important;
        border-top: 1px solid ${t.border} !important;
        border-left: 1px solid ${t.border} !important;
        border-right: 1px solid ${t.border} !important;
        background-color: ${t.surface} !important;
        align-items: center !important;
        justify-content: space-around !important;
        padding: 6px 12px !important;
        box-sizing: border-box !important;
        box-shadow: 0 -2px 10px 0 rgba(15, 23, 42, 0.05) !important;
      }

      /* Tab trigger buttons */
      div[role="tablist"][aria-label="Main"] button[role="tab"],
      [class*="navigationMenuTrigger"] {
        flex: 1 !important;
        height: 44px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-radius: 10px !important;
        padding: 0 10px !important;
        margin: 0 !important;
        background-color: transparent !important;
        transition: background-color 0.15s ease !important;
      }

      div[role="tablist"][aria-label="Main"] button[role="tab"]:hover,
      [class*="navigationMenuTrigger"]:hover {
        background-color: ${t.surfaceAlt} !important;
      }

      div[role="tablist"][aria-label="Main"] button[role="tab"][data-state="active"],
      [class*="navigationMenuTrigger"][data-state="active"] {
        background-color: ${t.accentSoft} !important;
      }

      /* Tab trigger label typography */
      div[role="tablist"][aria-label="Main"] [class*="tabText"],
      [class*="navigationMenuTrigger"] [class*="tabText"] {
        color: ${t.muted} !important;
        font-size: 13px !important;
        font-weight: 500 !important;
      }

      div[role="tablist"][aria-label="Main"] button[role="tab"][data-state="active"] [class*="tabText"],
      [class*="navigationMenuTrigger"][data-state="active"] [class*="tabText"] {
        color: ${t.accent} !important;
        font-weight: 600 !important;
      }

      /* Content container inset so bottom content is not obscured */
      [class*="tabContent"],
      div[data-radix-tabs-content] {
        padding-bottom: 72px !important;
        flex: 1 !important;
      }
    `;
  }, [t]);

  return (
    <NativeTabs
      backgroundColor={t.surface}
      tintColor={t.accent}
      iconColor={{ default: t.muted, selected: t.accent }}
      labelStyle={{
        default: { color: t.muted, fontSize: 11, fontWeight: '500' },
        selected: { color: t.accent, fontSize: 11, fontWeight: '600' },
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
