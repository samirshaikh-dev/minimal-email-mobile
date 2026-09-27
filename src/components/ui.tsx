import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAX_CONTENT_WIDTH, radius, space, type Tone } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const MONO_FONT = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

const toneColors = (t: ReturnType<typeof useTheme>, tone: Tone) => {
  switch (tone) {
    case 'success':
      return { fg: t.success, bg: t.successSoft };
    case 'danger':
      return { fg: t.danger, bg: t.dangerSoft };
    case 'warning':
      return { fg: t.warning, bg: t.warningSoft };
    case 'accent':
      return { fg: t.accent, bg: t.accentSoft };
    default:
      return { fg: t.muted, bg: t.surfaceAlt };
  }
};

/** Native tabs only inset the top edge on Android; iOS handles it through the scroll view. */
export function useScreenContentStyle(extra?: StyleProp<ViewStyle>) {
  const insets = useSafeAreaInsets();

  return [
    {
      width: '100%' as const,
      maxWidth: MAX_CONTENT_WIDTH,
      alignSelf: 'center' as const,
      padding: space.lg,
      paddingTop: (Platform.OS === 'android' ? insets.top : 0) + space.lg,
      paddingBottom: space.xxl,
    },
    extra,
  ];
}

export function Screen({
  title,
  subtitle,
  children,
  contentStyle,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const content = useScreenContentStyle([{ gap: space.lg }, contentStyle]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={content}>
      {title ? (
        <View style={{ gap: space.xs }}>
          <Text style={{ color: t.text, fontSize: 26, fontWeight: '700', letterSpacing: -0.6 }}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={{ color: t.muted, fontSize: 13, lineHeight: 19 }}>{subtitle}</Text>
          ) : null}
        </View>
      ) : null}
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.surface,
          borderColor: t.border,
          borderWidth: 1,
          borderRadius: radius.lg,
          padding: space.lg,
          gap: space.md,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

export function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 2 }}>
      <Text
        style={{
          color: t.muted,
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
        }}>
        {children}
      </Text>
      {hint ? <Text style={{ color: t.faint, fontSize: 12, lineHeight: 16 }}>{hint}</Text> : null}
    </View>
  );
}

export function Muted({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return <Text style={[{ color: t.muted, fontSize: 13, lineHeight: 19 }, style]}>{children}</Text>;
}

/** Monospace telemetry: job ids, latency, endpoints, timestamps. */
export function Mono({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return (
    <Text style={[{ color: t.text, fontFamily: MONO_FONT, fontSize: 13, lineHeight: 18 }, style]}>
      {children}
    </Text>
  );
}

export function Input({
  style,
  invalid = false,
  multiline = false,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & { invalid?: boolean }) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      placeholderTextColor={t.faint}
      {...props}
      multiline={multiline}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      style={[
        {
          backgroundColor: t.bg,
          borderColor: invalid ? t.danger : focused ? t.accent : t.border,
          borderWidth: invalid || focused ? 1.5 : 1,
          borderRadius: radius.md,
          color: t.text,
          fontSize: 15,
          lineHeight: 22,
          paddingHorizontal: space.md,
          paddingVertical: space.md,
        },
        multiline ? { minHeight: 104, textAlignVertical: 'top' as const } : null,
        style,
      ]}
    />
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const [pressed, setPressed] = useState(false);

  const palette = {
    primary: { bg: t.accent, fg: t.onAccent, border: t.accent },
    secondary: { bg: t.surface, fg: t.text, border: t.border },
    ghost: { bg: 'transparent', fg: t.accent, border: 'transparent' },
    danger: { bg: t.dangerSoft, fg: t.danger, border: t.dangerSoft },
  }[variant];

  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={inactive}
      style={[
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: 1,
          borderRadius: radius.md,
          paddingVertical: space.md + 2,
          paddingHorizontal: space.lg,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: space.sm,
          opacity: inactive ? 0.55 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed && !inactive ? 0.98 : 1 }],
        },
        style,
      ]}>
      {loading ? <ActivityIndicator size="small" color={palette.fg} /> : null}
      <Text style={{ color: palette.fg, fontSize: 15, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: t.surfaceAlt,
        borderRadius: radius.md,
        padding: 3,
        gap: 3,
      }}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={{
              flex: 1,
              paddingVertical: space.sm + 2,
              borderRadius: radius.sm,
              alignItems: 'center',
              backgroundColor: active ? t.bg : 'transparent',
              borderWidth: 1,
              borderColor: active ? t.border : 'transparent',
            }}>
            <Text
              style={{
                color: active ? t.text : t.muted,
                fontSize: 13,
                fontWeight: active ? '600' : '500',
              }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Badge({ label, tone = 'muted' }: { label: string; tone?: Tone }) {
  const t = useTheme();
  const { fg, bg } = toneColors(t, tone);
  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: radius.pill,
        paddingHorizontal: space.md,
        paddingVertical: 4,
        alignSelf: 'flex-start',
      }}>
      <Text style={{ color: fg, fontSize: 11, fontWeight: '700', letterSpacing: 0.4 }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

export function Notice({
  tone = 'muted',
  title,
  children,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
}) {
  const t = useTheme();
  const { fg, bg } = toneColors(t, tone);
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.md, padding: space.md, gap: 2 }}>
      {title ? <Text style={{ color: fg, fontSize: 13, fontWeight: '600' }}>{title}</Text> : null}
      {children ? <Text style={{ color: fg, fontSize: 13, lineHeight: 18 }}>{children}</Text> : null}
    </View>
  );
}

export function KeyValue({
  label,
  value,
  tone,
  mono = false,
}: {
  label: string;
  value: string;
  tone?: Tone;
  mono?: boolean;
}) {
  const t = useTheme();
  const { fg } = toneColors(t, tone ?? 'muted');
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.md }}>
      <Text style={{ color: t.muted, fontSize: 14 }}>{label}</Text>
      <Text
        style={[
          { color: tone ? fg : t.text, fontSize: 14, fontWeight: '600' },
          mono ? { fontFamily: MONO_FONT, fontSize: 13, fontWeight: '500' } : null,
        ]}>
        {value}
      </Text>
    </View>
  );
}

/** 8px liveness dot; pulses only while a check is in flight. */
export function StatusDot({ status }: { status: 'checking' | 'online' | 'offline' }) {
  const t = useTheme();
  const [pulse] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (status !== 'checking') {
      pulse.stopAnimation();
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, status]);

  const color = status === 'online' ? t.success : status === 'offline' ? t.danger : t.faint;

  return (
    <Animated.View
      style={{
        width: 8,
        height: 8,
        borderRadius: radius.pill,
        backgroundColor: color,
        opacity: pulse,
      }}
    />
  );
}

export function Progress({ value }: { value: number }) {
  const t = useTheme();
  const percent = Math.max(0, Math.min(100, value > 0 && value <= 1 ? value * 100 : value));
  return (
    <View style={{ height: 6, borderRadius: radius.pill, backgroundColor: t.surfaceAlt }}>
      <View
        style={{
          width: `${percent}%`,
          height: '100%',
          borderRadius: radius.pill,
          backgroundColor: t.accent,
        }}
      />
    </View>
  );
}

export function Empty({ title, subtitle }: { title: string; subtitle?: string }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: space.xs, paddingVertical: space.xxl }}>
      <Text style={{ color: t.text, fontSize: 15, fontWeight: '600' }}>{title}</Text>
      {subtitle ? (
        <Text style={{ color: t.muted, fontSize: 13, textAlign: 'center' }}>{subtitle}</Text>
      ) : null}
    </View>
  );
}
