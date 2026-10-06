import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { theme } from '../../theme';
import { s } from '../../design-system/screenStyles';
import { DarkCard, ErrorText, Skeleton, Surface } from '../../ui';
import { format, fromBackendValue } from '../../domain/money';
import { displayNoraId } from '../../domain/identity';
import { useServerQuery } from '../../hooks/useServerQuery';
import { accountApi, Balance, Transaction } from '../../services/api/noraClient';
import { NavTarget, User } from '../../types';
import { TxRow } from '../activity/TxRow';

/* ============================== HOME ============================== */

const normBalances = (b: Balance[] | { balances?: Balance[] } | null): Balance[] =>
  Array.isArray(b) ? b : b?.balances ?? [];
const normActivity = (a: Transaction[] | { transactions?: Transaction[] } | null): Transaction[] =>
  Array.isArray(a) ? a : a?.transactions ?? [];

export function HomeScreen({ user, go }: { user: User; go: (s: NavTarget) => void }) {
  const [hidden, setHidden] = useState(false);

  // Progressive rendering: header/tiles render instantly; each section
  // manages its own loading state and falls back to a labeled cache
  // when connectivity drops (§8, §37).
  const balancesQuery = useServerQuery<Balance[] | { balances?: Balance[] }>('balances', () => accountApi.balances());
  const activityQuery = useServerQuery<Transaction[] | { transactions?: Transaction[] }>('activity', () => accountApi.activity());

  const refresh = () => Promise.all([balancesQuery.refresh(), activityQuery.refresh()]);

  const balances = normBalances(balancesQuery.data as any);
  const recent = normActivity(activityQuery.data as any).slice(0, 4);
  const main = balances.find((x: Balance) => x.currency === (user.currency || 'NGN')) || balances[0];
  const currency = main?.currency || user.currency || 'NGN';
  const available = main?.available ?? main?.balance ?? main?.available_balance ?? 0;
  const initial = (user.first_name || '?')[0]?.toUpperCase();

  const cachedAtLabel = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); } catch { return 'earlier'; }
  };

  return (
    <ScrollView
      style={s.page}
      contentContainerStyle={s.pageInner}
      refreshControl={<RefreshControl refreshing={balancesQuery.refreshing || activityQuery.refreshing} onRefresh={refresh} tintColor={theme.gold} />}
    >
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

      {(balancesQuery.offline || activityQuery.offline) && (
        <View style={s.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={13} color={theme.goldDeep} />
          <Text style={s.offlineBannerText}>You're offline. Showing saved info from {cachedAtLabel(balancesQuery.cachedAt || activityQuery.cachedAt || '')}.</Text>
        </View>
      )}
      {balancesQuery.error ? <ErrorText>{balancesQuery.error}</ErrorText> : null}

      <DarkCard style={{ marginTop: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={s.darkLabel}>NORA Account Balance</Text>
            <Pressable onPress={() => setHidden(!hidden)} accessibilityRole="button" accessibilityLabel={hidden ? 'Show balance' : 'Hide balance'}>
              <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={14} color={theme.textDimOnDark} />
            </Pressable>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textDimOnDark} />
        </View>
        {balancesQuery.loading ? (
          <View style={{ marginTop: 12 }}>
            <Skeleton width={180} height={34} style={{ backgroundColor: theme.darkElev }} />
          </View>
        ) : (
          <Text style={s.darkBalance}>{hidden ? '••••••' : format(fromBackendValue(available, currency))}</Text>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
          <View style={s.activePill}>
            <View style={s.activeDot} />
            <Text style={s.activePillLabel}>Active</Text>
          </View>
        </View>
        <View style={s.idRow}>
          <Text style={s.idText}>{user.nora_id ? `NORA ID: ${displayNoraId(String(user.nora_id))}` : 'NORA ID: —'}</Text>
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
          {activityQuery.loading ? (
            <View style={{ padding: 16, gap: 14 }}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Skeleton width={32} height={32} style={{ borderRadius: 16 }} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Skeleton width="fill" height={12} />
                    <Skeleton width={110} height={10} />
                  </View>
                  <Skeleton width={70} height={12} />
                </View>
              ))}
            </View>
          ) : recent.length > 0 ? (
            recent.map((t: any, i: number) => <TxRow key={t.id || i} tx={t} last={i === recent.length - 1} />)
          ) : (
            <Text style={[s.empty, { padding: 16 }]}>No transactions yet. Send money to get started.</Text>
          )}
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
