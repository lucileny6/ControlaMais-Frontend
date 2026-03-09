import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNav } from '@/components/dashboard-nav';
import { SavingsSuggestions } from '@/components/savings-suggestions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface User {
  name?: string;
  email?: string;
}

const DASHBOARD_GRADIENT = ['#000000', '#073D33', '#107A65', '#20F4CA'] as const;

export default function SavingsToolsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  useEffect(() => {
    void checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const [authToken, legacyAuthToken, storedUser, legacyStoredUser] = await Promise.all([
        AsyncStorage.getItem('authToken'),
        AsyncStorage.getItem('@authToken'),
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('@user'),
      ]);
      const token = authToken || legacyAuthToken;
      const userFromStorage = storedUser || legacyStoredUser;

      if (!token) {
        router.replace('/login');
        return;
      }

      if (userFromStorage) {
        setUser(JSON.parse(userFromStorage));
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticacao:', error);
      router.replace('/login');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <LinearGradient colors={DASHBOARD_GRADIENT} locations={[0, 0.3, 0.57, 0.82, 1]} style={styles.gradient}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={DASHBOARD_GRADIENT} locations={[0, 0.3, 0.57, 0.82, 1]} style={styles.gradient}>
      <View style={[styles.layoutContainer, { paddingTop: insets.top }]}>
        <DashboardHeader />

        <View style={styles.content}>
          {isLargeScreen && (
            <View style={styles.sidebar}>
              <View style={styles.sidebarContent}>
                <DashboardNav />
              </View>
            </View>
          )}

          <View style={styles.main}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.pageContent}>
                <View style={styles.header}>
                  <Text style={styles.title}>Sugestoes de Economia</Text>
                  <Text style={styles.subtitle}>Recomendacoes para reduzir gastos e aumentar sua economia mensal</Text>
                </View>

                <SavingsSuggestions />
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  layoutContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 256,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  sidebarContent: {
    paddingVertical: 24,
  },
  main: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  pageContent: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
});
