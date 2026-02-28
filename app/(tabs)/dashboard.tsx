import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardNav } from "@/components/dashboard-nav";
import { FinancialOverview } from "@/components/financial-overview";
import { QuickActions } from "@/components/quick-actions";
import { RecentTransactions } from "@/components/recent-transactions";
import { useDashboard } from "@/hooks/useDashboard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface User {
  name?: string;
  nome?: string;
  userName?: string;
  username?: string;
  fullName?: string;
  email?: string;
}

const DASHBOARD_GRADIENT = ["#000000", "#073D33", "#107A65", "#20F4CA"] as const;

export default function PageDashboard() {
  const router = useRouter();
  const { saldo, totalReceitas, totalDespesas, transacoesRecentes, loading } = useDashboard();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const isDesktopWide = width >= 1180;

  const getDisplayName = (currentUser: User | null) => {
    if (!currentUser) return "";

    const rawName =
      currentUser.name ??
      currentUser.nome ??
      currentUser.fullName ??
      currentUser.userName ??
      currentUser.username ??
      "";

    if (rawName && rawName.trim().length > 0) {
      return rawName.trim();
    }

    if (currentUser.email && currentUser.email.includes("@")) {
      return currentUser.email.split("@")[0];
    }

    return "";
  };

  const displayName = getDisplayName(user);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const [storedUser, legacyStoredUser, authToken, legacyAuthToken] = await Promise.all([
        AsyncStorage.getItem("user"),
        AsyncStorage.getItem("@user"),
        AsyncStorage.getItem("authToken"),
        AsyncStorage.getItem("@authToken"),
      ]);
      const token = authToken || legacyAuthToken;
      const userFromStorage = storedUser || legacyStoredUser;

      if (!token) {
        router.replace("/login");
        return;
      }

      if (userFromStorage) {
        setUser(JSON.parse(userFromStorage));
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Erro ao verificar autenticacao:", error);
      router.replace("/login");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || loading) {
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
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.dashboardContent}>
                <View style={styles.welcomeSection}>
                  <Text style={styles.title}>Painel</Text>
                  <Text style={styles.subtitle}>
                    {displayName ? `Bem-vindo, ${displayName}` : "Bem-vindo"}
                  </Text>
                </View>

                <FinancialOverview
                  saldo={saldo}
                  totalReceitas={totalReceitas}
                  totalDespesas={totalDespesas}
                  loading={loading}
                />

                <View style={[styles.grid, isDesktopWide && styles.bottomGridDesktop]}>
                  <View style={[styles.column, isDesktopWide && styles.transactionsWide]}>
                    <RecentTransactions transactions={transacoesRecentes} />
                  </View>
                  <View style={[styles.column, isDesktopWide && styles.quickActionsNarrow]}>
                    <QuickActions />
                  </View>
                </View>
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
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: 246,
    borderRightWidth: 1,
    borderRightColor: "#d9dde5",
    backgroundColor: "#f8f8fa",
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    width: "100%",
    maxWidth: 1330,
    alignSelf: "center",
  },
  dashboardContent: {
    flex: 1,
    gap: 18,
  },
  welcomeSection: {
    marginBottom: 2,
  },
  title: {
    fontSize: 38,
    fontWeight: "700",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ffffff",
    marginTop: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    marginTop: 2,
  },
  bottomGridDesktop: {
    flexWrap: "nowrap",
  },
  column: {
    flex: 1,
    minWidth: 340,
  },
  transactionsWide: {
    flex: 1,
    minWidth: 0,
  },
  quickActionsNarrow: {
    flex: 1.2,
    minWidth: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#666666",
  },
});
