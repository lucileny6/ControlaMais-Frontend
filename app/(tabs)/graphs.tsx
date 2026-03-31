import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardNav } from "@/components/dashboard-nav";
import { ExpenseChart, ExpenseData } from "@/components/expense-chart";
import { IncomeExpenseChart, MonthlyChartPoint } from "@/components/income-expense-chart";
import { normalizeDashboardTransaction, parseTransactionDate } from "@/lib/monthly-finance";
import { apiService } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DASHBOARD_GRADIENT = ["#F4F8FC", "#EDF3F8", "#E7EEF6", "#E1EAF4"] as const;
const CHART_COLORS = ["#FF6B35", "#00A6FB", "#7B2CBF", "#2DC653", "#FF006E", "#FFBE0B"] as const;

const normalizeCategoryKey = (value: string) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

export default function GraphsPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categoryBudgets, setCategoryBudgets] = useState<{ category: string; amount: number }[]>([]);

  useEffect(() => {
    void checkAuthentication();
  }, []);

  useEffect(() => {
    if (!isLoadingAuth) {
      void loadChartData();
    }
  }, [isLoadingAuth]);

  const normalizedTransactions = useMemo(
    () => transactions.map((transaction, index) => normalizeDashboardTransaction(transaction, index)),
    [transactions],
  );

  const semesterInfo = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const semesterStartMonth = currentMonth < 6 ? 0 : 6;
    const semesterEndMonth = semesterStartMonth + 5;

    return {
      year: currentYear,
      startMonth: semesterStartMonth,
      endMonth: semesterEndMonth,
      description: `Comparacao mensal de ${new Date(currentYear, semesterStartMonth, 1)
        .toLocaleDateString("pt-BR", { month: "long" })
        .toLowerCase()} a ${new Date(currentYear, semesterEndMonth, 1)
        .toLocaleDateString("pt-BR", { month: "long" })
        .toLowerCase()}`,
    };
  }, []);

  const monthlyChartData = useMemo<MonthlyChartPoint[]>(() => {
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(semesterInfo.year, semesterInfo.startMonth + index, 1);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        receitas: 0,
        despesas: 0,
      };
    });

    normalizedTransactions.forEach((transaction) => {
      const parsedDate = parseTransactionDate(transaction.date);
      if (!parsedDate) return;

      const key = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, "0")}`;
      const monthEntry = months.find((item) => item.key === key);
      if (!monthEntry) return;

      if (transaction.type === "income") {
        monthEntry.receitas += transaction.amount;
      } else {
        monthEntry.despesas += transaction.amount;
      }
    });

    return months.map(({ label, receitas, despesas }) => ({
      month: label.charAt(0).toUpperCase() + label.slice(1, 3),
      receitas,
      despesas,
    }));
  }, [normalizedTransactions, semesterInfo.startMonth, semesterInfo.year]);

  const expenseChartData = useMemo<ExpenseData[]>(() => {
    const now = new Date();
    const currentMonthExpenses = normalizedTransactions.filter((transaction) => {
      if (transaction.type !== "expense") return false;
      const parsedDate = parseTransactionDate(transaction.date);
      if (!parsedDate) return false;
      return parsedDate.getMonth() === now.getMonth() && parsedDate.getFullYear() === now.getFullYear();
    });

    const totalsByCategory = currentMonthExpenses.reduce((acc, transaction) => {
      const category = String(transaction.category || "Sem categoria").trim() || "Sem categoria";
      acc.set(category, (acc.get(category) ?? 0) + transaction.amount);
      return acc;
    }, new Map<string, number>());

    const budgetMap = categoryBudgets.reduce((acc, item) => {
      acc.set(normalizeCategoryKey(item.category), item.amount);
      return acc;
    }, new Map<string, number>());

    return [...totalsByCategory.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount], index) => ({
        category,
        amount,
        budget: budgetMap.get(normalizeCategoryKey(category)) ?? 0,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }));
  }, [categoryBudgets, normalizedTransactions]);

  const checkAuthentication = async () => {
    try {
      const [authToken, legacyAuthToken] = await Promise.all([
        AsyncStorage.getItem("authToken"),
        AsyncStorage.getItem("@authToken"),
      ]);

      if (!(authToken || legacyAuthToken)) {
        router.replace("/login");
      }
    } catch (error) {
      console.error("Erro ao verificar autenticacao:", error);
      router.replace("/login");
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const loadChartData = async () => {
    try {
      setIsLoadingData(true);

      const [transactionsResponse, budgetsResponse] = await Promise.all([
        Promise.race<any[]>([
          apiService.getTransactions(),
          new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 8000)),
        ]),
        Promise.race<{ category: string; amount: number }[]>([
          apiService.getCategoryBudgets(),
          new Promise<{ category: string; amount: number }[]>((resolve) => setTimeout(() => resolve([]), 6000)),
        ]),
      ]);

      setTransactions(transactionsResponse ?? []);
      setCategoryBudgets(budgetsResponse ?? []);
    } catch (error) {
      console.error("Erro ao carregar dados dos graficos:", error);
      setTransactions([]);
      setCategoryBudgets([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  if (isLoadingAuth || isLoadingData) {
    return (
      <LinearGradient colors={DASHBOARD_GRADIENT} locations={[0, 0.3, 0.57, 0.82, 1]} style={styles.gradient}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10233f" />
          <Text style={styles.loadingText}>Carregando graficos...</Text>
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
              <View style={styles.pageCard}>
                <Text style={styles.title}>Graficos Financeiros</Text>
                <Text style={styles.subtitle}>
                  Uma pagina separada para acompanhar os dois graficos principais sem misturar com o relatorio.
                </Text>

                <View style={styles.chartGrid}>
                  <IncomeExpenseChart data={monthlyChartData} description={semesterInfo.description} />
                  <ExpenseChart data={expenseChartData} />
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
    maxWidth: 1380,
    alignSelf: "center",
  },
  pageCard: {
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.92)",
    padding: 26,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 5,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#314d6f",
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 22,
    fontSize: 14,
    color: "#6a7d96",
  },
  chartGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    alignItems: "stretch",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#64748b",
  },
});
