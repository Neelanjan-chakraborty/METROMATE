import React from 'react';
import { Tabs } from 'expo-router';
import { Bookmark, List, LocateFixed, Map as MapIcon, TrainFront } from 'lucide-react-native';
import { colors } from '../../theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.faint,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border, minHeight: 58, paddingTop: 4 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Plan', tabBarIcon: ({ color, size }) => <TrainFront color={color} size={size} /> }} />
      <Tabs.Screen name="live" options={{ title: 'Live', tabBarIcon: ({ color, size }) => <LocateFixed color={color} size={size} /> }} />
      <Tabs.Screen name="map" options={{ title: 'Map', tabBarIcon: ({ color, size }) => <MapIcon color={color} size={size} /> }} />
      <Tabs.Screen name="stations" options={{ title: 'Stations', tabBarIcon: ({ color, size }) => <List color={color} size={size} /> }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved', tabBarIcon: ({ color, size }) => <Bookmark color={color} size={size} /> }} />
    </Tabs>
  );
}
