/** NORA authentication screen — session via AuthContext (tokens in secure storage). */
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { nora } from '../../api';
import { theme } from '../../theme';
import { s } from '../../design-system/screenStyles';
import { DarkCard, ErrorText, Field, flagFor, money, PrimaryButton, Row, StatusPill, Surface } from '../../ui';
import { err } from '../../types';
import { useAuth } from './AuthContext';


export function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [country, setCountry] = useState<'NG' | 'GH'>('NG');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [noraId, setNoraId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!phone.trim() || pin.length < 4) { setError('Enter your phone number and a 4-digit PIN.'); return; }
    if (mode === 'register' && (!firstName.trim() || !lastName.trim())) { setError('Enter your first and last name.'); return; }
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(country, phone.trim(), pin);
      } else {
        await register({ firstName: firstName.trim(), lastName: lastName.trim(), country, phone: phone.trim(), pin, noraId: noraId.trim() || undefined });
      }
    } catch (e) { setError(err(e)); } finally { setBusy(false); }
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.pageInner}>
      <View style={s.logoWrap}>
        <Text style={s.logoMark}>⟲</Text>
        <Text style={s.logo}>NORA</Text>
        <Text style={s.logoSub}>Africa's Financial Network</Text>
        <Text style={s.tagline}>Move money across Africa like it's local.</Text>
      </View>
      <Surface>
        <Text style={s.cardTitle}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</Text>
        <View style={s.countryRow}>
          {(['NG', 'GH'] as const).map((c) => (
            <Pressable key={c} onPress={() => setCountry(c)} style={[s.countryBtn, country === c && s.countryOn]}>
              <Text style={[s.countryLabel, country === c && s.countryOnLabel]}>{c === 'NG' ? '🇳🇬 Nigeria' : '🇬🇭 Ghana'}</Text>
            </Pressable>
          ))}
        </View>
        {mode === 'register' && (
          <>
            <Field label="First name" value={firstName} onChangeText={setFirstName} placeholder="Abdullahi" />
            <Field label="Last name" value={lastName} onChangeText={setLastName} placeholder="Abuzaid" />
            <Field label="NORA ID (optional)" value={noraId} onChangeText={setNoraId} placeholder="@abuzaid" />
          </>
        )}
        <Field label="Phone number" value={phone} onChangeText={setPhone} placeholder="080..." keyboardType="phone-pad" />
        <Field label="PIN" value={pin} onChangeText={setPin} placeholder="••••" keyboardType="number-pad" secureTextEntry />
        <ErrorText>{error}</ErrorText>
        <PrimaryButton label={mode === 'login' ? 'Sign in' : 'Create account'} onPress={submit} loading={busy} />
        <Pressable onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          <Text style={s.switchMode}>{mode === 'login' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}</Text>
        </Pressable>
      </Surface>
      <Text style={s.footNote}>Sandbox pilot — funds are simulated. Backend is the single source of truth.</Text>
    </ScrollView>
  );
}

