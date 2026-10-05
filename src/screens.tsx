/** NORA mobile screens — matches the official brand design (light bg, dark-green cards, gold accents).
 * §RULE: Intent ≠ Authorization. Money moves only after the human enters their PIN. */
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { nora, setToken, ApiError } from './api';
import { theme } from './theme';
import { DarkCard, ErrorText, Field, flagFor, money, PrimaryButton, Row, StatusPill, Surface } from './ui';

export type User = { nora_id?: string; first_name?: string; last_name?: string; country?: string; currency?: string; phone?: string; email?: string };
type NavTarget = 'send' | 'activity' | 'accounts' | 'fund' | 'withdraw';

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

/* ============================== HOME ============================== */
export function HomeScreen({ user, go }: { user: User; go: (s: NavTarget) => void }) {
  const [balances, setBalances] = useState<any[] | null>(null);
  const [recent, setRecent] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [hidden, setHidden] = useState(false);

  const load = async () => {
    setError('');
    try {
      const [b, a] = await Promise.all([nora.balances().catch(() => null), nora.activity().catch(() => null)]);
      setBalances(Array.isArray(b) ? b : b?.balances ?? []);
      setRecent(Array.isArray(a) ? a.slice(0, 4) : a?.transactions?.slice(0, 4) ?? []);
    } catch (e) { setError(err(e)); }
  };
  useEffect(() => { load(); }, []);

  const main = balances?.find((x: any) => x.currency === (user.currency || 'NGN')) || balances?.[0];
  const currency = main?.currency || user.currency || 'NGN';
  const available = main?.available ?? main?.balance ?? main?.available_balance ?? 0;
  const initial = (user.first_name || '?')[0]?.toUpperCase();

  return (
    <ScrollView style={s.page} contentContainerStyle={s.pageInner}>
      <View style={s.topBar}>
        <View style={s.brandRow}>
          <View style={s.logoBadge}><Ionicons name="infinite" size={18} color={theme.gold} /></View>
          <View>
            <Text style={s.brandWord}>NORA</Text>
            <Text style={s.brandTagline}>Africa's Financial Network</Text>
          </View>
        </View>
        <View style={s.topBarIcons}>
          <View style={s.bellWrap}>
            <Ionicons name="notifications-outline" size={20} color={theme.dark} />
            <View style={s.bellDot} />
          </View>
          <Ionicons name="person-circle-outline" size={30} color={theme.textDim} />
        </View>
      </View>

      <View style={s.greetingRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.greetingLight}>Good morning,</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={s.greetingName}>{user.first_name || 'there'}</Text>
            <Ionicons name="checkmark-circle" size={15} color={theme.gold} />
          </View>
          <Text style={s.greetingSub}>Let's keep your money moving.</Text>
        </View>
        <Text style={s.oneNetworkText}>One Network.{'\n'}Multiple Countries.{'\n'}Endless Opportunities.</Text>
      </View>
      {error ? <ErrorText>{error}</ErrorText> : null}

      <DarkCard style={{ marginTop: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={s.darkLabel}>NORA Account Balance</Text>
            <Pressable onPress={() => setHidden(!hidden)}>
              <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={14} color={theme.textDimOnDark} />
            </Pressable>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textDimOnDark} />
        </View>
        {balances === null && !error ? <ActivityIndicator color={theme.gold} style={{ marginTop: 10 }} /> : (
          <Text style={s.darkBalance}>{hidden ? '••••••' : money(available, currency)}</Text>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
          <View style={s.activePill}>
            <View style={s.activeDot} />
            <Text style={s.activePillLabel}>Active</Text>
          </View>
        </View>
        <View style={s.idRow}>
          <Text style={s.idText}>{user.nora_id ? `NORA ID: ${String(user.nora_id).replace('@', '')}` : 'NORA ID: —'}</Text>
          <Ionicons name="copy-outline" size={13} color={theme.textDimOnDark} />
        </View>
      </DarkCard>

      <View style={s.tileRow}>
        <ActionTile icon="add" label="Add Money" sub="Fund your NORA account" onPress={() => go('fund')} />
        <ActionTile icon="paper-plane" label="Send" sub="Local & Cross-border" onPress={() => go('send')} />
        <ActionTile icon="arrow-up" label="Withdraw" sub="To your bank account" onPress={() => go('withdraw')} />
      </View>

      <View style={s.promoCard}>
        <Text style={s.promoTitle}>More countries.{'\n'}More opportunities.</Text>
        <Text style={s.promoSub}>Send and receive across Africa with NORA.</Text>
        <View style={s.exploreBtn}>
          <Text style={s.exploreBtnLabel}>Explore Now</Text>
          <Ionicons name="arrow-forward" size={13} color={theme.dark} />
        </View>
      </View>

      <View style={{ marginTop: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={s.sectionTitle}>Recent Activity</Text>
          <Pressable onPress={() => go('activity')} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Text style={s.link}>See all</Text>
            <Ionicons name="chevron-forward" size={13} color={theme.goldDeep} />
          </Pressable>
        </View>
        <Surface style={{ padding: 0 }}>
          {recent === null && !error ? <ActivityIndicator color={theme.gold} style={{ padding: 16 }} /> :
            recent && recent.length > 0 ? recent.map((t: any, i: number) => <TxRow key={t.id || i} tx={t} last={i === recent.length - 1} />) :
            <Text style={[s.empty, { padding: 16 }]}>No transactions yet. Send money to get started.</Text>}
        </Surface>
      </View>
    </ScrollView>
  );
}

function ActionTile({ icon, label, sub, onPress }: { icon: any; label: string; sub: string; onPress: () => void }) {
  return (
    <Pressable style={s.tile} onPress={onPress}>
      <View style={s.tileIconCircle}><Ionicons name={icon} size={16} color={theme.dark} /></View>
      <Text style={s.tileLabel}>{label}</Text>
      <Text style={s.tileSub}>{sub}</Text>
    </Pressable>
  );
}

function TxRow({ tx, last }: { tx: any; last?: boolean }) {
  const amt = tx.amount ?? tx.debit_amount ?? tx.credit_amount;
  const type = (tx.type || '').toLowerCase();
  const sign = type.includes('add') || tx.direction === 'credit' || type.includes('receiv') ? '+' : type.includes('send') || type.includes('withdraw') ? '-' : '';
  const isWithdraw = type.includes('withdraw');
  const isFund = type.includes('add') || type.includes('fund');
  return (
    <View style={[s.txRow, last && { borderBottomWidth: 0 }]}>
      <View style={s.txIconCircle}>
        {isWithdraw ? <Ionicons name="arrow-up" size={14} color={theme.textOnDark} /> :
         isFund ? <Ionicons name="business" size={14} color={theme.textOnDark} /> :
         <Text style={{ fontSize: 15 }}>{flagFor(tx.country || tx.currency)}</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.txTitle}>{tx.description || tx.type || 'Transfer'}</Text>
        <Text style={s.txSub}>{tx.created_at ? new Date(tx.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={s.txAmount}>{sign}{money(amt, tx.currency)}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
          <Ionicons name="checkmark-circle" size={11} color={theme.green} />
          <Text style={s.txStatusLabel}>{(tx.status || 'Completed')}</Text>
        </View>
      </View>
    </View>
  );
}

/* ============================== SEND ============================== */
const SEND_MODES: { id: 'nora_transfer' | 'cross_border' | 'non_nora'; label: string; icon: any }[] = [
  { id: 'nora_transfer', label: 'NORA Transfer', icon: 'swap-horizontal' },
  { id: 'cross_border', label: 'Cross-Border', icon: 'globe-outline' },
  { id: 'non_nora', label: 'Non-NORA Recipient', icon: 'person-outline' },
];

export function SendScreen({ user, back }: { user: User; back: () => void }) {
  const [mode, setMode] = useState<'nora_transfer' | 'cross_border' | 'non_nora'>('nora_transfer');
  const [sendTo, setSendTo] = useState<'nora_id' | 'nora_account' | 'bank'>('nora_id');
  const [recipient, setRecipient] = useState('');
  const [resolved, setResolved] = useState<any | null>(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [quote, setQuote] = useState<any | null>(null);
  const [pin, setPin] = useState('');
  const [pinOpen, setPinOpen] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const doResolve = async () => {
    setError(''); setResolved(null); setQuote(null);
    if (!recipient.trim()) { setError('Enter a recipient.'); return; }
    setBusy(true);
    try { setResolved(await nora.resolveNoraId(recipient.trim())); }
    catch (e) { setError(err(e)); } finally { setBusy(false); }
  };

  const doQuote = async () => {
    setError(''); setQuote(null);
    const amt = parseFloat(amount);
    if (!resolved) { setError('Resolve the recipient first.'); return; }
    if (!Number.isFinite(amt) || amt <= 0) { setError('Enter a valid amount.'); return; }
    setBusy(true);
    try { setQuote(await nora.createQuote(recipient.trim(), amt)); }
    catch (e) { setError(err(e)); } finally { setBusy(false); }
  };

  const doAuthorize = async () => {
    setError(''); setBusy(true);
    try {
      const res = await nora.authorizeTransfer(quote?.id || quote?.quote_id, pin);
      setReceipt(res); setPinOpen(false); setPin(''); setQuote(null); setResolved(null); setRecipient(''); setAmount(''); setMessage('');
    } catch (e) { setError(err(e)); } finally { setBusy(false); }
  };

  if (receipt) {
    return (
      <ScrollView style={s.page} contentContainerStyle={s.pageInner}>
        <Surface style={{ alignItems: 'center' }}>
          <Ionicons name="checkmark-circle" size={40} color={theme.green} />
          <Text style={s.cardTitle}>Transfer sent</Text>
          <Text style={s.receiptAmount}>{money(receipt.amount ?? receipt.debit_amount, receipt.currency || user.currency)}</Text>
          <Text style={s.receiptRef}>Reference: {receipt.reference || receipt.id}</Text>
          <StatusPill status={receipt.status || 'PROCESSING'} />
          <View style={{ height: 14 }} />
          <PrimaryButton label="Done" onPress={back} />
        </Surface>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={s.page} contentContainerStyle={s.pageInner}>
      <View style={s.sendHeader}>
        <Pressable onPress={back}><Ionicons name="arrow-back" size={22} color={theme.text} /></Pressable>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.screenTitle}>Send Money</Text>
          <Text style={s.sendSubtitle}>Local. Cross-border. Seamless.</Text>
        </View>
        <View style={s.bellWrap}>
          <Ionicons name="notifications-outline" size={20} color={theme.dark} />
          <View style={s.bellDot} />
        </View>
      </View>

      <View style={s.sendPromo}>
        <Text style={s.sendPromoLabel}>Send with NORA</Text>
        <Text style={s.sendPromoTitle}>Money moves{'\n'}across Africa.</Text>
        <Text style={s.sendPromoSub}>Fast. Safe. Borderless.</Text>
      </View>

      <View style={s.modeRow}>
        {SEND_MODES.map((m) => (
          <Pressable key={m.id} onPress={() => setMode(m.id)} style={[s.modeChip, mode === m.id && s.modeChipOn]}>
            <Ionicons name={m.icon} size={13} color={mode === m.id ? theme.textOnDark : theme.textDim} />
            <Text style={[s.modeChipLabel, mode === m.id && s.modeChipOnLabel]} numberOfLines={1}>{m.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 }}>
        <Text style={s.sectionTitle}>Send to</Text>
        <Ionicons name="information-circle-outline" size={14} color={theme.textDim} />
      </View>
      <SendToCard icon="N" title="NORA ID" sub="Send to another NORA user" selected={sendTo === 'nora_id'} onPress={() => setSendTo('nora_id')} />
      <SendToCard iconName="business-outline" title="NORA Account" sub="Send to a NORA account" selected={sendTo === 'nora_account'} onPress={() => setSendTo('nora_account')} />
      <SendToCard iconName="business-outline" title="Bank Account" sub="Send to a bank (non-NORA)" selected={sendTo === 'bank'} onPress={() => setSendTo('bank')} />

      <Text style={[s.sectionTitle, { marginTop: 6, marginBottom: 8 }]}>Recipient</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        <View style={[s.input, { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
          <Ionicons name="search" size={15} color={theme.textDim} />
          <TextInput
            style={{ flex: 1, color: theme.text, fontSize: 14 }}
            value={recipient}
            onChangeText={setRecipient}
            placeholder="Search by NORA ID, name or phone"
            placeholderTextColor={theme.textDim}
            autoCapitalize="none"
          />
        </View>
        <Pressable style={s.contactBtn} onPress={doResolve}><Ionicons name="person-add-outline" size={16} color={theme.dark} /></Pressable>
      </View>
      {resolved && (
        <View style={s.resolvedBox}>
          <Text style={s.resolvedName}>{resolved.display_name || resolved.name || `${resolved.first_name || ''} ${resolved.last_name || ''}`.trim() || 'Recipient'}</Text>
          <Text style={s.rowSubtle}>{resolved.nora_id || recipient} · {resolved.country || ''}</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionTitle}>Amount</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <View style={s.currencyPill}><Text style={s.currencyPillLabel}>{user.currency || 'NGN'}</Text><Ionicons name="chevron-down" size={12} color={theme.text} /></View>
            <TextInput style={[s.input, { flex: 1 }]} value={amount} onChangeText={setAmount} placeholder="Enter amount" placeholderTextColor={theme.textDim} keyboardType="number-pad" />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={s.sectionTitle}>Message</Text>
            <Text style={s.rowSubtle}>Optional</Text>
          </View>
          <TextInput style={[s.input, { marginTop: 8 }]} value={message} onChangeText={setMessage} placeholder="Add a note" placeholderTextColor={theme.textDim} />
        </View>
      </View>

      <Pressable onPress={doQuote} style={s.rateBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="globe-outline" size={16} color={theme.textDim} />
          <View>
            <Text style={s.rateLabel}>Exchange Rate</Text>
            <Text style={s.rateValue}>{quote?.rate ? `1 USD = ${quote.rate} ${quote.recipient_currency || ''}` : 'Tap to get a quote'}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={s.rateLabel}>Estimated Fee</Text>
          <Text style={s.rateValue}>{money(quote?.fee ?? quote?.fee_amount ?? 0, user.currency)}</Text>
        </View>
      </Pressable>

      <ErrorText>{error}</ErrorText>
      <PrimaryButton label={quote ? 'Continue' : (busy ? 'Getting quote…' : 'Get quote')} onPress={quote ? () => setPinOpen(true) : doQuote} loading={busy} disabled={!resolved} />
      <Text style={s.footNote}>Your PIN authorizes the transfer. No PIN, no money moves.</Text>

      {pinOpen && (
        <Surface style={{ marginTop: 14 }}>
          <Text style={s.cardTitle}>Enter PIN to authorize</Text>
          <Text style={s.rowSubtle}>Sending {money(quote?.receive_amount ?? quote?.amount, quote?.recipient_currency || user.currency)} to {resolved?.display_name || resolved?.name || recipient}</Text>
          <View style={{ height: 10 }} />
          <Field label="PIN" value={pin} onChangeText={setPin} keyboardType="number-pad" secureTextEntry />
          <PrimaryButton label="Authorize transfer" onPress={doAuthorize} loading={busy} />
          <Pressable onPress={() => { setPinOpen(false); setPin(''); }}><Text style={s.switchMode}>Cancel</Text></Pressable>
        </Surface>
      )}
    </ScrollView>
  );
}

function SendToCard({ icon, iconName, title, sub, selected, onPress }: { icon?: string; iconName?: any; title: string; sub: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.sendToCard, selected && s.sendToCardOn]}>
      <View style={[s.sendToCardIcon, selected && s.sendToCardIconOn]}>
        {icon ? <Text style={{ color: selected ? theme.textOnDark : theme.textDim, fontWeight: '900', fontSize: 13 }}>{icon}</Text> :
          <Ionicons name={iconName} size={16} color={selected ? theme.textOnDark : theme.textDim} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitleStrong}>{title}</Text>
        <Text style={s.rowSubtle}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.textDim} />
    </Pressable>
  );
}

/* ============================== ACTIVITY ============================== */
const FILTERS = ['All', 'Send', 'Receive', 'Add Money', 'Withdraw'];
export function ActivityScreen() {
  const [list, setList] = useState<any[] | null>(null);
  const [filter, setFilter] = useState('All');
  const [error, setError] = useState('');
  const load = async () => {
    setError('');
    try {
      const a = await nora.activity();
      setList(Array.isArray(a) ? a : a?.transactions ?? []);
    } catch (e) { setError(err(e)); }
  };
  useEffect(() => { load(); }, []);

  const filtered = (list || []).filter((t: any) => filter === 'All' || (t.type || '').toLowerCase().includes(filter.toLowerCase().split(' ')[0]));

  return (
    <View style={[s.page, { paddingTop: 18, paddingHorizontal: 18 }]}>
      <View style={s.sendHeader}>
        <Text style={s.screenTitle}>Activity</Text>
        <Text style={s.bell}>📅</Text>
      </View>
      <View style={s.filterRow}>
        {FILTERS.map((f) => (
          <Pressable key={f} onPress={() => setFilter(f)} style={[s.filterChip, filter === f && s.filterChipOn]}>
            <Text style={[s.filterChipLabel, filter === f && s.filterChipOnLabel]}>{f}</Text>
          </Pressable>
        ))}
      </View>
      <ErrorText>{error}</ErrorText>
      {list === null && !error ? <ActivityIndicator color={theme.gold} style={{ marginTop: 24 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item, index }) => <TxRow tx={item} last={index === filtered.length - 1} />}
          ListEmptyComponent={<Text style={s.empty}>No transactions yet.</Text>}
          contentContainerStyle={{ paddingBottom: 120 }}
          style={{ marginTop: 8 }}
        />
      )}
    </View>
  );
}

/* ============================== ACCOUNTS ============================== */
export function AccountsScreen({ user, go }: { user: User; go: (s: NavTarget) => void }) {
  const [balances, setBalances] = useState<any[] | null>(null);
  const [banks, setBanks] = useState<any[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    nora.balances().then((b: any) => setBalances(Array.isArray(b) ? b : b?.balances ?? [])).catch((e) => setError(err(e)));
    nora.banks().then((b: any) => setBanks(Array.isArray(b) ? b : b?.banks ?? [])).catch(() => setBanks([]));
  }, []);

  const main = balances?.find((x: any) => x.currency === (user.currency || 'NGN')) || balances?.[0];
  const currency = main?.currency || user.currency || 'NGN';
  const available = main?.available ?? main?.balance ?? 0;

  return (
    <ScrollView style={s.page} contentContainerStyle={s.pageInner}>
      <Text style={s.screenTitle}>Accounts</Text>
      <ErrorText>{error}</ErrorText>

      <DarkCard style={{ marginTop: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={s.darkLabel}>NORA Account</Text>
          <Text style={s.brandWordSmall}>NORA</Text>
        </View>
        {balances === null ? <ActivityIndicator color={theme.gold} style={{ marginTop: 10 }} /> : (
          <Text style={s.darkBalance}>{money(available, currency)}</Text>
        )}
        <View style={s.idRow}>
          <View style={s.activeDot} />
          <Text style={s.activeLabel}>Active</Text>
        </View>
        <Text style={s.idTextSmall}>{user.nora_id ? `NORA ID: ${String(user.nora_id).replace('@', '')}` : ''}</Text>
      </DarkCard>

      <View style={s.tileRow}>
        <ActionTile icon="add" label="Add Money" sub="Fund your NORA account" onPress={() => go('fund')} />
        <ActionTile icon="arrow-up" label="Withdraw" sub="To your bank account" onPress={() => go('withdraw')} />
        <ActionTile icon="paper-plane" label="Send" sub="Local & Cross-border" onPress={() => go('send')} />
      </View>

      <View style={{ marginTop: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={s.sectionTitle}>Funding Sources</Text>
          <Text style={s.link}>Manage</Text>
        </View>
        <Surface style={{ padding: 0 }}>
          {banks === null ? <ActivityIndicator color={theme.gold} style={{ padding: 16 }} /> :
            banks.length > 0 ? banks.slice(0, 3).map((b: any, i: number) => (
              <Row key={b.id || i} icon={<Text>🏦</Text>} title={b.name || b.code} subtitle={i === 0 ? 'Primary' : undefined} onPress={() => {}} />
            )) : <Text style={[s.empty, { padding: 16 }]}>No linked banks yet.</Text>}
          <Pressable style={s.addRow}><Text style={s.addRowLabel}>+ Add New Bank Account</Text></Pressable>
        </Surface>
      </View>

      <View style={{ marginTop: 20, marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={s.sectionTitle}>Withdrawal Destinations</Text>
          <Text style={s.link}>Manage</Text>
        </View>
        <Surface style={{ padding: 0 }}>
          <Row icon={<Text>{flagFor('GH')}</Text>} title="Ghana — GHS" subtitle="Ghana Commercial Bank" onPress={() => go('withdraw')} />
        </Surface>
      </View>
    </ScrollView>
  );
}

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

/* ============================== PROFILE ============================== */
export function ProfileScreen({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [biometric, setBiometric] = useState(true);
  const [twoFA, setTwoFA] = useState(true);
  const initials = `${(user.first_name || '?')[0]}${(user.last_name || '')[0] || ''}`.toUpperCase();

  return (
    <ScrollView style={s.page} contentContainerStyle={[s.pageInner, { paddingBottom: 120 }]}>
      <Text style={s.screenTitle}>Profile</Text>
      <Surface style={{ alignItems: 'center', marginTop: 4 }}>
        <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
        <Text style={s.profileName}>{user.first_name} {user.last_name}</Text>
        <Text style={s.rowSubtle}>{user.email || user.phone || '—'}</Text>
        <Text style={s.rowSubtle}>{user.nora_id ? `NORA ID: ${String(user.nora_id).replace('@', '')}` : ''}</Text>
        <View style={{ marginTop: 6 }}><StatusPill status="COMPLETED" /></View>
      </Surface>

      <Text style={[s.sectionTitle, { marginTop: 18, marginBottom: 4 }]}>Personal Information</Text>
      <Surface style={{ padding: 0 }}>
        <Row icon={<Text>👤</Text>} title="Full Name" subtitle={`${user.first_name || ''} ${user.last_name || ''}`.trim() || '—'} onPress={() => {}} />
        <Row icon={<Text>✉️</Text>} title="Email Address" subtitle={user.email || '—'} onPress={() => {}} />
        <Row icon={<Text>📞</Text>} title="Phone Number" subtitle={user.phone || '—'} onPress={() => {}} />
        <Row icon={<Text>📍</Text>} title="Address" subtitle={user.country || '—'} onPress={() => {}} />
      </Surface>

      <Text style={[s.sectionTitle, { marginTop: 18, marginBottom: 4 }]}>Security & Privacy</Text>
      <Surface style={{ padding: 0 }}>
        <Row icon={<Text>🔒</Text>} title="Change PIN" onPress={() => {}} />
        <Row icon={<Text>🧿</Text>} title="Biometric Login" right={<Switch value={biometric} onValueChange={setBiometric} trackColor={{ true: theme.gold, false: theme.border }} />} />
        <Row icon={<Text>🛡️</Text>} title="Two-Factor Authentication" right={<Switch value={twoFA} onValueChange={setTwoFA} trackColor={{ true: theme.gold, false: theme.border }} />} />
        <Row icon={<Text>📱</Text>} title="Device Management" onPress={() => {}} />
      </Surface>

      <Text style={[s.sectionTitle, { marginTop: 18, marginBottom: 4 }]}>Support</Text>
      <Surface style={{ padding: 0, marginBottom: 16 }}>
        <Row icon={<Text>❓</Text>} title="Help & Support" onPress={() => {}} />
        <Row icon={<Text>ℹ️</Text>} title="About NORA" onPress={() => {}} />
      </Surface>

      <PrimaryButton label="Sign out" onPress={onLogout} variant="outline" />
    </ScrollView>
  );
}

/* ============================== STYLES ============================== */
const s = StyleSheet.create({
  logoBadge: { width: 34, height: 34, borderRadius: 10, backgroundColor: theme.dark, alignItems: 'center', justifyContent: 'center' },
  brandTagline: { color: theme.textDim, fontSize: 9, fontWeight: '600' },
  topBarIcons: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bellWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  bellDot: { position: 'absolute', top: 7, right: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: theme.gold },
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 16 },
  greetingLight: { color: theme.textDim, fontSize: 15 },
  greetingName: { color: theme.dark, fontSize: 20, fontWeight: '900' },
  oneNetworkText: { color: theme.dark, fontSize: 10, fontWeight: '700', textAlign: 'right', lineHeight: 15, maxWidth: 120 },
  activePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(240,180,41,0.18)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  activePillLabel: { color: theme.gold, fontSize: 11, fontWeight: '700' },
  tileSub: { color: theme.textDimOnDark, fontSize: 9.5, marginTop: 2, textAlign: 'center' },
  tileIconCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: theme.textOnDark, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  promoCard: { backgroundColor: '#EFEDE2', borderRadius: 18, padding: 18, marginTop: 14 },
  promoTitle: { color: theme.dark, fontWeight: '900', fontSize: 16, lineHeight: 21 },
  exploreBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.gold, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start', marginTop: 12 },
  exploreBtnLabel: { color: theme.dark, fontWeight: '800', fontSize: 12 },
  txIconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.dark, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txStatusLabel: { color: theme.green, fontSize: 10.5, fontWeight: '700' },
  sendSubtitle: { color: theme.textDim, fontSize: 11.5, marginTop: 1 },
  sendPromo: { backgroundColor: theme.dark, borderRadius: 16, padding: 16, marginBottom: 14 },
  sendPromoLabel: { color: theme.gold, fontSize: 11, fontWeight: '700' },
  sendPromoTitle: { color: theme.textOnDark, fontSize: 19, fontWeight: '900', marginTop: 6, lineHeight: 24 },
  sendPromoSub: { color: theme.textDimOnDark, fontSize: 12, marginTop: 6 },
  modeRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  modeChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 4, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  modeChipOn: { backgroundColor: theme.dark, borderColor: theme.dark },
  modeChipLabel: { color: theme.textDim, fontSize: 10, fontWeight: '700' },
  modeChipOnLabel: { color: theme.textOnDark },
  sendToCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 13, marginBottom: 8, backgroundColor: theme.surface },
  sendToCardOn: { borderColor: theme.green, backgroundColor: 'rgba(30,158,90,0.06)' },
  sendToCardIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFEDE2', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  sendToCardIconOn: { backgroundColor: theme.green },
  contactBtn: { width: 46, borderRadius: 12, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface },
  currencyPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 13 },
  currencyPillLabel: { color: theme.text, fontWeight: '700', fontSize: 13 },
  rateBox: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F1EFE6', borderRadius: 12, padding: 13, marginTop: 14, marginBottom: 6 },
  rateLabel: { color: theme.textDim, fontSize: 10.5 },
  rateValue: { color: theme.text, fontSize: 12, fontWeight: '700', marginTop: 2 },
  input: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 12, color: theme.text, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },

  page: { flex: 1, backgroundColor: theme.bg },
  pageInner: { padding: 18, paddingBottom: 120 },
  logoWrap: { alignItems: 'center', marginVertical: 36 },
  logoMark: { fontSize: 30, color: theme.gold },
  logo: { fontSize: 34, fontWeight: '900', letterSpacing: 4, color: theme.dark, marginTop: 4 },
  logoSub: { color: theme.textDim, fontSize: 11, fontWeight: '700', marginTop: 2 },
  tagline: { color: theme.textDim, marginTop: 10, fontSize: 13 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandMark: { fontSize: 18, color: theme.gold },
  brandWord: { fontSize: 16, fontWeight: '900', letterSpacing: 1.5, color: theme.dark },
  brandWordSmall: { fontSize: 12, fontWeight: '900', letterSpacing: 1, color: theme.gold },
  bell: { fontSize: 18 },
  greeting: { color: theme.text, fontSize: 20, fontWeight: '800', marginTop: 16 },
  greetingSub: { color: theme.textDim, fontSize: 13, marginTop: 2 },
  screenTitle: { color: theme.text, fontSize: 20, fontWeight: '800' },
  cardTitle: { color: theme.text, fontSize: 17, fontWeight: '800', marginTop: 8, marginBottom: 4 },
  darkLabel: { color: theme.textDimOnDark, fontSize: 12, fontWeight: '700' },
  darkBalance: { color: theme.textOnDark, fontSize: 30, fontWeight: '900', marginTop: 8 },
  darkChevron: { color: theme.textDimOnDark, fontSize: 18 },
  idRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 6 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.gold },
  idText: { color: theme.textDimOnDark, fontSize: 12, flex: 1 },
  idTextSmall: { color: theme.textDimOnDark, fontSize: 11, marginTop: 2 },
  activeLabel: { color: theme.gold, fontSize: 12, fontWeight: '700' },
  tileRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  tile: { flex: 1, backgroundColor: theme.dark, borderRadius: 16, alignItems: 'center', paddingVertical: 16 },
  tileEmoji: { fontSize: 18, color: theme.gold },
  tileLabel: { color: theme.textOnDark, fontWeight: '700', marginTop: 6, fontSize: 11.5 },
  promoText: { color: theme.textOnDark, fontWeight: '800', fontSize: 14 },
  promoSub: { color: theme.textDimOnDark, fontSize: 12, marginTop: 4 },
  sectionTitle: { color: theme.text, fontWeight: '800', fontSize: 14 },
  link: { color: theme.goldDeep, fontWeight: '700', fontSize: 13 },
  empty: { color: theme.textDim, fontSize: 14 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: theme.border },
  txFlag: { fontSize: 20, marginRight: 12 },
  txTitle: { color: theme.text, fontWeight: '700', fontSize: 13.5 },
  txSub: { color: theme.textDim, fontSize: 11.5, marginTop: 2 },
  txAmount: { color: theme.text, fontWeight: '800', fontSize: 13.5, marginBottom: 4 },
  sendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  backArrow: { fontSize: 20, color: theme.text, width: 30 },
  segment: { flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.border, padding: 4, marginBottom: 16 },
  segmentBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 9 },
  segmentOn: { backgroundColor: theme.dark },
  segmentLabel: { color: theme.textDim, fontWeight: '700', fontSize: 13 },
  segmentOnLabel: { color: theme.textOnDark },
  sendToRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: theme.border },
  sendToIcon: { fontSize: 18, marginRight: 12 },
  rowTitleStrong: { color: theme.text, fontWeight: '700', fontSize: 14 },
  rowSubtle: { color: theme.textDim, fontSize: 12, marginTop: 2 },
  radio: { fontSize: 16, color: theme.border },
  radioOn: { color: theme.gold },
  resolvedBox: { backgroundColor: 'rgba(30,158,90,0.08)', borderRadius: 12, padding: 12, marginVertical: 4, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(30,158,90,0.25)' },
  resolvedName: { color: theme.text, fontWeight: '800', fontSize: 14 },
  quoteBox: { backgroundColor: theme.pill, borderRadius: 12, padding: 12, marginVertical: 4, marginBottom: 14 },
  quoteLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  quoteLabel: { color: theme.textDim, fontSize: 13 },
  quoteValue: { color: theme.text, fontSize: 13, fontWeight: '800' },
  receiptAmount: { color: theme.text, fontSize: 26, fontWeight: '900', marginVertical: 4 },
  receiptRef: { color: theme.textDim, fontSize: 12, marginBottom: 8 },
  countryRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  countryBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  countryOn: { backgroundColor: theme.pill, borderColor: theme.gold },
  countryLabel: { color: theme.textDim, fontWeight: '700', fontSize: 12.5 },
  countryOnLabel: { color: theme.goldDeep },
  switchMode: { color: theme.goldDeep, textAlign: 'center', marginTop: 14, fontWeight: '600', fontSize: 13 },
  footNote: { color: theme.textDim, fontSize: 11, textAlign: 'center', marginTop: 14, lineHeight: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.dark, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarText: { color: theme.gold, fontWeight: '900', fontSize: 18 },
  profileName: { color: theme.text, fontSize: 17, fontWeight: '800' },
  fieldLabelX: { color: theme.textDim, fontSize: 12, fontWeight: '700', marginBottom: 6, letterSpacing: 0.3 },
  bankRow: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 6, backgroundColor: theme.surface },
  bankRowOn: { backgroundColor: theme.pill, borderColor: theme.gold },
  bankLabel: { color: theme.textDim, fontSize: 14 },
  bankRowOnLabel: { color: theme.goldDeep, fontWeight: '700' },
  filterRow: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface },
  filterChipOn: { backgroundColor: theme.dark, borderColor: theme.dark },
  filterChipLabel: { color: theme.textDim, fontSize: 12, fontWeight: '700' },
  filterChipOnLabel: { color: theme.textOnDark },
  addRow: { padding: 14, alignItems: 'center' },
  addRowLabel: { color: theme.goldDeep, fontWeight: '700', fontSize: 13 },
});
