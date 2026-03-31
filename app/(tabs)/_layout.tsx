import { Tabs } from "expo-router";
import React from "react";
import { Text, useWindowDimensions } from "react-native";

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: isLargeScreen
          ? { display: "none" }
          : {
              backgroundColor: "#ffffff",
              borderTopWidth: 1,
              borderTopColor: "#e5e7eb",
            },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>📊</Text>,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transações",
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>💳</Text>,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Relatorios",
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>📈</Text>,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "IA",
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🤖</Text>,
        }}
      />
      <Tabs.Screen
        name="goal"
        options={{
          title: "Metas",
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🎯</Text>,
        }}
      />
      <Tabs.Screen
        name="graphs"
        options={{
          href: null,
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
