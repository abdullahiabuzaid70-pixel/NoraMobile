/** NORA Profile — identity, verification, security settings, logout. */
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { nora } from '../../api';
import { theme } from '../../theme';
import { s } from '../../design-system/screenStyles';
import { DarkCard, ErrorText, Field, flagFor, money, PrimaryButton, Row, StatusPill, Surface } from '../../ui';
import { normalizeKyc, dailyLimitFor, TIER_LABELS } from '../../domain/kyc';
import { format } from '../../domain/money';
import { displayNoraId } from '../../domain/identity';
import { useServerQuery } from '../../hooks/useServerQuery';
import { accountApi } from '../../services/api/noraClient';
import { useStepUp } from '../../hooks/useStepUp';
import { err, NavTarget, User } from '../../types';
import { AccountTile } from '../accounts/AccountsScreen';


/* ============================== PROFILE ============================== */
const SETTINGS_ROWS = (kycLabel: string, kycVerified: boolean, bioLabel: string) => [
  { icon: 'person-outline', title: 'Personal Information', sub: 'Name, email, phone, date of birth' },
  { icon: 'shield-checkmark-outline', title: 'Security & Privacy', sub: bioLabel },
  { icon: 'document-text-outline', title: 'KYC Verification', sub: kycLabel, verified: kycVerified },
  { icon: 'notifications-outline', title: 'Notification Settings', sub: 'Transaction alerts, email, push' },
  { icon: 'headset-outline', title: 'Help & Support', sub: 'FAQs, live chat, contact us' },
  { icon: 'information-circle-outline', title: 'About NORA', sub: 'Version 1.0.0' },
] as const;

export function ProfileScreen({ user, go, onLogout }: { user: User; go: (s: NavTarget) => void; onLogout: () => void }) {
  // Truthful KYC: backend status only; missing endpoint = not started, never verified.
  const kycQuery = useServerQuery<Record<string, unknown>>('kyc', () =>
    accountApi.kyc().catch(() => null as unknown as Record<string, unknown>),
  );
  const kyc = normalizeKyc(kycQuery.data ?? null);
  const stepUp = useStepUp();
  const kycLabel =
    kyc.status === 'APPROVED' ? `${TIER_LABELS[kyc.tier]} · Daily limit ${format(dailyLimitFor(kyc))}` :
    kyc.status === 'PENDING' ? 'Verification under review' :
    kyc.status === 'REJECTED' ? 'Verification needs attention' :
    'Start verification to unlock transfers';
  const initials = `${(user.first_name || '?')[0]}${(user.last_name || '')[0] || ''}`.toUpperCase();
  const idClean = user.nora_id ? displayNoraId(String(user.nora_id)) : '—';

  return (
    <ScrollView style={s.page} contentContainerStyle={[s.pageInner, { paddingBottom: 120 }]}>
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
            <Ionicons name="notifications-outline" size={18} color={theme.dark} />
            <View style={s.bellDot} />
          </View>
          <View style={s.bellWrap}><Ionicons name="settings-outline" size={18} color={theme.dark} /></View>
        </View>
      </View>

      <View style={s.profileHeadRow}>
        <View style={s.avatarWrap}>
          <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
          <View style={s.cameraBadge}><Ionicons name="camera" size={11} color={theme.dark} /></View>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={s.profileName}>{user.first_name} {user.last_name}</Text>
            <Ionicons name="checkmark-circle" size={14} color={theme.gold} />
          </View>
          <Text style={s.rowSubtle}>{user.email || user.phone || '—'}</Text>
          <View style={[s.verifiedPill, { marginTop: 4 }]}>
            <Ionicons name="checkmark-circle" size={11} color={theme.green} />
            <Text style={s.verifiedPillLabel}>Verified</Text>
          </View>
        </View>
        <Pressable style={{ alignItems: 'flex-end' }}>
          <Text style={s.rowSubtle}>NORA ID</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={s.rowTitleStrong}>{idClean}</Text>
            <Ionicons name="copy-outline" size={11} color={theme.textDim} />
          </View>
        </Pressable>
      </View>

      <DarkCard style={{ marginTop: 14 }}>
        <Text style={s.darkLabel}>NORA ID</Text>
        <Text style={[s.darkBalance, { fontSize: 22, marginTop: 6 }]}>{idClean}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <View>
            <View style={s.verifiedPillDark}><Ionicons name="checkmark-circle" size={11} color={theme.gold} /><Text style={s.verifiedPillDarkLabel}>Verified</Text></View>
            <Text style={s.idTextSmall}>Full KYC · Level 2</Text>
          </View>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="qr-code-outline" size={16} color={theme.textDimOnDark} />
            <Text style={s.idText}>Show my NORA ID</Text>
            <Ionicons name="chevron-forward" size={13} color={theme.textDimOnDark} />
          </Pressable>
        </View>
      </DarkCard>

      <View style={{ marginTop: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={s.sectionTitle}>Account Overview</Text>
          <Pressable><Text style={s.link}>View all</Text></Pressable>
        </View>
        <AccountOverviewCard user={user} />
      </View>

      <View style={s.accountTileGrid}>
        <AccountTile icon="business" label="Fund Account" sub="Add money to NORA" onPress={() => go('fund')} />
        <AccountTile icon="arrow-up" label="Withdraw" sub="To your bank" onPress={() => go('withdraw')} />
        <AccountTile icon="card" label="Linked Banks" sub="Manage institutions" onPress={() => go('accounts')} />
        <AccountTile icon="globe" label="NORA ID" sub="View & manage" onPress={() => {}} />
      </View>

      <Surface style={{ padding: 0, marginTop: 18 }}>
        {SETTINGS_ROWS(kycLabel, kyc.fullyVerified, stepUp.available ? `${stepUp.kind === 'face' ? 'Face ID' : stepUp.kind === 'iris' ? 'Iris' : 'Fingerprint'} available · PIN protected` : 'PIN protected').map((r, i) => (
          <Row
            key={r.title}
            icon={<Ionicons name={r.icon as any} size={16} color={theme.dark} />}
            title={r.title}
            subtitle={r.sub}
            onPress={() => {}}
            right={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {'verified' in r && (r as any).verified && (
                  <View style={s.verifiedPill}><Ionicons name="checkmark-circle" size={10} color={theme.green} /><Text style={s.verifiedPillLabel}>Verified</Text></View>
                )}
                <Ionicons name="chevron-forward" size={15} color={theme.textDim} />
              </View>
            }
          />
        ))}
      </Surface>

      <View style={s.profilePromo}>
        <View style={{ flex: 1 }}>
          <Text style={s.promoTitleDark}>A bigger network. More opportunities.</Text>
          <Text style={s.sendPromoSub}>Send, receive and grow across Africa and beyond.</Text>
        </View>
        <View style={s.learnMoreBtn}><Text style={s.learnMoreBtnLabel}>Learn More</Text><Ionicons name="chevron-forward" size={11} color={theme.dark} /></View>
      </View>

      <PrimaryButton label="Sign out" onPress={onLogout} variant="outline" />
    </ScrollView>
  );
}

function AccountOverviewCard({ user }: { user: User }) {
  const [balances, setBalances] = useState<any[] | null>(null);
  useEffect(() => { nora.balances().then((b: any) => setBalances(Array.isArray(b) ? b : b?.balances ?? [])).catch(() => setBalances([])); }, []);
  const main = balances?.find((x: any) => x.currency === (user.currency || 'NGN')) || balances?.[0];
  const currency = main?.currency || user.currency || 'NGN';
  const available = main?.available ?? main?.balance ?? 0;
  const idClean = user.nora_id ? String(user.nora_id).replace('@', '') : 'NA-0000-0000';
  return (
    <Surface style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={s.rowSubtle}>NORA Account Balance</Text>
          <Ionicons name="eye-outline" size={12} color={theme.textDim} />
        </View>
        {balances === null ? <ActivityIndicator color={theme.gold} style={{ marginTop: 8 }} /> : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Text style={s.overviewBalance}>{money(available, currency)}</Text>
            <View style={s.activePill}><View style={s.activeDot} /><Text style={s.activePillLabel}>Active</Text></View>
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
          <Text style={s.rowSubtle}>NORA ID: {idClean}</Text>
          <Ionicons name="copy-outline" size={10} color={theme.textDim} />
        </View>
      </View>
      <View style={s.miniCard}>
        <Text style={s.miniCardLabel}>NORA</Text>
        <Ionicons name="hardware-chip-outline" size={12} color={theme.gold} style={{ marginTop: 10 }} />
      </View>
    </Surface>
  );
}

