/** NORA Accounts — NORA Account, funding sources, withdrawal destinations. */
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { nora } from '../../api';
import { theme } from '../../theme';
import { s } from '../../design-system/screenStyles';
import { DarkCard, ErrorText, Field, flagFor, money, PrimaryButton, Row, StatusPill, Surface } from '../../ui';
import { err, NavTarget, User } from '../../types';


/* ============================== ACCOUNTS ============================== */
const FUNDING_OPTIONS = [
  { icon: 'business-outline', title: 'Bank Transfer', sub: 'Instant · Low fee' },
  { icon: 'card-outline', title: 'Card Payment', sub: 'Visa / Mastercard' },
  { icon: 'phone-portrait-outline', title: 'Mobile Money', sub: 'Quick & easy' },
  { icon: 'cash-outline', title: 'Cash Deposit', sub: 'Via agents' },
] as const;

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
  const idClean = user.nora_id ? String(user.nora_id).replace('@', '') : 'NA-0000-0000';

  return (
    <ScrollView style={s.page} contentContainerStyle={s.pageInner}>
      <View style={s.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={s.screenTitle}>Accounts</Text>
          <Text style={s.accountsSubtitle}>Manage your NORA account, linked banks and funding options.</Text>
        </View>
        <View style={s.topBarIcons}>
          <View style={s.bellWrap}>
            <Ionicons name="notifications-outline" size={18} color={theme.dark} />
            <View style={s.bellDot} />
          </View>
          <Ionicons name="person-circle-outline" size={28} color={theme.textDim} />
        </View>
      </View>
      <ErrorText>{error}</ErrorText>

      <DarkCard style={{ marginTop: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="eye-outline" size={13} color={theme.textDimOnDark} />
          <Text style={s.darkLabel}>NORA Account Balance</Text>
          <View style={{ flex: 1 }} />
          <Ionicons name="chevron-forward" size={16} color={theme.textDimOnDark} />
        </View>
        {balances === null ? <ActivityIndicator color={theme.gold} style={{ marginTop: 10 }} /> : (
          <Text style={s.darkBalance}>{money(available, currency)}</Text>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
          <View style={s.activePill}><View style={s.activeDot} /><Text style={s.activePillLabel}>Active</Text></View>
        </View>
        <View style={s.idRow}>
          <Text style={s.idText}>NORA ID: {idClean}</Text>
          <Ionicons name="copy-outline" size={13} color={theme.textDimOnDark} />
        </View>
      </DarkCard>

      <View style={s.accountTileGrid}>
        <AccountTile icon="add" label="Add Money" sub="Fund your account" onPress={() => go('fund')} />
        <AccountTile icon="business" label="Manage Banks" sub="Linked accounts" onPress={() => {}} />
        <AccountTile icon="swap-horizontal" label="Withdraw" sub="To your bank" onPress={() => go('withdraw')} />
        <AccountTile icon="card" label="NORA ID" sub="View & manage" onPress={() => {}} />
      </View>

      <Surface style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center' }}>
        <View style={s.idAvatar}><Text style={s.idAvatarText}>{idClean.slice(0, 2)}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.rowTitleStrong}>NORA ID</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={s.rowSubtle}>{idClean}</Text>
            <Ionicons name="copy-outline" size={11} color={theme.textDim} />
          </View>
          <View style={[s.verifiedPill, { marginTop: 4 }]}>
            <Ionicons name="checkmark-circle" size={11} color={theme.green} />
            <Text style={s.verifiedPillLabel}>Verified</Text>
          </View>
        </View>
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Text style={s.link}>View Details</Text>
          <Ionicons name="chevron-forward" size={13} color={theme.goldDeep} />
        </Pressable>
      </Surface>
      <Text style={s.idFootnote}>Your digital identity for a borderless financial experience.</Text>

      <View style={{ marginTop: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={s.sectionTitle}>Linked Bank Accounts</Text>
          <Text style={s.link}>Manage all</Text>
        </View>
        <Surface style={{ padding: 0, marginTop: 8 }}>
          {banks === null ? <ActivityIndicator color={theme.gold} style={{ padding: 16 }} /> :
            banks.length > 0 ? banks.slice(0, 3).map((b: any, i: number) => (
              <View key={b.id || i} style={s.bankListRow}>
                <View style={s.bankListIcon}><Ionicons name="business" size={15} color={theme.textDim} /></View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={s.rowTitleStrong}>{b.name || b.code}</Text>
                    {i === 0 && <View style={s.primaryPill}><Text style={s.primaryPillLabel}>Primary</Text></View>}
                  </View>
                  <Text style={s.rowSubtle}>**** {b.last4 || '0000'}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={s.activeDotSmall} />
                  <Text style={s.activeStatusLabel}>Active</Text>
                  <Ionicons name="chevron-forward" size={15} color={theme.textDim} />
                </View>
              </View>
            )) : <Text style={[s.empty, { padding: 16 }]}>No linked banks yet.</Text>}
        </Surface>
      </View>

      <View style={{ marginTop: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={s.sectionTitle}>Funding Options</Text>
            <Text style={s.rowSubtle}>Add money to your NORA account</Text>
          </View>
          <Text style={s.link}>View all</Text>
        </View>
        <View style={s.fundingGrid}>
          {FUNDING_OPTIONS.map((f) => (
            <Pressable key={f.title} style={s.fundingTile} onPress={() => go('fund')}>
              <View style={s.fundingTileIcon}><Ionicons name={f.icon as any} size={14} color={theme.textOnDark} /></View>
              <Text style={s.fundingTileLabel}>{f.title}</Text>
              <Text style={s.fundingTileSub}>{f.sub}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 18, marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={s.sectionTitle}>Withdrawal Destinations</Text>
            <Text style={s.rowSubtle}>Receive money in your local bank account or mobile wallet.</Text>
          </View>
          <Text style={s.link}>Manage</Text>
        </View>
        <Surface style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 20, marginRight: 12 }}>{flagFor('GH')}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.rowTitleStrong}>Ghana</Text>
            <Text style={s.rowSubtle}>GHC 840.00 available</Text>
          </View>
          <Pressable style={s.viewBanksBtn} onPress={() => go('withdraw')}>
            <Text style={s.viewBanksBtnLabel}>View banks</Text>
            <Ionicons name="chevron-forward" size={12} color={theme.text} />
          </Pressable>
        </Surface>
      </View>
    </ScrollView>
  );
}

export function AccountTile({ icon, label, sub, onPress }: { icon: any; label: string; sub: string; onPress: () => void }) {
  return (
    <Pressable style={s.accountTile} onPress={onPress}>
      <View style={s.accountTileIcon}><Ionicons name={icon} size={16} color={theme.textOnDark} /></View>
      <Text style={s.accountTileLabel}>{label}</Text>
      <Text style={s.accountTileSub}>{sub}</Text>
    </Pressable>
  );
}

