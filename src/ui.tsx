/** Shared NORA mobile UI primitives — matches official brand design. */
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { theme } from './theme';

export const money = (v: number | string | undefined | null, currency = 'NGN') => {
  const n = typeof v === 'string' ? parseFloat(v) : v ?? 0;
  const symbol = currency === 'NGN' ? '₦' : currency === 'GHS' ? '₵' : currency === 'KES' ? 'KSh ' : '';
  return `${symbol}${(Number.isFinite(n) ? n : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const flagFor = (country?: string) => {
  const c = (country || '').toUpperCase();
  if (c.includes('GHANA') || c === 'GH' || c === 'GHS') return '🇬🇭';
  if (c.includes('NIGERIA') || c === 'NG' || c === 'NGN') return '🇳🇬';
  if (c.includes('KENYA') || c === 'KE' || c === 'KES') return '🇰🇪';
  return '🌍';
};

export function Surface({ style, children }: { style?: ViewStyle; children: React.ReactNode }) {
  return <View style={[styles.surface, style]}>{children}</View>;
}

export function DarkCard({ style, children }: { style?: ViewStyle; children: React.ReactNode }) {
  return <View style={[styles.darkCard, style]}>{children}</View>;
}

export function PrimaryButton({ label, onPress, disabled, loading, variant = 'dark' }: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean; variant?: 'dark' | 'gold' | 'outline' }) {
  const bg = variant === 'gold' ? theme.gold : variant === 'outline' ? 'transparent' : theme.dark;
  const labelColor = variant === 'gold' ? theme.dark : variant === 'outline' ? theme.dark : theme.textOnDark;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg },
        variant === 'outline' && { borderWidth: 1.5, borderColor: theme.border },
        pressed && { opacity: 0.85 },
        (disabled || loading) && { opacity: 0.45 },
      ]}
    >
      {loading ? <ActivityIndicator color={labelColor} /> : <Text style={[styles.btnLabel, { color: labelColor }]}>{label}</Text>}
    </Pressable>
  );
}

export function Field({ label, value, onChangeText, placeholder, keyboardType, secureTextEntry, autoCapitalize = 'none' }: {
  label: string; value: string; onChangeText: (t: string) => void; placeholder?: string;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad'; secureTextEntry?: boolean; autoCapitalize?: 'none' | 'characters';
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textDim}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
    </View>
  );
}

export function StatusPill({ status }: { status: string }) {
  const s = (status || '').toUpperCase();
  const color = s === 'COMPLETED' ? theme.green : s === 'FAILED' ? theme.red : theme.goldDeep;
  const bg = s === 'COMPLETED' ? 'rgba(30,158,90,0.12)' : s === 'FAILED' ? 'rgba(214,69,69,0.12)' : theme.pill;
  const label = s === 'COMPLETED' ? 'Completed' : s === 'FAILED' ? 'Failed' : s ? s[0] + s.slice(1).toLowerCase() : 'Processing';
  return (
    <View style={[styles.statusPill, { backgroundColor: bg }]}>
      <Text style={[styles.statusPillText, { color }]}>{label}</Text>
    </View>
  );
}

export function Row({ icon, title, subtitle, right, onPress }: { icon?: React.ReactNode; title: string; subtitle?: string; right?: React.ReactNode; onPress?: () => void }) {
  const Comp: any = onPress ? Pressable : View;
  return (
    <Comp onPress={onPress} style={styles.row}>
      {icon ? <View style={styles.rowIcon}>{icon}</View> : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      {right !== undefined ? right : (onPress ? <Text style={styles.chevron}>›</Text> : null)}
    </Comp>
  );
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <Text style={styles.error}>{children}</Text>;
}

const styles = StyleSheet.create({
  surface: { backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 16 },
  darkCard: { backgroundColor: theme.dark, borderRadius: 18, padding: 18 },
  btn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 6 },
  btnLabel: { fontWeight: '800', fontSize: 15, letterSpacing: 0.2 },
  fieldLabel: { color: theme.textDim, fontSize: 12, fontWeight: '700', marginBottom: 6, letterSpacing: 0.3 },
  input: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 12, color: theme.text, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  error: { color: theme.red, marginTop: 8, marginBottom: 4, fontSize: 13, lineHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: theme.border },
  rowIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: theme.pill, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowTitle: { color: theme.text, fontSize: 14, fontWeight: '600' },
  rowSub: { color: theme.textDim, fontSize: 12, marginTop: 2 },
  chevron: { color: theme.textDim, fontSize: 20, marginLeft: 6 },
});
