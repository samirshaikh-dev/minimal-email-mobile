import * as Haptics from 'expo-haptics';

const ignore = () => {};

export function tap() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(ignore);
}

export function medium() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(ignore);
}

export function select() {
  Haptics.selectionAsync().catch(ignore);
}

export function notify(success: boolean) {
  Haptics.notificationAsync(
    success ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
  ).catch(ignore);
}
