/** NORA Add Money — funding via provider-backed endpoints. */
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { nora } from '../../api';
import { theme } from '../../theme';
import { s } from '../../design-system/screenStyles';
import { DarkCard, ErrorText, Field, flagFor, money, PrimaryButton, Row, StatusPill, Surface } from '../../ui';
import { err, NavTarget, User } from '../../types';


/* ============================== FUND ============================== */
export function FundScreen({ user, back }: { user: User; back: () => void }) {
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<any | null>(null);

  const submit = async () => {
    setError('');
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0) { setError('Enter a valid amount.'); return; }
    if (pin.length < 4) { setError('Enter your PIN.'); return; }
    setBusy(true);
    try { setDone(await nora.fund({ amount: amt, source: 'bank_transfer', pin })); setAmount(''); setPin(''); }
    catch (e) { setError(err(e)); } finally { setBusy(false); }
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.pageInner}>
      <View style={s.sendHeader}><Pressable onPress={back}><Text style={s.backArrow}>←</Text></Pressable><Text style={s.screenTitle}>Add Money</Text><Text> </Text></View>
      {done ? (
        <Surface style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 34 }}>✅</Text>
          <Text style={s.cardTitle}>Money added</Text>
          <Text style={s.receiptAmount}>{money(done.amount ?? done.credit_amount, user.currency)}</Text>
          <Text style={s.receiptRef}>Reference: {done.reference || done.id}</Text>
          <PrimaryButton label="Done" onPress={back} />
        </Surface>
      ) : (
        <Surface>
          <Text style={s.rowSubtle}>Simulated bank transfer (sandbox pilot).</Text>
          <View style={{ height: 10 }} />
          <Field label={`Amount (${user.currency || 'NGN'})`} value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="number-pad" />
          <Field label="PIN" value={pin} onChangeText={setPin} placeholder="••••" keyboardType="number-pad" secureTextEntry />
          <ErrorText>{error}</ErrorText>
          <PrimaryButton label="Add money" onPress={submit} loading={busy} />
        </Surface>
      )}
    </ScrollView>
  );
}

