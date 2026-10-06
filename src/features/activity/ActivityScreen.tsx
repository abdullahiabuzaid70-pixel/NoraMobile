/** NORA Activity — filters, trend card, transaction list. */
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View, FlatList } from 'react-native';
import { nora } from '../../api';
import { theme } from '../../theme';
import { s } from '../../design-system/screenStyles';
import { DarkCard, ErrorText, Field, flagFor, money, PrimaryButton, Row, StatusPill, Surface } from '../../ui';
import { err, NavTarget, User } from '../../types';
import { TxRow } from './TxRow';


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
  const total = (list || []).reduce((sum: number, t: any) => {
    const type = (t.type || '').toLowerCase();
    const amt = parseFloat(t.amount ?? t.debit_amount ?? t.credit_amount ?? 0) || 0;
    return type.includes('send') || type.includes('withdraw') ? sum - amt : sum + amt;
  }, 0);
  const currency = list && list[0]?.currency;

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

      <DarkCard style={{ marginTop: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={s.darkLabel}>Total Activity</Text>
          <Ionicons name="eye-outline" size={12} color={theme.textDimOnDark} />
        </View>
        <Text style={s.darkBalance}>{money(Math.abs(total), currency || 'NGN')}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="arrow-up" size={11} color={theme.green} />
            <Text style={s.trendUp}>+12%</Text>
            <Text style={s.idText}>vs last 30 days</Text>
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
      {list === null && !error ? <ActivityIndicator color={theme.gold} style={{ marginTop: 24 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={(_, i) => String(i)}
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
          contentContainerStyle={{ paddingBottom: 120 }}
          style={{ marginTop: 4 }}
        />
      )}
    </View>
  );
}

