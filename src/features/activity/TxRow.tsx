/** Shared transaction row — direction icon + flag badge + status pill. */
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { nora } from '../../api';
import { theme } from '../../theme';
import { s } from '../../design-system/screenStyles';
import { DarkCard, ErrorText, Field, flagFor, money, PrimaryButton, Row, StatusPill, Surface } from '../../ui';
import { err, NavTarget, User } from '../../types';


function txKind(type: string) {
  if (type.includes('cross')) return 'cross';
  if (type.includes('withdraw')) return 'withdraw';
  if (type.includes('add') || type.includes('fund')) return 'fund';
  if (type.includes('receiv')) return 'receive';
  if (type.includes('send')) return 'send';
  return 'other';
}

export function TxRow({ tx, last }: { tx: any; last?: boolean }) {
  const amt = tx.amount ?? tx.debit_amount ?? tx.credit_amount;
  const type = (tx.type || tx.description || '').toLowerCase();
  const kind = txKind(type);
  const sign = kind === 'fund' || kind === 'receive' || tx.direction === 'credit' ? '+' : kind === 'send' || kind === 'withdraw' ? '-' : '';
  const mainIcon = kind === 'send' ? 'arrow-up' : kind === 'receive' ? 'arrow-down' : kind === 'fund' ? 'business' : kind === 'withdraw' ? 'arrow-up' : kind === 'cross' ? 'swap-horizontal' : 'swap-horizontal';
  const flag = flagFor(tx.country || tx.currency);
  const hasFlag = flag !== '🌍' && (kind === 'send' || kind === 'receive' || kind === 'cross');
  return (
    <View style={[s.txRow, last && { borderBottomWidth: 0 }]}>
      <View style={{ position: 'relative', marginRight: 12 }}>
        <View style={s.txIconCircleBare}><Ionicons name={mainIcon as any} size={14} color={theme.textOnDark} /></View>
        <View style={s.txBadge}>
          {hasFlag ? <Text style={{ fontSize: 9 }}>{flag}</Text> : <Ionicons name="business" size={8} color={theme.textDim} />}
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.txTitle}>{tx.description || tx.type || 'Transfer'}</Text>
        <Text style={s.txSub}>{tx.created_at ? new Date(tx.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={s.txAmount}>{sign}{money(amt, tx.currency)}</Text>
        <StatusPill status={tx.status || 'COMPLETED'} />
      </View>
    </View>
  );
}

