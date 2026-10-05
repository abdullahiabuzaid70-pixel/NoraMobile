/** Shared NORA mobile UI primitives. */
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { theme } from './theme';

export const money = (v: number | string | undefined | null, currency = 'NGN') => {
  const n = typeof v === 'string' ? parseFloat(v) : v ?? 0;
  return `${currency === 'NGN' ? '₦' : currency === 'GHS' ? '₵' : ''}${(Number.isFinite(n) ? n : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export function Card({ style, children }: { style?: ViewStyle; children: React.ReactNode }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function GoldButton({ label, onPress, disabled, loading, danger }: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean; danger?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.btn, (danger ? styles.btnDanger : null), pressed && styles.btnPress, (disabled || loading) && styles.btnDisabled]}
    >
      {loading ? <ActivityIndicator color={theme.bg} /> : <Text style={[styles.btnLabel, danger && styles.btnDangerLabel]}>{label}</Text>}
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

export function Pill({ children }: { children: React.ReactNode }) {
  return <View style={styles.pill}><Text style={styles.pillText}>{children}</Text></View>;
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <Text style={styles.error}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 16 },
  btn: { backgroundColor: theme.gold, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  btnDanger: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.red },
  btnDangerLabel: { color: theme.red },
  btnPress: { backgroundColor: theme.goldHover },
  btnDisabled: { opacity: 0.45 },
  btnLabel: { color: theme.bg, fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },
  fieldLabel: { color: theme.textDim, fontSize: 12, fontWeight: '700', marginBottom: 6, letterSpacing: 0.4, textTransform: 'uppercase' },
  input: { backgroundColor: 'rgba(0,0,0,0.25)', borderWidth: 1, borderColor: theme.border, borderRadius: 12, color: theme.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  pill: { backgroundColor: theme.pill, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  pillText: { color: theme.gold, fontSize: 11, fontWeight: '700' },
  error: { color: theme.red, marginTop: 8, marginBottom: 4, fontSize: 13, lineHeight: 18 },
});
