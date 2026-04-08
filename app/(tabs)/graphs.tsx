import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardNav } from "@/components/dashboard-nav";
import { ExpenseChart, ExpenseData } from "@/components/expense-chart";
import { IncomeExpenseChart } from "@/components/income-expense-chart";
import { exportFinancialPdf } from "@/lib/export-financial-pdf";
import { buildCumulativeFinanceChartData } from "@/lib/financial-chart";
import { calculateMonthlyFinancialTotals, getFinancialBucket } from "@/lib/investments";
import { normalizeDashboardTransaction, parseTransactionDate } from "@/lib/monthly-finance";
import { apiService } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DASHBOARD_GRADIENT = ["#F4F8FC", "#EDF3F8", "#E7EEF6", "#E1EAF4"] as const;
const CHART_COLORS = ["#FF6B35", "#00A6FB", "#7B2CBF", "#2DC653", "#FF006E", "#FFBE0B"] as const;

const normalizeCategoryKey = (value: string) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const createStartOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

const createEndOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const formatInputDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
};

export default function GraphsPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categoryBudgets, setCategoryBudgets] = useState<{ category: string; amount: number }[]>([]);

  const initialPeriod = useMemo(() => {
    const now = new Date();
    return {
      start: createStartOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
      end: createEndOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    };
  }, []);
  const [startDateInput, setStartDateInput] = useState(formatInputDate(initialPeriod.start));
  const [endDateInput, setEndDateInput] = useState(formatInputDate(initialPeriod.end));
  const [appliedStartDate, setAppliedStartDate] = useState(formatInputDate(initialPeriod.start));
  const [appliedEndDate, setAppliedEndDate] = useState(formatInputDate(initialPeriod.end));
  const [exportStatus, setExportStatus] = useState("Escolha o periodo e gere o PDF quando quiser.");

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

  const appliedPeriod = useMemo(() => {
    const parsedStart = parseTransactionDate(appliedStartDate);
    const parsedEnd = parseTransactionDate(appliedEndDate);
    const start = parsedStart ? createStartOfDay(parsedStart) : initialPeriod.start;
    const end = parsedEnd ? createEndOfDay(parsedEnd) : initialPeriod.end;

    return {
      start: start.getTime() <= end.getTime() ? start : end,
      end: start.getTime() <= end.getTime() ? end : start,
    };
  }, [appliedEndDate, appliedStartDate, initialPeriod.end, initialPeriod.start]);

  const periodLabel = useMemo(() => {
    const start = appliedPeriod.start.toLocaleDateString("pt-BR");
    const end = appliedPeriod.end.toLocaleDateString("pt-BR");
    return `${start} ate ${end}`;
  }, [appliedPeriod.end, appliedPeriod.start]);

  const filteredTransactions = useMemo(
    () =>
      normalizedTransactions.filter((transaction) => {
        const parsedDate = parseTransactionDate(transaction.date);
        if (!parsedDate) return false;
        const timestamp = parsedDate.getTime();
        return (
          timestamp >= appliedPeriod.start.getTime() &&
          timestamp <= appliedPeriod.end.getTime()
        );
      }),
    [appliedPeriod.end, appliedPeriod.start, normalizedTransactions],
  );

  const financialTotals = useMemo(
    () => calculateMonthlyFinancialTotals(filteredTransactions),
    [filteredTransactions],
  );

  const handleApplyPeriod = () => {
    setAppliedStartDate(startDateInput.trim() || formatInputDate(initialPeriod.start));
    setAppliedEndDate(endDateInput.trim() || formatInputDate(initialPeriod.end));
    setExportStatus("Periodo atualizado. Agora voce ja pode gerar o PDF.");
  };

  const handleExportPdf = () => {
    const result = exportFinancialPdf({
      transactions: filteredTransactions,
      periodLabel,
      totalIncome: financialTotals.totalIncome,
      totalExpense: financialTotals.totalExpense,
      totalInvestment: financialTotals.totalInvestment,
      balance: financialTotals.balance,
      title: "GRAFICOS FINANCEIROS",
      typeLabel: "Todos",
      categoryLabel: "Todas",
      filePrefix: "graficos-financeiros",
    });

    setExportStatus(result.status);

    if (!result.ok && result.alertMessage) {
      Alert.alert("Gerar PDF", result.alertMessage);
    }
  };

  const cumulativeChartData = useMemo(
    () =>
      buildCumulativeFinanceChartData(filteredTransactions, {
        startDate: appliedPeriod.start,
        endDate: appliedPeriod.end,
      }),
    [appliedPeriod.end, appliedPeriod.start, filteredTransactions],
  );

  const expenseChartData = useMemo<ExpenseData[]>(() => {
    const periodExpenses = filteredTransactions.filter((transaction) => {
      if (getFinancialBucket(transaction) !== "expense") return false;
      return true;
    });

    const totalsByCategory = periodExpenses.reduce((acc, transaction) => {
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
  }, [categoryBudgets, filteredTransactions]);

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
                  <IncomeExpenseChart
                    data={cumulativeChartData}
                    description={`Receita, despesa, investimento e saldo acumulados durante ${periodLabel}.`}
                    footer={(
                      <View style={styles.periodSection}>
                        <View style={styles.periodHeader}>
                          <Text style={styles.periodTitle}>Filtrar periodo</Text>
                          <Text style={styles.periodAppliedLabel}>{periodLabel}</Text>
                        </View>

                        <View style={[styles.periodForm, isLargeScreen && styles.periodFormDesktop]}>
                          <View style={styles.periodField}>
                            <Text style={styles.periodFieldLabel}>Data inicial</Text>
                            <TextInput
                              value={startDateInput}
                              onChangeText={setStartDateInput}
                              placeholder="01-04-2026"
                              style={styles.periodInput}
                            />
                          </View>

                          <View style={styles.periodField}>
                            <Text style={styles.periodFieldLabel}>Data final</Text>
                            <TextInput
                              value={endDateInput}
                              onChangeText={setEndDateInput}
                              placeholder="30-04-2026"
                              style={styles.periodInput}
                            />
                          </View>

                          <TouchableOpacity style={styles.periodButton} onPress={handleApplyPeriod}>
                            <Text style={styles.periodButtonText}>Aplicar</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.periodButton, styles.exportButton]}
                            onPress={handleExportPdf}
                          >
                            <Text style={[styles.periodButtonText, styles.exportButtonText]}>Gerar PDF</Text>
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.exportStatusText}>{exportStatus}</Text>
                      </View>
                    )}
                  />
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
  periodSection: {
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(205, 216, 227, 0.8)",
    backgroundColor: "rgba(248, 251, 255, 0.96)",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  periodHeader: {
    gap: 4,
  },
  periodTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#314d6f",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  periodAppliedLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  periodForm: {
    gap: 12,
  },
  periodFormDesktop: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  periodField: {
    flex: 1,
    gap: 6,
  },
  periodFieldLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "700",
  },
  periodInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.28)",
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#0f172a",
  },
  periodButton: {
    minWidth: 110,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10233f",
    paddingHorizontal: 18,
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ffffff",
  },
  exportButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.28)",
  },
  exportButtonText: {
    color: "#10233f",
  },
  exportStatusText: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 18,
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
