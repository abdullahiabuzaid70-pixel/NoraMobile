/** NORA mobile screens — mirrors the web app flows.
 * §RULE: Intent ≠ Authorization. Money moves only after the human enters their PIN. */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { nora, setToken, ApiError } from './api';
import { theme } from './theme';
import { Card, ErrorText, Field, GoldButton, money, Pill } from './ui';

export type User = { nora_id?: string; first_name?: string; last_name?: string; country?: string; currency?: string; phone?: string };
type Screen = 'home' | 'send' | 'fund' | 'withdraw' | 'activity' | 'profile';

const err = (e: unknown) => e instanceof ApiError ? e.message : 'Network error — check your connection and try again.';

/* ============================== AUTH ============================== */
export function AuthScreen({ onAuthed }: { onAuthed: (u: User, t: string) => void }) {
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
      const res = mode === 'login'
        ? await nora.login(country, phone.trim(), pin)
        : await nora.register({ firstName: firstName.trim(), lastName: lastName.trim(), country, phone: phone.trim(), pin, noraId: noraId.trim() || undefined });
      setToken(res.token);
      onAuthed(res.user, res.token);
    } catch (e) {
      setError(err(e));
    } finally { setBusy(false); }
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.pageInner}>
      <View style={s.logoWrap}>
        <Text style={s.logo}>NORA</Text>
        <Text style={s.tagline}>Move money across Africa like it's local.</Text>
      </View>
      <Card>
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
            <Field label="First name" value={firstName} onChangeText={setFirstName} placeholder="Abdullahi" autoCapitalize="none" />
            <Field label="Last name" value={lastName} onChangeText={setLastName} placeholder="Abuzaid" autoCapitalize="none" />
            <Field label="NORA ID (optional)" value={noraId} onChangeText={setNoraId} placeholder="@abuzaid" autoCapitalize="none" />
          </>
        )}
        <Field label="Phone number" value={phone} onChangeText={setPhone} placeholder="080..." keyboardType="phone-pad" />
        <Field label="PIN" value={pin} onChangeText={setPin} placeholder="••••" keyboardType="number-pad" secureTextEntry />
        <ErrorText>{error}</ErrorText>
        <GoldButton label={mode === 'login' ? 'Sign in' : 'Create account'} onPress={submit} loading={busy} />
        <Pressable onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          <Text style={s.switchMode}>{mode === 'login' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}</Text>
        </Pressable>
      </Card>
      <Text style={s.footNote}>Sandbox pilot — funds are simulated. Backend is the single source of truth.</Text>
    </ScrollView>
  );
}

/* ============================== HOME ============================== */
export function HomeScreen({ user, go }: { user: User; go: (s: 'send' | 'fund' | 'withdraw' | 'activity') => void }) {
  const [balances, setBalances] = useState<any[] | null>(null);
  const [rates, setRates] = useState<any[] | null>(null);
  const [recent, setRecent] = useState<any[] | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const [b, r, a] = await Promise.all([
        nora.balances().catch(() => null),
        nora.fxRates().catch(() => null),
        nora.activity().catch(() => null),
      ]);
      setBalances(Array.isArray(b) ? b : b?.balances ?? []);
      setRates(Array.isArray(r) ? r : r?.rates ?? null);
      setRecent(Array.isArray(a) ? a.slice(0, 3) : a?.transactions?.slice(0, 3) ?? []);
    } catch (e) { setError(err(e)); }
  };
  useEffect(() => { load(); }, []);

  const main = balances?.find((x: any) => x.currency === (user.currency || 'NGN')) || balances?.[0];
  const currency = main?.currency || user.currency || 'NGN';
  const available = main?.available ?? main?.balance ?? main?.available_balance ?? 0;

  return (
    <ScrollView style={s.page} contentContainerStyle={s.pageInner} refreshControl={undefined}>
      <Text style={s.greeting}>Hi {user.first_name || 'there'} 👋</Text>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Card style={{ alignItems: 'flex-start' }}>
        <Text style={s.balanceLabel}>Available balance</Text>
        {balances === null && !error ? <ActivityIndicator color={theme.gold} style={{ marginTop: 8 }} /> : (
          <Text style={s.balanceAmount}>{money(available, currency)}</Text>
        )}
        <View style={{ marginTop: 8, flexDirection: 'row', gap: 8 }}>
          <Pill>{user.nora_id ? `@${String(user.nora_id).replace('@', '')}` : 'No NORA ID'}</Pill>
          <Pill>Sandbox</Pill>
        </View>
      </Card>

      <View style={s.actions}>
        <ActionIcon emoji="💸" label="Send" onPress={() => go('send')} />
        <ActionIcon emoji="➕" label="Add Money" onPress={() => go('fund')} />
        <ActionIcon emoji="🏦" label="Withdraw" onPress={() => go('withdraw')} />
      </View>

      {rates && rates.length > 0 && (
        <Card>
          <Text style={s.sectionTitle}>FX rates today</Text>
          {rates.slice(0, 3).map((r: any, i: number) => (
            <View key={i} style={s.rateRow}>
              <Text style={s.ratePair}>{r.pair || r.from || 'NGN'} → {r.to || 'GHS'}</Text>
              <Text style={s.rateValue}>{r.rate ?? r.mid ?? '—'}</Text>
            </View>
          ))}
        </Card>
      )}

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={s.sectionTitle}>Recent activity</Text>
          <Pressable onPress={() => go('activity')}><Text style={s.link}>See all</Text></Pressable>
        </View>
        {recent === null && !error ? <ActivityIndicator color={theme.gold} style={{ marginTop: 8 }} /> :
          recent && recent.length > 0 ? recent.map((t: any, i: number) => <TxRow key={t.id || i} tx={t} />) :
          <Text style={s.empty}>No transactions yet. Send money to get started.</Text>}
      </Card>
    </ScrollView>
  );
}

function ActionIcon({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <Pressable style={s.actionBtn} onPress={onPress}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text style={s.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function TxRow({ tx }: { tx: any }) {
  const status = (tx.status || '').toUpperCase();
  const statusColor = status === 'COMPLETED' ? theme.green : status === 'FAILED' ? theme.red : theme.gold;
  return (
    <View style={s.txRow}>
      <View style={{ flex: 1 }}>
        <Text style={s.txTitle}>{tx.description || tx.type || 'Transfer'}</Text>
        <Text style={s.txSub}>{tx.created_at ? new Date(tx.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''} · {status}</Text>
      </View>
      <Text style={[stylesAny, { color: statusColor, fontWeight: '800' }]}>{money(tx.amount, tx.currency)}</Text>
    </View>
  );
}

/* ============================== SEND ============================== */
export function SendScreen({ user }: { user: User }) {
  const [recipient, setRecipient] = useState('');
  const [resolved, setResolved] = useState<any | null>(null);
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<any | null>(null);
  const [pin, setPin] = useState('');
  const [pinOpen, setPinOpen] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const doResolve = async () => {
    setError(''); setResolved(null); setQuote(null);
    if (!recipient.trim()) { setError('Enter a recipient NORA ID.'); return; }
    setBusy(true);
    try { setResolved(await nora.resolveNoraId(recipient.trim())); }
    catch (e) { setError(err(e)); }
    finally { setBusy(false); }
  };

  const doQuote = async () => {
    setError(''); setQuote(null);
    const amt = parseFloat(amount);
    if (!resolved) { setError('Resolve the recipient first.'); return; }
    if (!Number.isFinite(amt) || amt <= 0) { setError('Enter a valid amount.'); return; }
    setBusy(true);
    try { setQuote(await nora.createQuote(recipient.trim(), amt)); }
    catch (e) { setError(err(e)); }
    finally { setBusy(false); }
  };

  const doAuthorize = async () => {
    setError(''); setBusy(true);
    try {
      const res = await nora.authorizeTransfer(quote?.id || quote?.quote_id, pin);
      setReceipt(res); setPinOpen(false); setPin(''); setQuote(null); setResolved(null); setRecipient(''); setAmount('');
    } catch (e) { setError(err(e)); }
    finally { setBusy(false); }
  };

  if (receipt) {
    return (
      <ScrollView style={s.page} contentContainerStyle={s.pageInner}>
        <Card style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 34 }}>✅</Text>
          <Text style={s.cardTitle}>Transfer sent</Text>
          <Text style={s.receiptAmount}>{money(receipt.amount ?? receipt.debit_amount, receipt.currency || user.currency)}</Text>
          <Text style={s.receiptRef}>Reference: {receipt.reference || receipt.id}</Text>
          <Text style={s.receiptStatus}>Status: {String((receipt.status || 'PROCESSING')).toUpperCase()}</Text>
          <GoldButton label="Done" onPress={() => setReceipt(null)} />
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={s.page} contentContainerStyle={s.pageInner}>
      <Text style={s.screenTitle}>Send money</Text>
      <Card>
        <Field label="Recipient NORA ID" value={recipient} onChangeText={setRecipient} placeholder="@friend" autoCapitalize="none" />
        <GoldButton label="Resolve recipient" onPress={doResolve} loading={busy && !quote} />
        {resolved && (
          <View style={s.resolvedBox}>
            <Text style={s.resolvedName}>{resolved.display_name || resolved.name || `${resolved.first_name || ''} ${resolved.last_name || ''}`.trim() || 'Recipient'}</Text>
            <Text style={s.resolvedSub}>{resolved.nora_id || recipient} · {resolved.country || ''}</Text>
          </View>
        )}
        <Field label={`Amount (${user.currency || 'NGN'})`} value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="number-pad" />
        <GoldButton label="Get quote" onPress={doQuote} loading={busy && !!resolved} disabled={!resolved} />
        {quote && (
          <View style={s.quoteBox}>
            <View style={s.rateRow}><Text style={s.quoteLine}>Recipient gets</Text><Text style={s.quoteValue}>{money(quote.receive_amount ?? quote.recipient_amount ?? quote.amount, quote.recipient_currency || quote.currency)}</Text></View>
            <View style={s.rateRow}><Text style={s.quoteLine}>Rate</Text><Text style={s.quoteValue}>{quote.rate ?? '—'}</Text></View>
            <View style={s.rateRow}><Text style={s.quoteLine}>Fee</Text><Text style={s.quoteValue}>{money(quote.fee ?? quote.fee_amount)}</Text></View>
          </View>
        )}
        <ErrorText>{error}</ErrorText>
        <GoldButton label="Confirm & Send" onPress={() => setPinOpen(true)} disabled={!quote} />
        <Text style={s.footNote}>Your PIN authorizes the transfer. No PIN, no money moves.</Text>
      </Card>

      {pinOpen && (
        <Card style={{ marginTop: 12 }}>
          <Text style={s.cardTitle}>Enter PIN to authorize</Text>
          <Text style={s.authorizeHint}>Sending {money(quote?.receive_amount ?? quote?.amount, quote?.recipient_currency || user.currency)} to {resolved?.display_name || resolved?.name || recipient}</Text>
          <Field label="PIN" value={pin} onChangeText={setPin} keyboardType="number-pad" secureTextEntry />
          <GoldButton label="Authorize transfer" onPress={doAuthorize} loading={busy} />
          <Pressable onPress={() => { setPinOpen(false); setPin(''); }}><Text style={s.switchMode}>Cancel</Text></Pressable>
        </Card>
      )}
    </ScrollView>
  );
}

/* ============================== FUND ============================== */
export function FundScreen({ user }: { user: User }) {
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
    try {
      const res = await nora.fund({ amount: amt, source: 'bank_transfer', pin });
      setDone(res); setAmount(''); setPin('');
    } catch (e) { setError(err(e)); }
    finally { setBusy(false); }
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.pageInner}>
      <Text style={s.screenTitle}>Add money</Text>
      {done ? (
        <Card style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 34 }}>✅</Text>
          <Text style={s.cardTitle}>Money added</Text>
          <Text style={s.receiptAmount}>{money(done.amount ?? done.credit_amount, user.currency)}</Text>
          <Text style={s.receiptRef}>Reference: {done.reference || done.id}</Text>
          <GoldButton label="Add more" onPress={() => setDone(null)} />
        </Card>
      ) : (
        <Card>
          <Text style={s.cardHint}>Simulated bank transfer (sandbox pilot).</Text>
          <Field label={`Amount (${user.currency || 'NGN'})`} value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="number-pad" />
          <Field label="PIN" value={pin} onChangeText={setPin} placeholder="••••" keyboardType="number-pad" secureTextEntry />
          <ErrorText>{error}</ErrorText>
          <GoldButton label="Add money" onPress={submit} loading={busy} />
        </Card>
      )}
    </ScrollView>
  );
}

/* ============================== WITHDRAW ============================== */
export function WithdrawScreen({ user }: { user: User }) {
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
    } catch (e) { setError(err(e)); }
    finally { setBusy(false); }
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.pageInner}>
      <Text style={s.screenTitle}>Withdraw to bank</Text>
      {done ? (
        <Card style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 34 }}>✅</Text>
          <Text style={s.cardTitle}>Withdrawal initiated</Text>
          <Text style={s.receiptAmount}>{money(done.amount ?? done.debit_amount, user.currency)}</Text>
          <Text style={s.receiptRef}>Reference: {done.reference || done.id}</Text>
          <Text style={s.receiptStatus}>Status: {String((done.status || 'PROCESSING')).toUpperCase()}</Text>
          <GoldButton label="New withdrawal" onPress={() => setDone(null)} />
        </Card>
      ) : (
        <Card>
          <Field label={`Amount (${user.currency || 'NGN'})`} value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="number-pad" />
          <Text style={[s.fieldLabelX]}>Bank</Text>
          {banks === null ? <ActivityIndicator color={theme.gold} /> : banks.length === 0 ? (
            <Field label="Bank name" value={bankId} onChangeText={setBankId} placeholder="e.g. Access Bank" />
          ) : (
            <View style={s.bankList}>
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
          <GoldButton label="Withdraw" onPress={submit} loading={busy} />
        </Card>
      )}
    </ScrollView>
  );
}

/* ============================== ACTIVITY ============================== */
export function ActivityScreen() {
  const [list, setList] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const load = async () => {
    setError('');
    try {
      const a = await nora.activity();
      setList(Array.isArray(a) ? a : a?.transactions ?? []);
    } catch (e) { setError(err(e)); }
  };
  useEffect(() => { load(); }, []);
  return (
    <View style={[s.page, { padding: 18 }]}>
      <Text style={s.screenTitle}>Activity</Text>
      <ErrorText>{error}</ErrorText>
      {list === null && !error ? <ActivityIndicator color={theme.gold} style={{ marginTop: 24 }} /> :
        <FlatList
          data={list}
          keyExtractor={(_, i) => String(i)}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: theme.border }} />}
          renderItem={({ item }) => <TxRow tx={item} />}
          ListEmptyComponent={<Text style={s.empty}>No transactions yet.</Text>}
          contentContainerStyle={{ paddingBottom: 120 }}
        />}
    </View>
  );
}

/* ============================== PROFILE ============================== */
export function ProfileScreen({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <ScrollView style={s.page} contentContainerStyle={[s.pageInner, { paddingBottom: 120 }]}>
      <Text style={s.screenTitle}>Profile</Text>
      <Card>
        <Text style={s.profileName}>{user.first_name} {user.last_name}</Text>
        <Text style={s.resolvedSub}>{user.nora_id ? `@${String(user.nora_id).replace('@', '')}` : 'No NORA ID yet'}</Text>
        <View style={{ height: 12 }} />
        <View style={s.rateRow}><Text style={s.quoteLine}>Phone</Text><Text style={s.quoteValue}>{user.phone || '—'}</Text></View>
        <View style={s.rateRow}><Text style={s.quoteLine}>Country</Text><Text style={s.quoteValue}>{user.country || '—'}</Text></View>
        <View style={s.rateRow}><Text style={s.quoteLine}>Currency</Text><Text style={s.quoteValue}>{user.currency || 'NGN'}</Text></View>
      </Card>
      <GoldButton label="Sign out" onPress={onLogout} danger />
    </ScrollView>
  );
}

const stylesAny: any = {};
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg },
  pageInner: { padding: 18, paddingBottom: 120 },
  logoWrap: { alignItems: 'center', marginVertical: 36 },
  logo: { fontSize: 44, fontWeight: '900', letterSpacing: 6, color: theme.gold },
  tagline: { color: theme.textDim, marginTop: 8, fontSize: 13 },
  greeting: { color: theme.text, fontSize: 22, fontWeight: '800', marginBottom: 14 },
  screenTitle: { color: theme.text, fontSize: 22, fontWeight: '800', marginBottom: 14 },
  cardTitle: { color: theme.text, fontSize: 18, fontWeight: '800', marginBottom: 12 },
  cardHint: { color: theme.textDim, fontSize: 13, marginBottom: 10 },
  balanceLabel: { color: theme.textDim, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceAmount: { color: theme.text, fontSize: 34, fontWeight: '900', marginTop: 6 },
  actions: { flexDirection: 'row', gap: 10, marginVertical: 14 },
  actionBtn: { flex: 1, backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, alignItems: 'center', paddingVertical: 16 },
  actionLabel: { color: theme.text, fontWeight: '700', marginTop: 6, fontSize: 12 },
  sectionTitle: { color: theme.text, fontWeight: '800', fontSize: 15, marginBottom: 10 },
  link: { color: theme.gold, fontWeight: '700', fontSize: 13 },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  ratePair: { color: theme.textDim, fontSize: 14 },
  rateValue: { color: theme.text, fontSize: 14, fontWeight: '700' },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  txTitle: { color: theme.text, fontWeight: '700', fontSize: 14 },
  txSub: { color: theme.textDim, fontSize: 12, marginTop: 2 },
  empty: { color: theme.textDim, fontSize: 14, paddingVertical: 8 },
  resolvedBox: { backgroundColor: 'rgba(34,197,94,0.10)', borderRadius: 12, padding: 12, marginVertical: 8, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' },
  resolvedName: { color: theme.text, fontWeight: '800', fontSize: 15 },
  resolvedSub: { color: theme.textDim, fontSize: 12, marginTop: 2 },
  quoteBox: { backgroundColor: 'rgba(213,156,35,0.10)', borderRadius: 12, padding: 12, marginVertical: 10 },
  quoteLine: { color: theme.textDim, fontSize: 14 },
  quoteValue: { color: theme.text, fontSize: 14, fontWeight: '800' },
  authorizeHint: { color: theme.textDim, fontSize: 13, marginBottom: 10 },
  receiptAmount: { color: theme.text, fontSize: 28, fontWeight: '900', marginVertical: 6 },
  receiptRef: { color: theme.textDim, fontSize: 12, marginBottom: 4 },
  receiptStatus: { color: theme.gold, fontSize: 13, fontWeight: '700', marginBottom: 12 },
  countryRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  countryBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  countryOn: { backgroundColor: theme.pill, borderColor: theme.gold },
  countryLabel: { color: theme.textDim, fontWeight: '700' },
  countryOnLabel: { color: theme.gold },
  switchMode: { color: theme.gold, textAlign: 'center', marginTop: 14, fontWeight: '600', fontSize: 13 },
  footNote: { color: theme.textDim, fontSize: 11, textAlign: 'center', marginTop: 16, lineHeight: 16 },
  profileName: { color: theme.text, fontSize: 20, fontWeight: '800' },
  fieldLabelX: { color: theme.textDim, fontSize: 12, fontWeight: '700', marginBottom: 6, letterSpacing: 0.4, textTransform: 'uppercase' },
  bankList: { marginBottom: 6 },
  bankRow: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 6 },
  bankRowOn: { backgroundColor: theme.pill, borderColor: theme.gold },
  bankLabel: { color: theme.textDim, fontSize: 14 },
  bankRowOnLabel: { color: theme.gold, fontWeight: '700' },
});
