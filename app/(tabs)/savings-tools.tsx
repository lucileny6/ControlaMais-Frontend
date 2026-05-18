import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardNav } from "@/components/dashboard-nav";
import { SavingSuggestionItem, SavingsSuggestions } from "@/components/savings-suggestions";
import { apiService } from "@/services/api";
import runFinancialAnalysis from "@/services/financial-ai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import {
  buildMonthlyFinanceSnapshot,
  normalizeDashboardTransaction
} from "@/lib/monthly-finance";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense" | "ia";
  category: string;
  date: string;
}

type EstadoFinanceiro = Record<string, number>;

const calculateExpenseRatePercent = (totalIncome: number, totalExpenses: number) => {
  if (totalIncome > 0) {
    return (totalExpenses / totalIncome) * 100;
  }

  return totalExpenses > 0 ? 100 : 0;
};

function parseMonetaryValue(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== "string") {
    return 0;
  }

  const cleaned = value.trim().replace(/[^\d,.-]/g, "");

  if (!cleaned) {
    return 0;
  }

  if (cleaned.includes(",") && cleaned.includes(".")) {
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");

    const normalized =
      lastComma > lastDot
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned.replace(/,/g, "");

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(
    cleaned.includes(",")
      ? cleaned.replace(/\./g, "").replace(",", ".")
      : cleaned
  );

  return Number.isFinite(parsed) ? parsed : 0;
}

const DASHBOARD_GRADIENT = ["#F8FBFD", "#EEF4F7", "#E8F0F4", "#E2EBF1"] as const;

function getFinancialStatus(totalIncome: number, totalExpenses: number) {
  
  if (totalIncome <= 0) {
    return totalExpenses > 0
      ? {
          label: "Desequilibrado",
          accent: "#c44747",
          tone: "danger" as const,
          description: "Ha gastos no periodo sem receita registrada para sustentar o fechamento.",
          expenseRate: 1,
        }
      : {
          label: "Controlado",
          accent: "#0d8a67",
          tone: "positive" as const,
          description: "Nao houve movimentacao suficiente no periodo para indicar pressao no orcamento.",
          expenseRate: 0,
        };
  }

  const expenseRate = totalExpenses / totalIncome;

  if (expenseRate <= 0.6) {
    return {
      label: "Controlado",
      accent: "#0d8a67",
      tone: "positive" as const,
      description: "Os gastos ficaram dentro da faixa ideal de ate 60% da receita.",
      expenseRate,
    };
  }

  if (expenseRate <= 0.8) {
    return {
      label: "Equilibrado",
      accent: "#f59e0b",
      tone: "warning" as const,
      description: "Os gastos ainda estao administraveis, mas ja pedem mais atencao.",
      expenseRate,
    };
  }

  return {
    label: "Desequilibrado",
    accent: "#c44747",
    tone: "danger" as const,
    description: "Os gastos passaram da zona segura e merecem corte ou replanejamento.",
    expenseRate,
  };
}

export default function SavingsToolsPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const isDesktopWide = width >= 1180;

  const [isLoading, setIsLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`;
  });
  const [monthInput, setMonthInput] = useState(selectedMonth);
  const [monthLabel, setMonthLabel] = useState("");
  const [suggestions, setSuggestions] = useState<SavingSuggestionItem[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [financialStatus, setFinancialStatus] = useState(
  getFinancialStatus(0, 0)
  );
  const [expenseRatePercent, setExpenseRatePercent] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [expenseLimit, setExpenseLimit] = useState(0);
  const [totalPotentialSavings, setTotalPotentialSavings] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  

  useEffect(() => {
    void checkAuthentication();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isLoading) {
      void loadSavingsData(selectedMonth);
    }
  }, [isLoading, selectedMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  const parseTransactionDate = (value: unknown): Date | null => {
    const raw = String(value ?? "").trim();
    if (!raw) return null;

    const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/;
    const brSlash = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const brDash = /^(\d{2})-(\d{2})-(\d{4})$/;
    const isoMonth = /^(\d{4})-(\d{2})$/;
    const monthYear = /^(\d{2})-(\d{4})$/;

    let parsed: Date;
    if (isoDate.test(raw)) {
      const [, year, month, day] = raw.match(isoDate)!;
      parsed = new Date(Number(year), Number(month) - 1, Number(day));
    } else if (brSlash.test(raw) || brDash.test(raw)) {
      const match = raw.match(brSlash) ?? raw.match(brDash);
      parsed = new Date(Number(match![3]), Number(match![2]) - 1, Number(match![1]));
    } else if (isoMonth.test(raw)) {
      const [, year, month] = raw.match(isoMonth)!;
      parsed = new Date(Number(year), Number(month) - 1, 1);
    } else if (monthYear.test(raw)) {
      const [, month, year] = raw.match(monthYear)!;
      parsed = new Date(Number(year), Number(month) - 1, 1);
    } else {
      parsed = new Date(raw);
    }

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const parseMonthYear = (value: string) => {
    const normalized = String(value ?? "").trim();
    const brMatch = normalized.match(/^(\d{2})-(\d{4})$/);
    const isoMatch = normalized.match(/^(\d{4})-(\d{2})$/);
    const match = brMatch ?? isoMatch;
    if (!match) return null;

    const year = brMatch ? Number(match[2]) : Number(match[1]);
    const month = brMatch ? Number(match[1]) : Number(match[2]);
    if (month < 1 || month > 12) return null;

    return { year, month, labelDate: new Date(year, month - 1, 1) };
  };

  const formatCurrency = (amount: number) =>
    Number(amount || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

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
      setIsLoading(false);
    }
  };

  const applyMonthFilter = () => {
    const parsed = parseMonthYear(monthInput);
    if (!parsed) {
      Alert.alert("Mes invalido", "Use o formato MM-AAAA. Exemplo: 03-2026");
      return;
    }

    setSelectedMonth(`${String(parsed.month).padStart(2, "0")}-${parsed.year}`);
  };

  const loadSavingsData = async (monthReference: string) => {
    try {
      setAnalysisLoading(true);

      const data = await Promise.race<any[]>([
        apiService.getTransactions(),
        new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 8000)),
      ]);

     const normalized = (data ?? []).map((transaction: any, index: number) =>
     normalizeDashboardTransaction(transaction, index)
      );

      const selected = parseMonthYear(monthReference)?.labelDate ?? new Date();
      const monthTransactions = normalized.filter((transaction: Transaction) => {
       
        const parsedDate = parseTransactionDate(transaction.date);
        return (!!parsedDate && parsedDate.getMonth() === selected.getMonth() && parsedDate.getFullYear() === selected.getFullYear()
      );
      });
      const snapshot = buildMonthlyFinanceSnapshot(
      normalized,
      selected
      );
      const income = snapshot.totalIncome;
      const expenses = snapshot.totalExpenses;
      const currentExpenseRatePercent = calculateExpenseRatePercent(income, expenses);
      const currentFinancialStatus = getFinancialStatus(
       income,
       expenses
      );
      const expensesByCategory = snapshot.transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce<EstadoFinanceiro>((acc, transaction) => {
      acc[transaction.category] =
      (acc[transaction.category] ?? 0) + transaction.amount;

      return acc;
      }, {});

      const aiSuggestions = runFinancialAnalysis(expensesByCategory, income, expenses);
      const suggestionCards: SavingSuggestionItem[] = aiSuggestions.map((item) => {
        const currentSpend = expensesByCategory[item.categoria] ?? 0;
        const difficulty: SavingSuggestionItem["difficulty"] =
          item.percentualReducao <= 10 ? "easy" : item.percentualReducao <= 15 ? "medium" : "hard";

        return {
          title: `Reduzir gastos com ${item.categoria}`,
          description: `Voce gastou ${formatCurrency(currentSpend)} em ${item.categoria} neste periodo. Um corte de ${item.percentualReducao}% pode gerar aproximadamente ${formatCurrency(item.economia)} de folga no proximo fechamento.`,
          potentialSavings: item.economia,
          difficulty,
          category: item.categoria,
          reductionTarget: `Corte sugerido de ${item.percentualReducao}%`,
        };
      });

      setMonthLabel(selected.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }));
      setSuggestions(suggestionCards);
      setTotalIncome(income);
      setTotalExpenses(expenses);
      setExpenseRatePercent(currentExpenseRatePercent);
      setFinancialStatus(currentFinancialStatus);
      setExpenseLimit(income * 0.6);
      setTotalPotentialSavings(suggestionCards.reduce((sum, item) => sum + item.potentialSavings, 0));
      setTransactionCount(snapshot.transactions.length);
    } catch (error) {
      console.error("Erro ao carregar sugestoes de economia:", error);
      setSuggestions([]);
      setTotalIncome(0);
      setTotalExpenses(0);
      setExpenseRatePercent(0);
      setExpenseLimit(0);
      setTotalPotentialSavings(0);
      setTransactionCount(0);
      setMonthLabel("");
    } finally {
      setAnalysisLoading(false);
    }
  };

  if (isLoading) {
    return (
      <LinearGradient colors={DASHBOARD_GRADIENT} locations={[0, 0.3, 0.57, 0.82, 1]} style={styles.gradient}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10233f" />
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
                <View style={[styles.header, !isDesktopWide && styles.headerStacked]}>
                  <View style={styles.heroBlock}>
                    <Text style={styles.title}>Plano de economia</Text>
                    <Text style={styles.subtitle}>
                      Acompanhe oportunidades de reducao de gastos e identifique onde ha mais espaco para melhorar o fechamento do mes.
                    </Text>
                  </View>

                  <View style={styles.filterCard}>
                    <Text style={styles.filterLabel}>Periodo analisado</Text>
                    <Text style={styles.filterValue}>{monthLabel || "Mes atual"}</Text>
                    <View style={styles.monthFilterRow}>
                      <TextInput
                        style={styles.monthInput}
                        placeholder="MM-AAAA"
                        value={monthInput}
                        onChangeText={setMonthInput}
                      />
                      <TouchableOpacity style={styles.monthButton} onPress={applyMonthFilter}>
                        <Text style={styles.monthButtonText}>Aplicar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={[styles.statsGrid, !isLargeScreen && styles.statsGridStacked]}>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Receitas do periodo</Text>
                    <Text style={[styles.statValue, styles.positiveValue]}>{formatCurrency(totalIncome)}</Text>
                    <Text style={styles.statHint}>Base usada para calcular a faixa ideal</Text>
                  </View>

                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Despesas do periodo</Text>
                    <Text style={[styles.statValue, styles.negativeValue]}>{formatCurrency(totalExpenses)}</Text>
                    <Text style={styles.statHint}>{transactionCount} lancamentos analisados</Text>
                  </View>

                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Faixa ideal de gastos</Text>
                    <Text style={styles.statValue}>{formatCurrency(expenseLimit)}</Text>
                    <Text style={styles.statHint}>Regra atual: ate 60% da receita</Text>
                  </View>

                  <View style={[styles.statCard, styles.statusCard]}>
                    <Text style={styles.statLabel}>Status financeiro</Text>
                    <Text style={[styles.statValue, { color: financialStatus.accent }]}>
                      {financialStatus.label}
                    </Text>
                    <Text style={styles.statHint}>
                      Gasto atual: {expenseRatePercent.toFixed(1).replace(".", ",")}% da receita.
                    </Text>
                    <Text style={styles.statusDescription}>{financialStatus.description}</Text>
                  </View>

                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Economia potencial</Text>
                    <Text style={[styles.statValue, styles.positiveValue]}>{formatCurrency(totalPotentialSavings)}</Text>
                    <Text style={styles.statHint}>Soma das sugestoes priorizadas pela IA</Text>
                  </View>
                </View>

                <SavingsSuggestions
                  suggestions={suggestions}
                  monthLabel={monthLabel || "periodo atual"}
                  totalPotentialSavings={totalPotentialSavings}
                  totalExpenses={totalExpenses}
                  expenseLimit={expenseLimit}
                  loading={analysisLoading}
                />
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
  pageContent: {
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
  header: {
    flexDirection: "row",
    gap: 16,
    alignItems: "stretch",
  },
  headerStacked: {
    flexDirection: "column",
  },
  heroBlock: {
    flex: 1.2,
    paddingRight: 8,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6b7a90",
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#10233f",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: "#5f7087",
    marginTop: 10,
    maxWidth: 760,
  },
  filterCard: {
    width: 320,
    maxWidth: "100%",
    backgroundColor: "rgba(247, 250, 252, 0.9)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(197, 210, 223, 0.42)",
    padding: 18,
    gap: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#718198",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  filterValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#10233f",
    letterSpacing: -0.6,
  },
  monthFilterRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  monthInput: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.28)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: "#0f172a",
  },
  monthButton: {
    backgroundColor: "#10233f",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  monthButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#f8fafc",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  statsGridStacked: {
    flexDirection: "column",
  },
  statCard: {
    flexBasis: "23.9%",
    flexGrow: 1,
    minWidth: 240,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(197, 210, 223, 0.42)",
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  statusCard: {
    justifyContent: "space-between",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#718198",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#10233f",
    letterSpacing: -0.6,
  },
  statHint: {
    fontSize: 12,
    color: "#748398",
    marginTop: 10,
    lineHeight: 18,
  },
  statusDescription: {
    fontSize: 12,
    color: "#5f7087",
    marginTop: 8,
    lineHeight: 18,
  },
  positiveValue: {
    color: "#0d8a67",
  },
  negativeValue: {
    color: "#c44747",
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
