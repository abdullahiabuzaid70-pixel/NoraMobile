/**
 * NORA navigation — native stack + bottom tabs.
 *
 * - Authentication gates the whole stack (session from AuthContext).
 * - Money-flow screens (Fund / Withdraw) are native-stack screens so they
 *   isolate transaction state and respect Android back correctly.
 * - Deep links via the `nora://` scheme.
 */
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { palette } from '../design-system/tokens';
import { useAuth } from '../features/auth/AuthContext';
import { AuthScreen } from '../features/auth/AuthScreen';
import { HomeScreen } from '../features/home/HomeScreen';
import { SendScreen } from '../features/send/SendScreen';
import { ActivityScreen } from '../features/activity/ActivityScreen';
import { AccountsScreen } from '../features/accounts/AccountsScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { FundScreen } from '../features/funding/FundScreen';
import { WithdrawScreen } from '../features/withdrawal/WithdrawScreen';
import { NoraTabBar } from './NoraTabBar';
import type { NavTarget } from '../types';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: palette.cream, primary: palette.primary },
};

/** Maps the shared NavTarget contract onto tab + stack navigation. */
function useGo(): (s: NavTarget) => void {
  const navigation = useNavigation<any>();
  return (target: NavTarget) => {
    if (target === 'fund') navigation.navigate('Fund');
    else if (target === 'withdraw') navigation.navigate('Withdraw');
    else if (target === 'send') navigation.navigate('MainTabs', { screen: 'Send' });
    else if (target === 'activity') navigation.navigate('MainTabs', { screen: 'Activity' });
    else navigation.navigate('MainTabs', { screen: 'Accounts' });
  };
}

function MainTabs() {
  const { user, logout } = useAuth();
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false }} tabBar={(p) => <NoraTabBar {...p} />}>
      <Tabs.Screen name="Home">{() => <HomeScreen user={user!} go={useGo()} />}</Tabs.Screen>
      <Tabs.Screen name="Send">{() => <SendScreen user={user!} back={useBackToHome()} />}</Tabs.Screen>
      <Tabs.Screen name="Activity">{() => <ActivityScreen />}</Tabs.Screen>
      <Tabs.Screen name="Accounts">{() => <AccountsScreen user={user!} go={useGo()} />}</Tabs.Screen>
      <Tabs.Screen name="Profile">{() => <ProfileScreen user={user!} go={useGo()} onLogout={logout} />}</Tabs.Screen>
    </Tabs.Navigator>
  );
}

function useBackToHome(): () => void {
  const navigation = useNavigation<any>();
  return () => navigation.navigate('MainTabs', { screen: 'Home' });
}

function AppStack() {
  const { user } = useAuth();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Fund">{() => <FundScreen user={user!} back={useStackBack()} />}</Stack.Screen>
      <Stack.Screen name="Withdraw">{() => <WithdrawScreen user={user!} back={useStackBack()} />}</Stack.Screen>
    </Stack.Navigator>
  );
}

function useStackBack(): () => void {
  const navigation = useNavigation<any>();
  return () => navigation.goBack();
}

function RestoringSplash() {
  return (
    <View style={styles.splash}>
      <Text style={styles.logo}>NORA</Text>
      <ActivityIndicator color={palette.gold} style={{ marginTop: 16 }} />
    </View>
  );
}

export function RootNavigator() {
  const { status } = useAuth();
  return (
    <NavigationContainer theme={navTheme} linking={{ prefixes: ['nora://'] }}>
      {status === 'restoring' ? <RestoringSplash /> : status === 'authenticated' ? <AppStack /> : <AuthScreen />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.primary },
  logo: { color: palette.cream, fontSize: 34, fontWeight: '800', letterSpacing: 2 },
});
