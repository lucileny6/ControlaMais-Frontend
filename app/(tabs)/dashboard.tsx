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
  nomeCompleto?: string;
  displayName?: string;
  userName?: string;
  user_name?: string;
  username?: string;
  fullName?: string;
  firstName?: string;
  given_name?: string;
  email?: string;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;

    const decodeBase64 = (globalThis as any)?.atob;
    if (typeof decodeBase64 !== "function") return null;
    const json = decodeBase64(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getStringClaim(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function formatNameFromEmail(email?: string) {
  const localPart = String(email ?? "").trim().split("@")[0] ?? "";
  if (!localPart) return "";

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveUserName(user: User | null) {
  if (!user) return "";

  const emailPrefix = user.email?.includes("@") ? user.email.split("@")[0].trim().toLowerCase() : "";
  const candidates = [
    user.displayName,
    user.nomeCompleto,
    user.nome,
    user.fullName,
    user.firstName,
    user.given_name,
    user.name,
    user.userName,
    user.user_name,
    user.username,
  ];

  const secondaryCandidates = [
    user.fullName,
    user.name,
    user.userName,
    user.user_name,
    user.username,
  ];

  for (const candidate of candidates) {
    const value = String(candidate ?? "").trim();
    if (!value) continue;
    if (emailPrefix && value.toLowerCase() === emailPrefix) continue;
    if (/\d/.test(value)) continue;
    return value;
  }

  for (const candidate of secondaryCandidates) {
    const value = String(candidate ?? "").trim();
    if (!value) continue;
    if (emailPrefix && value.toLowerCase() === emailPrefix) continue;
    return value;
  }

  return formatNameFromEmail(user.email);
}

function getUserFromToken(token: string): User | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const email = getStringClaim(payload, ["email", "upn"]);
  const sub = getStringClaim(payload, ["sub"]);
  const name = getStringClaim(payload, [
    "name",
    "nome",
    "nomeCompleto",
    "displayName",
    "fullName",
    "firstName",
    "given_name",
    "preferred_username",
    "user_name",
    "username",
  ]);

  const resolvedEmail = email || (sub.includes("@") ? sub : "");
  const resolvedName = name;

  if (!resolvedName && !resolvedEmail) return null;
  return { name: resolvedName || undefined, email: resolvedEmail || undefined };
}

function mergeUsers(primary: User | null, fallback: User | null): User | null {
  if (!primary && !fallback) return null;
  return {
    ...fallback,
    ...primary,
  };
}

const DASHBOARD_GRADIENT = ["#F8FBFD", "#EEF4F7", "#E8F0F4", "#E2EBF1"] as const;

export default function PageDashboard() {
  const router = useRouter();
  const { saldo, totalReceitas, totalDespesas, totalInvestimentos, transacoesRecentes, loading } = useDashboard();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const isDesktopWide = width >= 1180;
  const isCompactScreen = width < 430;

  const getDisplayName = (currentUser: User | null) => {
    const resolved = resolveUserName(currentUser);
    if (resolved) return resolved;
    if (currentUser?.email?.includes("@")) return currentUser.email.split("@")[0];
    return "Usuario";
  };

  const displayName = getDisplayName(user);
  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const [
        storedUser,
        legacyStoredUser,
        storedDisplayName,
        legacyDisplayName,
        authToken,
        legacyAuthToken
      ] = await Promise.all([
        AsyncStorage.getItem("user"),
        AsyncStorage.getItem("@user"),
        AsyncStorage.getItem("displayName"),
        AsyncStorage.getItem("@displayName"),
        AsyncStorage.getItem("authToken"),
        AsyncStorage.getItem("@authToken"),
      ]);

      const token = authToken || legacyAuthToken;
      const userFromStorage = storedUser || legacyStoredUser;
      const displayNameFromStorage = (storedDisplayName || legacyDisplayName || "").trim();

      if (!token) {
        router.replace("/login");
        return;
      }

      let parsedUser: User | null = null;

      if (userFromStorage) {
        try {
          parsedUser = JSON.parse(userFromStorage) as User;
        } catch {
          parsedUser = null;
        }
      }

      if (displayNameFromStorage) {
        parsedUser = {
          ...(parsedUser ?? {}),
          displayName: displayNameFromStorage,
        };
      }

      const tokenUser = getUserFromToken(token);
      setUser(mergeUsers(parsedUser, tokenUser));
    } catch (error) {
      console.error(error);
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
              contentContainerStyle={[styles.scrollContent, isCompactScreen && styles.scrollContentCompact]}
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.dashboardContent, isCompactScreen && styles.dashboardContentCompact]}>
                <View style={styles.welcomeSection}>
                  <Text style={styles.title}>Painel</Text>
                  <Text style={styles.subtitle}>{`Bem-vindo, ${displayName}`}</Text>
                </View>

                <FinancialOverview
                  saldo={saldo}
                  totalReceitas={totalReceitas}
                  totalDespesas={totalDespesas}
                  totalInvestimentos={totalInvestimentos}
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
    borderRightColor: "rgba(148, 163, 184, 0.18)",
    backgroundColor: "rgba(255, 255, 255, 0.78)",
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
    paddingHorizontal: 28,
    paddingVertical: 24,
    width: "100%",
    maxWidth: 1360,
    alignSelf: "center",
  },
  scrollContentCompact: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  dashboardContent: {
    flex: 1,
    gap: 18,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: 30,
    padding: 24,
    shadowColor: "#0f172a",
    shadowOpacity: 0.07,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 5,
  },
  dashboardContentCompact: {
    borderRadius: 22,
    padding: 14,
  },
  welcomeSection: {
    marginBottom: 2,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.14)",
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#10233f",
    letterSpacing: -0.9,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#5f7087",
    marginTop: 7,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 4,
  },
  bottomGridDesktop: {
    flexWrap: "nowrap",
  },
  column: {
    flex: 1,
    flexBasis: "100%",
    minWidth: 0,
  },
  transactionsWide: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  quickActionsNarrow: {
    flex: 1.2,
    flexBasis: 0,
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
    color: "#64748b",
  },
});
