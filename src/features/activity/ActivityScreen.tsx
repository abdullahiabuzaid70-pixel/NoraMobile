/**
 * NORA Activity — filters, truthful in/out summary, transaction list.
 *
 * Offline pattern (§37): cached-first paint + revalidation + labeled cache.
 * No fabricated metrics: the summary shows in/out totals computed from the
 * actual backend list — never a decorative trend that isn't real.
 */
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, RefreshControl, ScrollView, Text, View, FlatList } from 'react-native';
import { theme } from '../../theme';
import { s } from '../../design-system/screenStyles';
import { DarkCard, ErrorText, Skeleton, Surface } from '../../ui';
import { format, fromBackendValue, Money } from '../../domain/money';
import { useServerQuery } from '../../hooks/useServerQuery';
import { accountApi, Transaction } from '../../services/api/noraClient';
import { TxRow } from './TxRow';

const FILTERS = ['All', 'Send', 'Receive', 'Add Money', 'Withdraw'];

export function ActivityScreen() {
  const [filter, setFilter] = useState('All');
  const { data, loading, refreshing, error, offline, cachedAt, refresh } =
    useServerQuery<Transaction[] | { transactions?: Transaction[] }>('activity', () => accountApi.activity());

  const list: Transaction[] = Array.isArray(data) ? data : data?.transactions ?? [];
  const currency = list[0]?.currency || 'NGN';

  // Truthful summary: computed from the backend list, in integer minor units.
  const inflow = list.reduce((sum, t) => {
    const type = (t.type || '').toLowerCase();
    const amt = Number(t.credit_amount ?? t.amount ?? 0);
    return type.includes('receive') || type.includes('fund') || type.includes('add') ? sum + Math.round(amt * 100) : sum;
  }, 0);
  const outflow = list.reduce((sum, t) => {
    const type = (t.type || '').toLowerCase();
    const amt = Number(t.debit_amount ?? t.amount ?? 0);
    return type.includes('send') || type.includes('withdraw') ? sum + Math.round(amt * 100) : sum;
  }, 0);
  const net: Money = { amountMinor: inflow - outflow, currency };
  const netIn = net.amountMinor >= 0;

  const filtered = list.filter((t) => filter === 'All' || (t.type || '').toLowerCase().includes(filter.toLowerCase().split(' ')[0]));

  const cachedAtLabel = cachedAt ? new Date(cachedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'earlier';

  return (
    <View style={[s.page, { paddingTop: 18, paddingHorizontal: 18 }]}>
      <View style={s.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={s.screenTitle}>Activity</Text>
          <Text style={s.accountsSubtitle}>Track your transactions, anytime, anywhere.</Text>
        </View>
        <View style={s.topBarIcons}>
          <View style={s.bellWrap}><Ionicons name="notifications-outline" size={18} color={theme.dark} /><View style={s.bellDot} /></View>
          <Ionicons name="person-circle-outline" size={28} color={theme.textDim} />
        </View>
      </View>

      <View style={s.dateRangePill}>
        <Ionicons name="calendar-outline" size={13} color={theme.text} />
        <Text style={s.dateRangeLabel}>This month</Text>
        <Ionicons name="chevron-down" size={12} color={theme.text} />
      </View>

      <View style={s.filterRow}>
        {FILTERS.map((f) => (
          <Pressable key={f} onPress={() => setFilter(f)} style={[s.filterChip, filter === f && s.filterChipOn]}>
            <Text style={[s.filterChipLabel, filter === f && s.filterChipOnLabel]}>{f}</Text>
          </Pressable>
        ))}
      </View>

      {offline && (
        <View style={s.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={13} color={theme.goldDeep} />
          <Text style={s.offlineBannerText}>You're offline. Showing saved activity from {cachedAtLabel}.</Text>
        </View>
      )}

      <DarkCard style={{ marginTop: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={s.darkLabel}>Net movement</Text>
          <Ionicons name="eye-outline" size={12} color={theme.textDimOnDark} />
        </View>
        {loading ? (
          <View style={{ marginTop: 10 }}><Skeleton width={160} height={34} style={{ backgroundColor: theme.darkElev }} /></View>
        ) : (
          <Text style={s.darkBalance}>{netIn ? '' : '-'}{format({ amountMinor: Math.abs(net.amountMinor), currency })}</Text>
        )}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="arrow-down" size={11} color={theme.green} />
            <Text style={s.trendUp}>In {format({ amountMinor: inflow, currency })}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="arrow-up" size={11} color={theme.red || theme.goldDeep} />
            <Text style={s.idText}>Out {format({ amountMinor: outflow, currency })}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="stats-chart-outline" size={13} color={theme.textDimOnDark} />
            <Text style={s.analyticsLink}>View Analytics</Text>
            <Ionicons name="chevron-forward" size={12} color={theme.textDimOnDark} />
          </View>
        </View>
      </DarkCard>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
        <Text style={s.sectionTitle}>Recent Transactions</Text>
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Text style={s.link}>See all</Text>
          <Ionicons name="chevron-forward" size={13} color={theme.goldDeep} />
        </Pressable>
      </View>

      <ErrorText>{error}</ErrorText>
      {loading ? (
        <View style={{ gap: 14, marginTop: 4 }}>
          {[0, 1, 2, 3].map((i) => (
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
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => item.id || String(i)}
          renderItem={({ item, index }) => <TxRow tx={item} last={index === filtered.length - 1} />}
          ListEmptyComponent={<Text style={s.empty}>No transactions yet.</Text>}
          ListFooterComponent={
            <View style={s.securityBanner}>
              <View style={s.securityIcon}><Ionicons name="shield-checkmark" size={15} color={theme.gold} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.securityTitle}>Your transactions are secure</Text>
                <Text style={s.securitySub}>Powered by bank-grade encryption and NORA's trusted network.</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={theme.textDim} />
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.gold} />}
          contentContainerStyle={{ paddingBottom: 120 }}
          style={{ marginTop: 4 }}
        />
      )}
    </View>
  );
}
