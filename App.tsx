/**
 * NORA — Africa's Financial Network. React Native (Expo) mobile app.
 * Matches the official brand design: light background, dark-green cards, gold accents.
 * Talks to the same NORA backend as the web app (nora-sepia.vercel.app).
 */
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setToken } from './src/api';
import { AccountsScreen, ActivityScreen, AuthScreen, FundScreen, HomeScreen, ProfileScreen, SendScreen, User, WithdrawScreen } from './src/screens';
import { theme } from './src/theme';

type Tab = 'home' | 'send' | 'activity' | 'accounts' | 'profile';
type ModalScreen = 'fund' | 'withdraw' | null;

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'home', label: 'Home', emoji: '🏠' },
  { id: 'send', label: 'Send', emoji: '↗' },
  { id: 'activity', label: 'Activity', emoji: '🕘' },
  { id: 'accounts', label: 'Accounts', emoji: '🏦' },
  { id: 'profile', label: 'Profile', emoji: '👤' },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>('home');
  const [modalScreen, setModalScreen] = useState<ModalScreen>(null);

  if (!user) {
    return (
      <SafeAreaView style={styles.root}>
        <AuthScreen onAuthed={(u) => setUser(u)} />
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  const go = (screen: 'send' | 'activity' | 'accounts' | 'fund' | 'withdraw') => {
    if (screen === 'fund' || screen === 'withdraw') setModalScreen(screen);
    else setTab(screen);
  };
  const closeModal = () => setModalScreen(null);

  return (
    <SafeAreaView style={styles.root}>
      {modalScreen === 'fund' ? <FundScreen user={user} back={closeModal} /> :
       modalScreen === 'withdraw' ? <WithdrawScreen user={user} back={closeModal} /> :
       tab === 'home' ? <HomeScreen user={user} go={go} /> :
       tab === 'send' ? <SendScreen user={user} back={() => setTab('home')} /> :
       tab === 'activity' ? <ActivityScreen /> :
       tab === 'accounts' ? <AccountsScreen user={user} go={go} /> :
       <ProfileScreen user={user} onLogout={() => { setToken(null); setUser(null); setTab('home'); }} />}

      {modalScreen === null && (
        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <Pressable key={t.id} onPress={() => setTab(t.id)} style={styles.tabBtn}>
              <Text style={{ fontSize: 17, opacity: tab === t.id ? 1 : 0.45 }}>{t.emoji}</Text>
              <Text style={[styles.tabLabel, tab === t.id && styles.tabLabelOn]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  tabBar: { flexDirection: 'row', backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border, paddingVertical: 10, paddingBottom: 14, paddingHorizontal: 6 },
  tabBtn: { flex: 1, alignItems: 'center' },
  tabLabel: { color: theme.textDim, fontSize: 10, fontWeight: '700', marginTop: 3 },
  tabLabelOn: { color: theme.dark },
});
