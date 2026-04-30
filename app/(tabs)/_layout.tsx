import { Tabs } from "expo-router";
import { BarChart3, Bot, Goal, LayoutDashboard, PiggyBank, Wallet } from "lucide-react-native";
import React from "react";
import { useWindowDimensions } from "react-native";

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const tabIconSize = 19;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#10233f",
        tabBarInactiveTintColor: "#7f8896",
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingTop: 6,
        },
        tabBarStyle: isLargeScreen
          ? { display: "none" }
          : {
              backgroundColor: "#ffffff",
              borderTopWidth: 1,
              borderTopColor: "#e5e7eb",
              height: 68,
              paddingTop: 6,
              paddingBottom: 6,
            },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Painel",
          tabBarIcon: ({ color }) => (
            <LayoutDashboard size={tabIconSize} color={color} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transa\u00e7\u00f5es",
          tabBarIcon: ({ color }) => (
            <Wallet size={tabIconSize} color={color} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "IA",
          tabBarIcon: ({ color }) => (
            <Bot size={tabIconSize} color={color} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="goal"
        options={{
          title: "Metas",
          href: "/(tabs)/transactions?new=1&type=expense&source=goal&category=Investimento&description=Meta%20de%20investimento",
          tabBarIcon: ({ color }) => (
            <Goal size={tabIconSize} color={color} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="graphs"
        options={{
          title: "Gr\u00e1fico",
          tabBarIcon: ({ color }) => (
            <BarChart3 size={tabIconSize} color={color} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="assistant-tools"
        options={{
          title: "Assistente",
          tabBarIcon: ({ color }) => (
            <Bot size={tabIconSize} color={color} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="savings-tools"
        options={{
          title: "Economia",
          tabBarIcon: ({ color }) => (
            <PiggyBank size={tabIconSize} color={color} strokeWidth={2.2} />
          ),
        }}
      />
    </Tabs>
  );
}
