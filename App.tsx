/**
 * NORA — Africa's Financial Network.
 * React Native + Expo. Backend is the single source of financial truth.
 *
 * Shell: AuthProvider (secure sessions) → RootNavigator (native stack + tabs).
 */
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider } from './src/features/auth/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { palette } from './src/design-system/tokens';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SafeAreaView style={styles.root}>
          <RootNavigator />
        </SafeAreaView>
      </AuthProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.cream },
});
