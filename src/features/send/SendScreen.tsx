/** NORA Send — resolve → quote → review → PIN authorize → receipt. §RULE: Intent ≠ Authorization. */
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { nora } from '../../api';
import { theme } from '../../theme';
import { s } from '../../design-system/screenStyles';
import { DarkCard, ErrorText, Field, flagFor, money, PrimaryButton, Row, StatusPill, Surface } from '../../ui';
import { err, NavTarget, User } from '../../types';


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

