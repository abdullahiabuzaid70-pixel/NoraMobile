/**
 * NORA Add Money — funding via provider-backed endpoints.
 *
 * Money movement rules apply to funding too: idempotency key per attempt
 * (stable across retries), outcomeUnknown → "still confirming", domain money.
 */
import React, { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { theme } from '../../theme';
import { s } from '../../design-system/screenStyles';
import { ErrorText, Field, PrimaryButton, Surface } from '../../ui';
import { format, fromUserInput } from '../../domain/money';
import { paymentsApi, Transaction } from '../../services/api/noraClient';
import { ApiError, newIdempotencyKey } from '../../services/api/client';
import { err, User } from '../../types';
import { ReceiptView } from '../receipt/ReceiptView';

export function FundScreen({ user, back }: { user: User; back: () => void }) {
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<Transaction | null>(null);
  const [confirming, setConfirming] = useState(false);
  const idemKeyRef = useRef<string | null>(null);

  const srcCurrency = user.currency || 'NGN';

  const submit = async () => {
    setError('');
    const amt = fromUserInput(amount, srcCurrency);
    if (!amt) { setError('Enter a valid amount.'); return; }
    if (pin.length < 4) { setError('Enter your PIN.'); return; }
    setBusy(true);
    if (!idemKeyRef.current) idemKeyRef.current = newIdempotencyKey();
    try {
      const res = await paymentsApi.fund({
        amount: amt.amountMinor / 100,
        source: 'bank_transfer',
        pin,
        idempotencyKey: idemKeyRef.current, // stable across retries
      });
      setReceipt(res);
      setAmount(''); setPin('');
    } catch (e) {
      if (e instanceof ApiError && e.outcomeUnknown) {
        setConfirming(true); setReceipt({} as Transaction);
      } else { setError(err(e)); }
    } finally { setBusy(false); }
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.pageInner}>
      <View style={s.sendHeader}>
        <Pressable onPress={back}><Ionicons name="arrow-back" size={22} color={theme.text} /></Pressable>
        <Text style={s.screenTitle}>Add Money</Text>
      </View>
      {receipt ? (
        <ReceiptView
          title="Money added"
          status={receipt.status}
          confirming={confirming}
          amount={fromUserInput(amount || String(receipt.amount ?? receipt.credit_amount ?? 0), srcCurrency) || { amountMinor: Math.round(Number(receipt.amount ?? receipt.credit_amount ?? 0) * 100), currency: srcCurrency }}
          reference={receipt.reference || receipt.id}
          onDone={back}
        />
      ) : (
        <Surface>
          <Text style={s.rowSubtle}>Simulated bank transfer (sandbox pilot).</Text>
          <View style={{ height: 10 }} />
          <Field label={`Amount (${srcCurrency})`} value={amount} onChangeText={(t) => { setAmount(t); idemKeyRef.current = null; }} placeholder="0.00" keyboardType="number-pad" />
          <Field label="PIN" value={pin} onChangeText={setPin} placeholder="••••" keyboardType="number-pad" secureTextEntry />
          <ErrorText>{error}</ErrorText>
          <PrimaryButton label="Add money" onPress={submit} loading={busy} />
          <Text style={s.footNote}>Your PIN authorizes this funding. No PIN, no money moves.</Text>
        </Surface>
      )}
    </ScrollView>
  );
}
