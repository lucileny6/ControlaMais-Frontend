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
        // ⬇️ TAB BAR APENAS NO MOBILE
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
            <Text style={{ fontSize: 20 }}>{focused ? '📊' : '📊'}</Text>
          ),
        }}
      />
      <Tabs.Screen 
        name="transactions" 
        options={{
          title: 'Transações',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? '💳' : '💳'}</Text>
          ),
        }}
      />
      <Tabs.Screen 
        name="reports" 
        options={{
          title: 'Relatórios',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? '📈' : '📈'}</Text>
          ),
        }}
      />
      <Tabs.Screen 
        name="chat" 
        options={{
          title: 'IA',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? '🤖' : '🤖'}</Text>
          ),
        }}
      />
      <Tabs.Screen 
        name="goal" 
        options={{
          title: 'Metas',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20 }}>{focused ? '🎯' : '🎯'}</Text>
          ),
        }}
      />
    </Tabs>
  );
}