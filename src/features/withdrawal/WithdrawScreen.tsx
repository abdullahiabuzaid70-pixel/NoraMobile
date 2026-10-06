/**
 * NORA Withdraw — bank destination, amount, PIN, truthful receipt.
 *
 * Idempotency key is stable per withdrawal attempt: a timeout re-confirms,
 * never double-debits. outcomeUnknown → "still confirming" (§12).
 */
import React, { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { theme } from '../../theme';
import { s } from '../../design-system/screenStyles';
import { ErrorText, Field, PrimaryButton, Surface } from '../../ui';
import { fromUserInput } from '../../domain/money';
import { accountApi, Bank, paymentsApi, Transaction } from '../../services/api/noraClient';
import { ApiError, newIdempotencyKey } from '../../services/api/client';
import { err, User } from '../../types';
import { ReceiptView } from '../receipt/ReceiptView';

export function WithdrawScreen({ user, back }: { user: User; back: () => void }) {
  const [amount, setAmount] = useState('');
  const [bankId, setBankId] = useState('');
  const [banks, setBanks] = useState<Bank[] | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<Transaction | null>(null);
  const [confirming, setConfirming] = useState(false);
  const idemKeyRef = useRef<string | null>(null);

  const srcCurrency = user.currency || 'NGN';

  useEffect(() => {
    accountApi.banks().then((b: any) => setBanks(Array.isArray(b) ? b : b?.banks ?? [])).catch(() => setBanks([]));
  }, []);

  const submit = async () => {
    setError('');
    const amt = fromUserInput(amount, srcCurrency);
    if (!amt) { setError('Enter a valid amount.'); return; }
    if (!bankId) { setError('Pick a bank.'); return; }
    if (!accountNumber.trim()) { setError('Enter your account number.'); return; }
    if (pin.length < 4) { setError('Enter your PIN.'); return; }
    setBusy(true);
    if (!idemKeyRef.current) idemKeyRef.current = newIdempotencyKey();
    try {
      const res = await paymentsApi.withdraw({
        amount: amt.amountMinor / 100,
        bankId,
        accountNumber: accountNumber.trim(),
        pin,
        idempotencyKey: idemKeyRef.current, // stable across retries
      });
      setReceipt(res);
      setAmount(''); setAccountNumber(''); setPin('');
    } catch (e) {
      if (e instanceof ApiError && e.outcomeUnknown) {
        setConfirming(true); setReceipt({} as Transaction);
      } else { setError(err(e)); }
    } finally { setBusy(false); }
  };

  const selectedBank = banks?.find((b: Bank) => (b.id || b.code) === bankId);

  return (
    <ScrollView style={s.page} contentContainerStyle={s.pageInner}>
      <View style={s.sendHeader}>
        <Pressable onPress={back}><Ionicons name="arrow-back" size={22} color={theme.text} /></Pressable>
        <Text style={s.screenTitle}>Withdraw</Text>
      </View>
      {receipt ? (
        <ReceiptView
          title="Withdrawal initiated"
          status={receipt.status}
          confirming={confirming}
          amount={confirming ? { amountMinor: 0, currency: srcCurrency } : { amountMinor: Math.round(Number(receipt.amount ?? receipt.debit_amount ?? 0) * 100), currency: srcCurrency }}
          reference={receipt.reference || receipt.id}
          recipientLabel={selectedBank ? `${selectedBank.name || selectedBank.code} · ${accountNumber.trim()}` : accountNumber.trim()}
          onDone={back}
        />
      ) : (
        <Surface>
          <Field label={`Amount (${srcCurrency})`} value={amount} onChangeText={(t) => { setAmount(t); idemKeyRef.current = null; }} placeholder="0.00" keyboardType="number-pad" />
          <Text style={s.fieldLabelX}>Bank</Text>
          {banks === null ? <ActivityIndicator color={theme.gold} /> : banks.length === 0 ? (
            <Field label="Bank name" value={bankId} onChangeText={setBankId} placeholder="e.g. Access Bank" />
          ) : (
            <View style={{ marginBottom: 6 }}>
              {banks.slice(0, 8).map((b: Bank) => (
                <Pressable key={b.id || b.code} onPress={() => setBankId(b.id || b.code || '')} style={[s.bankRow, bankId === (b.id || b.code) && s.bankRowOn]}>
                  <Text style={[s.bankLabel, bankId === (b.id || b.code) && s.bankRowOnLabel]}>{b.name || b.code}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <Field label="Account number" value={accountNumber} onChangeText={setAccountNumber} placeholder="0123456789" keyboardType="number-pad" />
          <Field label="PIN" value={pin} onChangeText={setPin} placeholder="••••" keyboardType="number-pad" secureTextEntry />
          <ErrorText>{error}</ErrorText>
          <PrimaryButton label="Withdraw" onPress={submit} loading={busy} />
          <Text style={s.footNote}>Your PIN authorizes this withdrawal. No PIN, no money moves.</Text>
        </Surface>
      )}
    </ScrollView>
  );
}
