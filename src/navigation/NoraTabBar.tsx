/**
 * NORA bottom tab bar — pixel-matched to the reference design.
 * Custom component so the design system owns the chrome, not the navigator.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { palette } from '../design-system/tokens';

const TABS: { id: string; label: string; icon: string; iconOutline: string }[] = [
  { id: 'Home', label: 'Home', icon: 'home', iconOutline: 'home-outline' },
  { id: 'Send', label: 'Send', icon: 'paper-plane', iconOutline: 'paper-plane-outline' },
  { id: 'Activity', label: 'Activity', icon: 'time', iconOutline: 'time-outline' },
  { id: 'Accounts', label: 'Accounts', icon: 'business', iconOutline: 'business-outline' },
  { id: 'Profile', label: 'Profile', icon: 'person', iconOutline: 'person-outline' },
];

export function NoraTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const tab = TABS.find((t) => t.id === route.name) ?? TABS[0];
        const on = state.index === index;
        return (
          <Pressable
            key={route.key}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!on && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={styles.tabBtn}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={tab.label}
          >
            <Ionicons name={(on ? tab.icon : tab.iconOutline) as any} size={19} color={on ? palette.primary : palette.textDim} />
            <Text style={[styles.tabLabel, on && styles.tabLabelOn]}>{tab.label}</Text>
            {on && <View style={styles.tabUnderline} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: palette.white,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingVertical: 10,
    paddingBottom: 14,
    paddingHorizontal: 6,
  },
  tabBtn: { flex: 1, alignItems: 'center' },
  tabLabel: { color: palette.textDim, fontSize: 10, fontWeight: '700', marginTop: 3 },
  tabLabelOn: { color: palette.primary },
  tabUnderline: { marginTop: 4, width: 18, height: 2, borderRadius: 1, backgroundColor: palette.primary },
});
