/**
 * NORA — Africa's Financial Network. React Native (Expo) mobile app.
 * Matches the official brand design: light background, dark-green cards, gold accents.
 * Talks to the same NORA backend as the web app (nora-sepia.vercel.app).
 */
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setToken } from './src/api';
import { AccountsScreen, ActivityScreen, AuthScreen, FundScreen, HomeScreen, ProfileScreen, SendScreen, User, WithdrawScreen } from './src/screens';
import { theme } from './src/theme';

type Tab = 'home' | 'send' | 'activity' | 'accounts' | 'profile';
type ModalScreen = 'fund' | 'withdraw' | null;

const TABS: { id: Tab; label: string; icon: any; iconOutline: any }[] = [
  { id: 'home', label: 'Home', icon: 'home', iconOutline: 'home-outline' },
  { id: 'send', label: 'Send', icon: 'paper-plane', iconOutline: 'paper-plane-outline' },
  { id: 'activity', label: 'Activity', icon: 'time', iconOutline: 'time-outline' },
  { id: 'accounts', label: 'Accounts', icon: 'business', iconOutline: 'business-outline' },
  { id: 'profile', label: 'Profile', icon: 'person', iconOutline: 'person-outline' },
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
          {TABS.map((t) => {
            const on = tab === t.id;
            return (
              <Pressable key={t.id} onPress={() => setTab(t.id)} style={styles.tabBtn}>
                <Ionicons name={on ? t.icon : t.iconOutline} size={19} color={on ? theme.green : theme.textDim} />
                <Text style={[styles.tabLabel, on && styles.tabLabelOn]}>{t.label}</Text>
                {on && <View style={styles.tabUnderline} />}
              </Pressable>
            );
          })}
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
  tabLabelOn: { color: theme.green },
  tabUnderline: { marginTop: 4, width: 18, height: 2, borderRadius: 1, backgroundColor: theme.green },
});
