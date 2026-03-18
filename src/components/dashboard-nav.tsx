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
      title: "Assistente",
      href: "/(tabs)/assistant-tools",
      icon: Bot,
    },
    {
      title: "Economia",
      href: "/(tabs)/savings-tools",
      icon: BarChart3,
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
    paddingHorizontal: 12,
    gap: 4,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    marginVertical: 1,
    justifyContent: "flex-start",
  },
  activeButton: {
    backgroundColor: "rgba(226, 236, 244, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(197, 210, 223, 0.52)",
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
    color: "#10233f",
    fontWeight: "700",
  },
  inactiveText: {
    color: "#5f7087",
  },
});
