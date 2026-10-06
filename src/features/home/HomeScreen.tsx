/** NORA Home — the reference implementation screen. */
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { nora } from '../../api';
import { theme } from '../../theme';
import { s } from '../../design-system/screenStyles';
import { DarkCard, ErrorText, Field, flagFor, money, PrimaryButton, Row, StatusPill, Surface } from '../../ui';
import { err, NavTarget, User } from '../../types';
import { TxRow } from '../activity/TxRow';


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
