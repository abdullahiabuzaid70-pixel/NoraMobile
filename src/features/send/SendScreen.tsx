/**
 * NORA Send — resolve → quote → REVIEW → PIN authorize → truthful receipt.
 *
 * §RULE: Intent ≠ Authorization. The review step shows the full breakdown
 * (amount, fee, rate, recipient gets, delivery estimate) BEFORE the PIN.
 * Quote expiry blocks authorization: an expired rate can never be charged.
 * The idempotency key is stable per quote — a timeout re-confirms, never
 * double-sends. outcomeUnknown renders as "still confirming", never failure.
 */
import React, { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { theme } from '../../theme';
import { s } from '../../design-system/screenStyles';
import { ErrorText, Field, flagFor, PrimaryButton, Skeleton, StatusPill, Surface } from '../../ui';
import { format, fromUserInput } from '../../domain/money';
import { quoteFromBackend, quoteStatus, isUsable, senderPays } from '../../domain/fx';
import { displayNoraId, normalizeForLookup } from '../../domain/identity';
import { accountApi, paymentsApi, Recipient } from '../../services/api/noraClient';
import { ApiError } from '../../services/api/client';
import { newIdempotencyKey } from '../../services/api/client';
import { err, NavTarget, User } from '../../types';
import { track } from '../../analytics/analytics';

const SEND_MODES: { id: 'nora_transfer' | 'cross_border' | 'non_nora'; label: string; icon: any }[] = [
  { id: 'nora_transfer', label: 'NORA Transfer', icon: 'swap-horizontal' },
  { id: 'cross_border', label: 'Cross-Border', icon: 'globe-outline' },
  { id: 'non_nora', label: 'Non-NORA Recipient', icon: 'person-outline' },
];

type Step = 'compose' | 'review' | 'pin' | 'receipt';

export function SendScreen({ user, back }: { user: User; back: () => void }) {
  const [mode, setMode] = useState<'nora_transfer' | 'cross_border' | 'non_nora'>('nora_transfer');
  const [sendTo, setSendTo] = useState<'nora_id' | 'nora_account' | 'bank'>('nora_id');
  const [recipientInput, setRecipientInput] = useState('');
  const [resolved, setResolved] = useState<Recipient | null>(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<Step>('compose');
  const [quote, setQuote] = useState<ReturnType<typeof quoteFromBackend>>(null);
  const [pin, setPin] = useState('');
  const [receipt, setReceipt] = useState<any | null>(null);
  const [confirming, setConfirming] = useState(false); // outcomeUnknown → "still confirming"
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // §IDEMPOTENCY: one key per quote, held stable across retries. The backend
  // dedupes on it — a retried authorize can never double-send.
  const idemKeyRef = useRef<string | null>(null);

  const srcCurrency = user.currency || 'NGN';
  const recipientName = resolved?.display_name || resolved?.name
    || `${resolved?.first_name || ''} ${resolved?.last_name || ''}`.trim() || recipientInput;

  const doResolve = async () => {
    setError(''); setResolved(null); setQuote(null);
    const raw = recipientInput.trim();
    if (!raw) { setError('Enter a recipient.'); return; }
    setBusy(true);
    try {
      // User may type separators; lookups normalize, display stays verbatim (§5).
      setResolved(await accountApi.resolveNoraId(normalizeForLookup(raw)));
    } catch (e) { setError(err(e)); } finally { setBusy(false); }
  };

  const doQuote = async () => {
    setError(''); setQuote(null);
    if (!resolved) { setError('Resolve the recipient first.'); return; }
    const amt = fromUserInput(amount, srcCurrency);
    if (!amt) { setError('Enter a valid amount.'); return; }
    setBusy(true);
    track('send_started');
    try {
      const raw = await paymentsApi.createQuote({ recipient: normalizeForLookup(recipientInput.trim()), amount: amt.amountMinor / 100 });
      const q = quoteFromBackend(raw as Record<string, unknown>, srcCurrency);
      if (!q) { setError('Quote unavailable — try again.'); return; }
      setQuote(q);
      setStep('review');
      track('quote_generated');
    } catch (e) { setError(err(e)); } finally { setBusy(false); }
  };

  const openPin = () => {
    if (!quote || !isUsable(quote)) { setError('This quote expired. Get a fresh rate to continue.'); return; }
    if (!idemKeyRef.current) idemKeyRef.current = newIdempotencyKey();
    setPin('');
    setStep('pin');
  };

  const doAuthorize = async () => {
    if (!quote) return;
    if (pin.length < 4) { setError('Enter your 4-digit PIN.'); return; }
    if (!isUsable(quote)) { setError('This quote expired. Get a fresh rate to continue.'); setStep('review'); return; }
    setError(''); setBusy(true);
    track('authorization_started');
    try {
      const res = await paymentsApi.authorizeTransfer({
        quoteId: quote.id,
        pin,
        idempotencyKey: idemKeyRef.current!, // stable across retries — never regenerate
      });
      setReceipt(res);
      setStep('receipt');
      track('transfer_submitted');
    } catch (e) {
      if (e instanceof ApiError && e.outcomeUnknown) {
        // Truth, not comfort: we do NOT know it failed. Never imply resend.
        setConfirming(true);
        setStep('receipt');
        track('transfer_failed', { reason: 'outcome_unknown' });
      } else {
        setError(err(e));
      }
    } finally { setBusy(false); }
  };

  // ── Receipt — truthful status only (§12) ──────────────────────────
  if (step === 'receipt') {
    const status = receipt?.status || 'PROCESSING';
    return (
      <ScrollView style={s.page} contentContainerStyle={s.pageInner}>
        <Surface style={{ alignItems: 'center' }}>
          <Ionicons name={confirming ? 'hourglass-outline' : 'checkmark-circle'} size={40} color={confirming ? theme.goldDeep : theme.green} />
          <Text style={s.cardTitle}>{confirming ? "We're still confirming" : 'Transfer sent'}</Text>
          {confirming ? (
            <>
              <Text style={[s.rowSubtle, { textAlign: 'center' }]}>
                Your request went through but the network is still confirming it. Check Activity in a few minutes — do not send again.
              </Text>
              <View style={{ height: 12 }} />
            </>
          ) : (
            <>
              <Text style={s.receiptAmount}>{format(quote?.destAmount ?? { amountMinor: 0, currency: srcCurrency })}</Text>
              <Text style={s.receiptRef}>To {recipientName}</Text>
              <StatusPill status={status} />
              <View style={{ height: 14 }} />
            </>
          )}
          <PrimaryButton label="Done" onPress={back} />
        </Surface>
      </ScrollView>
    );
  }

  // ── PIN — the authorization gate (§19) ────────────────────────────
  if (step === 'pin' && quote) {
    return (
      <ScrollView style={s.page} contentContainerStyle={s.pageInner}>
        <View style={s.sendHeader}>
          <Pressable onPress={() => { setStep('review'); setPin(''); }}><Ionicons name="arrow-back" size={22} color={theme.text} /></Pressable>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.screenTitle}>Authorize transfer</Text>
            <Text style={s.sendSubtitle}>Enter your PIN to confirm</Text>
          </View>
        </View>
        <Surface>
          <Text style={s.rowTitleStrong}>{recipientName}</Text>
          <Text style={s.rowSubtle}>{resolved?.nora_id ? displayNoraId(String(resolved.nora_id)) : recipientInput} {resolved?.country ? `· ${flagFor(resolved.country)}` : ''}</Text>
          <View style={{ height: 10 }} />
          <Text style={s.receiptAmount}>{format(senderPays(quote))}</Text>
          <Text style={s.rowSubtle}>Recipient gets {format(quote.destAmount)}</Text>
          <View style={{ height: 12 }} />
          <Field label="PIN" value={pin} onChangeText={setPin} keyboardType="number-pad" secureTextEntry />
          <ErrorText>{error}</ErrorText>
          <PrimaryButton label="Confirm & Send" onPress={doAuthorize} loading={busy} />
          <Pressable onPress={() => { setStep('review'); setPin(''); }}><Text style={s.switchMode}>Cancel</Text></Pressable>
        </Surface>
        <Text style={s.footNote}>Your PIN authorizes this exact transfer. No PIN, no money moves.</Text>
      </ScrollView>
    );
  }

  // ── Review — full breakdown BEFORE authorization (§7) ─────────────
  if (step === 'review' && quote) {
    const expired = !isUsable(quote);
    const rateLabel = quote.rate !== 1
      ? `1 ${quote.sourceAmount.currency} = ${quote.rate} ${quote.destAmount.currency}`
      : 'Same currency';
    return (
      <ScrollView style={s.page} contentContainerStyle={s.pageInner}>
        <View style={s.sendHeader}>
          <Pressable onPress={() => { setStep('compose'); }}><Ionicons name="arrow-back" size={22} color={theme.text} /></Pressable>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.screenTitle}>Review transfer</Text>
            <Text style={s.sendSubtitle}>Check every detail before you confirm</Text>
          </View>
        </View>

        <Surface>
          <View style={{ alignItems: 'center' }}>
            <Text style={s.darkLabel}>Recipient gets</Text>
            <Text style={s.receiptAmount}>{format(quote.destAmount)}</Text>
            <Text style={s.rowSubtle}>{recipientName} {resolved?.country ? `· ${flagFor(resolved.country)}` : ''}</Text>
          </View>
          <View style={{ height: 12 }} />
          <ReviewRow label="You send" value={format(quote.sourceAmount)} />
          <ReviewRow label="Fee" value={format(quote.fee)} />
          <ReviewRow label="Total charged" value={format(senderPays(quote))} strong />
          <ReviewRow label="Rate" value={rateLabel} />
          <ReviewRow label="Delivery" value="Usually within minutes · up to 1 business day" />
          {message.trim() ? <ReviewRow label="Message" value={message.trim()} /> : null}
          <View style={{ height: 6 }} />
          {expired ? (
            <View style={s.offlineBanner}>
              <Ionicons name="time-outline" size={13} color={theme.goldDeep} />
              <Text style={s.offlineBannerText}>This rate expired. Nothing was charged — get a fresh quote.</Text>
            </View>
          ) : quote.expiresAt ? (
            <Text style={s.rowSubtle}>Rate locked briefly — expires {new Date(quote.expiresAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.</Text>
          ) : (
            <Text style={s.rowSubtle}>Rate is an estimate — finalized when you confirm.</Text>
          )}
          <View style={{ height: 8 }} />
          {expired ? (
            <PrimaryButton label="Get a fresh quote" onPress={doQuote} loading={busy} />
          ) : (
            <PrimaryButton label="Continue to confirm" onPress={openPin} />
          )}
        </Surface>
        <Text style={s.footNote}>Nothing has been charged yet. Your PIN moves the money.</Text>
      </ScrollView>
    );
  }

  // ── Compose ────────────────────────────────────────────────────────
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
            value={recipientInput}
            onChangeText={(t) => { setRecipientInput(t); setResolved(null); setQuote(null); }}
            placeholder="Search by NORA ID, name or phone"
            placeholderTextColor={theme.textDim}
            autoCapitalize="none"
          />
        </View>
        <Pressable style={s.contactBtn} onPress={doResolve} accessibilityLabel="Resolve recipient"><Ionicons name="person-add-outline" size={16} color={theme.dark} /></Pressable>
      </View>
      {busy && !resolved ? (
        <View style={s.resolvedBox}><Skeleton width={140} height={14} /><View style={{ height: 6 }} /><Skeleton width={200} height={11} /></View>
      ) : resolved ? (
        <View style={s.resolvedBox}>
          <Text style={s.resolvedName}>{recipientName}</Text>
          <Text style={s.rowSubtle}>{resolved.nora_id ? displayNoraId(String(resolved.nora_id)) : recipientInput} · {resolved.country ? `${flagFor(resolved.country)} ` : ''}{resolved.country || ''}</Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionTitle}>Amount</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <View style={s.currencyPill}><Text style={s.currencyPillLabel}>{srcCurrency}</Text><Ionicons name="chevron-down" size={12} color={theme.text} /></View>
            <TextInput style={[s.input, { flex: 1 }]} value={amount} onChangeText={(t) => { setAmount(t); setQuote(null); }} placeholder="Enter amount" placeholderTextColor={theme.textDim} keyboardType="number-pad" />
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

      <ErrorText>{error}</ErrorText>
      <PrimaryButton
        label={busy ? 'Getting quote…' : 'Get quote & review'}
        onPress={doQuote}
        loading={busy}
        disabled={!resolved || !amount.trim()}
      />
      <Text style={s.footNote}>You'll see the full breakdown — fee, rate, delivery — before confirming.</Text>
    </ScrollView>
  );
}

function ReviewRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={s.reviewRow}>
      <Text style={s.rowSubtle}>{label}</Text>
      <Text style={strong ? s.rowTitleStrong : s.reviewRowValue}>{value}</Text>
    </View>
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
