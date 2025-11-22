import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function DashboardNav() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
  {
    title: "Dashboard",
    href: "/(tabs)/dashboard",
  },
  {
    title: "Transações",
    href: "/(tabs)/transactions",
  },
  {
    title: "Relatórios",
    href: "/(tabs)/reports",
  },
  {
    title: "Metas",
    href: "/(tabs)/goal",
  },
  {
    title: "Chat IA",
    href: "/(tabs)/chat",
  },
];

  return (
    <View style= {styles.navContainer}>
      {navItems.map((item) => {

        const isActive = pathname === item.href;

        return(
          <TouchableOpacity
            key={item.href}
            style={[
              styles.navButton,
              isActive ? styles.activeButton : styles.inactiveButton
            ]}
            onPress={() => router.push(item.href as any)}
          >
            <Text style={[
              styles.navText,
              isActive ? styles.activeText : styles.inactiveText
            ]}>
              {item.title}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    paddingHorizontal: 8,
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginVertical: 2,
    justifyContent: 'flex-start',
  },
  activeButton: {
    backgroundColor: '#f5f5f5', // bg-secondary
  },
  inactiveButton: {
    backgroundColor: 'transparent', // ghost variant
  },
  navText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'left',
  },
  activeText: {
    color: '#000000', // text-secondary-foreground
  },
  inactiveText: {
    color: '#666666', // ghost text color
  },
});