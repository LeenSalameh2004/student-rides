import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, radius, space, shadow } from '../theme';
import { toggleLanguage } from '../i18n';

export function Screen({ children, scroll = true, padded = true, edges = ['top'] }) {
  const body = padded ? <View style={styles.padded}>{children}</View> : children;
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      {scroll ? (
        <ScrollView contentContainerStyle={{ paddingBottom: space(10) }} keyboardShouldPersistTaps="handled">
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

export function Title({ children, style }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function Subtitle({ children, style }) {
  return <Text style={[styles.subtitle, style]}>{children}</Text>;
}

export function Muted({ children, style }) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}

export function Card({ children, style, onPress }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Row({ children, style, gap = 8 }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

const variants = {
  primary: { bg: colors.primary, fg: colors.white, border: colors.primary },
  secondary: { bg: colors.white, fg: colors.primary, border: colors.primary },
  danger: { bg: colors.danger, fg: colors.white, border: colors.danger },
  ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
  success: { bg: colors.success, fg: colors.white, border: colors.success },
};

export function Button({ title, onPress, variant = 'primary', loading, disabled, style, small }) {
  const v = variants[variant] || variants.primary;
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: v.bg, borderColor: v.border, opacity: off ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <Text style={[styles.buttonText, small && { fontSize: 14 }, { color: v.fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Field({ label, style, ...props }) {
  return (
    <View style={[{ marginBottom: space(3) }, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput placeholderTextColor={colors.muted} style={styles.input} {...props} />
    </View>
  );
}

export function Chip({ label, selected, onPress, color = colors.primary }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && { backgroundColor: color, borderColor: color }]}
    >
      <Text style={[styles.chipText, selected && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

// Horizontal set of chips where exactly one is selected.
export function ChipGroup({ options, value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: space(3) }}>
      {options.map((o) => (
        <Chip key={o.value} label={o.label} selected={value === o.value} onPress={() => onChange(o.value)} />
      ))}
    </View>
  );
}

export function SwitchRow({ label, value, onValueChange }) {
  return (
    <Row style={{ justifyContent: 'space-between', marginBottom: space(3) }}>
      <Text style={styles.label}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.primary }} />
    </Row>
  );
}

export function Badge({ label, color = colors.primary, soft }) {
  return (
    <View style={[styles.badge, { backgroundColor: soft || color + '22' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function Empty({ text }) {
  return (
    <View style={{ padding: space(8), alignItems: 'center' }}>
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}

export function Loading() {
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.muted, { marginTop: 8 }]}>{t('common.loading')}</Text>
    </View>
  );
}

export function LangToggle({ style }) {
  const { t } = useTranslation();
  return (
    <Pressable onPress={toggleLanguage} style={[styles.lang, style]} accessibilityLabel={t('common.language')}>
      <Text style={{ color: colors.primary, fontWeight: '700' }}>🌐 {t('common.switchTo')}</Text>
    </Pressable>
  );
}

export function Stat({ label, value, color = colors.primary }) {
  return (
    <View style={[styles.card, { flex: 1, minWidth: 140, marginBottom: 0 }]}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={{ fontSize: 22, fontWeight: '800', color, marginTop: 4 }}>{value}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  padded: { padding: space(4) },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: space(2), textAlign: 'left' },
  subtitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginVertical: space(2), textAlign: 'left' },
  muted: { fontSize: 14, color: colors.muted, textAlign: 'left' },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space(4), marginBottom: space(3), ...shadow },
  button: {
    minHeight: 50, borderRadius: radius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: space(4), marginVertical: space(1),
  },
  buttonSmall: { minHeight: 38, paddingHorizontal: space(3) },
  buttonText: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6, textAlign: 'left' },
  input: {
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: space(3), paddingVertical: space(3), fontSize: 16, color: colors.text, textAlign: 'auto',
  },
  chip: {
    paddingHorizontal: space(4), paddingVertical: space(2), borderRadius: radius.pill, borderWidth: 1.5,
    borderColor: colors.border, backgroundColor: colors.white,
  },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.text },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  lang: { alignSelf: 'flex-end', padding: space(2) },
});
