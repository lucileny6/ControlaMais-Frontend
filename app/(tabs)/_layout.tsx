// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';
import { Text, useWindowDimensions } from 'react-native';

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768; // Tablet/desktop

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // â¬‡ï¸ TAB BAR APENAS NO MOBILE
        tabBarStyle: isLargeScreen ? { display: 'none' } : {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
        },
      }}
    >
      <Tabs.Screen 
        name="dashboard" 
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? 'ðŸ“Š' : 'ðŸ“Š'}</Text>
          ),
        }}
      />
      <Tabs.Screen 
        name="transactions" 
        options={{
          title: 'TransaÃ§Ãµes',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? 'ðŸ’³' : 'ðŸ’³'}</Text>
          ),
        }}
      />
      <Tabs.Screen 
        name="reports" 
        options={{
          title: 'RelatÃ³rios',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? 'ðŸ“ˆ' : 'ðŸ“ˆ'}</Text>
          ),
        }}
      />
      <Tabs.Screen 
        name="chat" 
        options={{
          title: 'IA',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? 'ðŸ¤–' : 'ðŸ¤–'}</Text>
          ),
        }}
      />
      <Tabs.Screen 
        name="goal" 
        options={{
          title: 'Metas',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? 'ðŸŽ¯' : 'ðŸŽ¯'}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="assistant-tools"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="savings-tools"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

