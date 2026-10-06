/** NORA Withdraw — destination, amount, PIN authorization, truthful status. */
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { nora } from '../../api';
import { theme } from '../../theme';
import { s } from '../../design-system/screenStyles';
import { DarkCard, ErrorText, Field, flagFor, money, PrimaryButton, Row, StatusPill, Surface } from '../../ui';
import { err, NavTarget, User } from '../../types';


/* ============================== WITHDRAW ============================== */
export function WithdrawScreen({ user, back }: { user: User; back: () => void }) {
  const [amount, setAmount] = useState('');
  const [bankId, setBankId] = useState('');
  const [banks, setBanks] = useState<any[] | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<any | null>(null);

  useEffect(() => { nora.banks().then((b: any) => setBanks(Array.isArray(b) ? b : b?.banks ?? [])).catch(() => setBanks([])); }, []);

  const submit = async () => {
    setError('');
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0) { setError('Enter a valid amount.'); return; }
    if (!bankId) { setError('Pick a bank.'); return; }
    if (!accountNumber.trim()) { setError('Enter your account number.'); return; }
    if (pin.length < 4) { setError('Enter your PIN.'); return; }
    setBusy(true);
    try {
      const res = await nora.withdraw({ amount: amt, bankId, accountNumber: accountNumber.trim(), pin });
      setDone(res); setAmount(''); setAccountNumber(''); setPin('');
    } catch (e) { setError(err(e)); } finally { setBusy(false); }
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.pageInner}>
      <View style={s.sendHeader}><Pressable onPress={back}><Text style={s.backArrow}>←</Text></Pressable><Text style={s.screenTitle}>Withdraw</Text><Text> </Text></View>
      {done ? (
        <Surface style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 34 }}>✅</Text>
          <Text style={s.cardTitle}>Withdrawal initiated</Text>
          <Text style={s.receiptAmount}>{money(done.amount ?? done.debit_amount, user.currency)}</Text>
          <Text style={s.receiptRef}>Reference: {done.reference || done.id}</Text>
          <StatusPill status={done.status || 'PROCESSING'} />
          <View style={{ height: 14 }} />
          <PrimaryButton label="Done" onPress={back} />
        </Surface>
      ) : (
        <Surface>
          <Field label={`Amount (${user.currency || 'NGN'})`} value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="number-pad" />
          <Text style={s.fieldLabelX}>Bank</Text>
          {banks === null ? <ActivityIndicator color={theme.gold} /> : banks.length === 0 ? (
            <Field label="Bank name" value={bankId} onChangeText={setBankId} placeholder="e.g. Access Bank" />
          ) : (
            <View style={{ marginBottom: 6 }}>
              {banks.slice(0, 8).map((b: any) => (
                <Pressable key={b.id || b.code} onPress={() => setBankId(b.id || b.code)} style={[s.bankRow, bankId === (b.id || b.code) && s.bankRowOn]}>
                  <Text style={[s.bankLabel, bankId === (b.id || b.code) && s.bankRowOnLabel]}>{b.name || b.code}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <Field label="Account number" value={accountNumber} onChangeText={setAccountNumber} placeholder="0123456789" keyboardType="number-pad" />
          <Field label="PIN" value={pin} onChangeText={setPin} placeholder="••••" keyboardType="number-pad" secureTextEntry />
          <ErrorText>{error}</ErrorText>
          <PrimaryButton label="Withdraw" onPress={submit} loading={busy} />
        </Surface>
      )}
    </ScrollView>
  );
}

