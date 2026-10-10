import React from 'react';
import { Tabs } from 'expo-router/js-tabs';
import { MetroTabBar } from '../../components/MetroTabBar';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <MetroTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Plan' }} />
      <Tabs.Screen name="live" options={{ title: 'Live' }} />
      <Tabs.Screen name="map" options={{ title: 'Map' }} />
      <Tabs.Screen name="bus" options={{ title: 'Bus' }} />
      <Tabs.Screen name="stations" options={{ title: 'Stations' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
    </Tabs>
  );
}
