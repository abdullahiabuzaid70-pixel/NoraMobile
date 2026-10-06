/**
 * ReceiptView — shared, truthful confirmation for every money movement.
 *
 * §12: only backend-confirmed outcomes render as success. outcomeUnknown
 * renders as "still confirming" with a check-Activity nudge — never resend.
 * §13: shareable receipt with reference + timestamp.
 */
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Share, Text, View } from 'react-native';
import { theme } from '../../theme';
import { s } from '../../design-system/screenStyles';
import { PrimaryButton, StatusPill, Surface } from '../../ui';
import { format, Money } from '../../domain/money';
import { isAuthoritativelyComplete, normalizeState } from '../../domain/transactions';

export interface ReceiptViewProps {
  /** Raw backend status — normalized here; UI never decides finality. */
  status?: string;
  title: string;
  confirmingTitle?: string;
  /** True when the request timed out: outcome unknown. */
  confirming?: boolean;
  /** What was moved, in source currency. */
  amount: Money;
  /** Cross-border: what the recipient receives, if different currency. */
  destAmount?: Money;
  fee?: Money;
  reference?: string;
  recipientLabel?: string;
  timestamp?: string;
  onDone: () => void;
}

export function ReceiptView({
  status, title, confirmingTitle = "We're still confirming", confirming,
  amount, destAmount, fee, reference, recipientLabel, timestamp, onDone,
}: ReceiptViewProps) {
  const normalized = normalizeState(status);
  const complete = !confirming && isAuthoritativelyComplete(normalized);

  const share = () => {
    const lines = [
      'NORA receipt',
      `${format(amount)}${destAmount && destAmount.currency !== amount.currency ? ` → ${format(destAmount)}` : ''}`,
      recipientLabel ? `To: ${recipientLabel}` : '',
      fee ? `Fee: ${format(fee)}` : '',
      reference ? `Reference: ${reference}` : '',
      timestamp ? `Time: ${timestamp}` : '',
      `Status: ${confirming ? 'Confirming' : normalized}`,
    ].filter(Boolean);
    Share.share({ message: lines.join('\n') }).catch(() => undefined);
  };

  return (
    <Surface style={{ alignItems: 'center' }}>
      <Ionicons
        name={confirming ? 'hourglass-outline' : complete ? 'checkmark-circle' : 'time-outline'}
        size={40}
        color={confirming ? theme.goldDeep : complete ? theme.green : theme.goldDeep}
      />
      <Text style={s.cardTitle}>{confirming ? confirmingTitle : title}</Text>

      {confirming ? (
        <Text style={[s.rowSubtle, { textAlign: 'center' }]}>
          Your request went through but the network is still confirming it. Check Activity in a few minutes — do not send again.
        </Text>
      ) : (
        <>
          <Text style={s.receiptAmount}>{format(amount)}</Text>
          {destAmount && destAmount.currency !== amount.currency ? (
            <Text style={s.rowSubtle}>Recipient gets {format(destAmount)}</Text>
          ) : null}
          {recipientLabel ? <Text style={s.rowSubtle}>To {recipientLabel}</Text> : null}
          {fee ? <Text style={s.rowSubtle}>Fee {format(fee)}</Text> : null}
          <StatusPill status={normalized} />
        </>
      )}

      {reference ? <Text style={s.receiptRef}>Reference: {reference}</Text> : null}
      {timestamp ? <Text style={s.receiptRef}>{timestamp}</Text> : null}

      <View style={{ height: 14 }} />
      <PrimaryButton label="Done" onPress={onDone} />
      <View style={{ height: 8 }} />
      <Text onPress={share} style={s.link}>Share receipt</Text>
    </Surface>
  );
}
