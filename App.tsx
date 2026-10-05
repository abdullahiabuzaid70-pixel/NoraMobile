/**
 * NORA — Africa's Financial Network. React Native (Expo) mobile app.
 * Talks to the same NORA backend as the web app (nora-sepia.vercel.app).
 */
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setToken } from './src/api';
import { ActivityScreen, AuthScreen, FundScreen, HomeScreen, ProfileScreen, SendScreen, User, WithdrawScreen } from './src/screens';
import { theme } from './src/theme';

type Tab = 'home' | 'send' | 'activity' | 'profile';
type ModalScreen = 'fund' | 'withdraw' | null;

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'home', label: 'Home', emoji: '🏠' },
  { id: 'send', label: 'Send', emoji: '💸' },
  { id: 'activity', label: 'Activity', emoji: '📊' },
  { id: 'profile', label: 'You', emoji: '👤' },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>('home');
  const [modalScreen, setModalScreen] = useState<ModalScreen>(null);

  if (!user) {
    return (
      <SafeAreaView style={styles.root}>
        <AuthScreen onAuthed={(u) => setUser(u)} />
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  const go = (screen: 'send' | 'fund' | 'withdraw' | 'activity') =>
    screen === 'send' || screen === 'activity' ? setTab(screen) : setModalScreen(screen);

  return (
    <SafeAreaView style={styles.root}>
      {modalScreen === 'fund' ? <FundScreen user={user} /> :
       modalScreen === 'withdraw' ? <WithdrawScreen user={user} /> :
       tab === 'home' ? <HomeScreen user={user} go={go} /> :
       tab === 'send' ? <SendScreen user={user} /> :
       tab === 'activity' ? <ActivityScreen /> :
       <ProfileScreen user={user} onLogout={() => { setToken(null); setUser(null); setTab('home'); }} />}

      {modalScreen === null && (
        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <Pressable key={t.id} onPress={() => setTab(t.id)} style={styles.tabBtn}>
              <Text style={{ fontSize: 18, opacity: tab === t.id ? 1 : 0.5 }}>{t.emoji}</Text>
              <Text style={[styles.tabLabel, tab === t.id && styles.tabLabelOn]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {modalScreen !== null && (
        <View style={styles.tabBar}>
          <Pressable onPress={() => setModalScreen(null)} style={styles.tabBtn}>
            <Text style={{ fontSize: 18 }}>←</Text>
            <Text style={styles.tabLabel}>Back</Text>
          </Pressable>
        </View>
      )}
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  tabBar: { flexDirection: 'row', backgroundColor: theme.card, borderTopWidth: 1, borderTopColor: theme.border, paddingVertical: 10, paddingBottom: 14, paddingHorizontal: 8 },
  tabBtn: { flex: 1, alignItems: 'center' },
  tabLabel: { color: theme.textDim, fontSize: 11, fontWeight: '700', marginTop: 4 },
  tabLabelOn: { color: theme.gold },
});
