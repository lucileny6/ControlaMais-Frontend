import { usePathname, useRouter } from "expo-router";
import { BarChart3, Bot, Goal, LayoutDashboard, Wallet } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function DashboardNav() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    {
      title: "Painel",
      href: "/(tabs)/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Transacoes",
      href: "/(tabs)/transactions",
      icon: Wallet,
    },
    {
      title: "Relatorios",
      href: "/(tabs)/reports",
      icon: BarChart3,
    },
    {
      title: "Metas",
      href: "/(tabs)/goal",
      icon: Goal,
    },
    {
      title: "Chat IA",
      href: "/(tabs)/chat",
      icon: Bot,
    },
  ];

  return (
    <View style={styles.navContainer}>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <TouchableOpacity
            key={item.href}
            style={[styles.navButton, isActive ? styles.activeButton : styles.inactiveButton]}
            onPress={() => router.push(item.href as any)}
          >
            <Icon size={18} color={isActive ? "#1f2937" : "#7f8896"} strokeWidth={2.1} />
            <Text style={[styles.navText, isActive ? styles.activeText : styles.inactiveText]}>{item.title}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    paddingHorizontal: 10,
    gap: 2,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    marginVertical: 1,
    justifyContent: "flex-start",
  },
  activeButton: {
    backgroundColor: "#eff2f6",
  },
  inactiveButton: {
    backgroundColor: "transparent",
  },
  navText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "left",
  },
  activeText: {
    color: "#0f172a",
  },
  inactiveText: {
    color: "#4b5563",
  },
});
