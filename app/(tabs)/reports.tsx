import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardNav } from "@/components/dashboard-nav";
import { Insight } from "@/components/financial-insights";
import { ResumoFinanceiroMensal } from "@/components/monthly-summary";
import runFinancialAnalysis from "@/services/financial-ai";
import { apiService } from "@/services/api";
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

interface ReportTransaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
}

type EstadoFinanceiro = Record<string, number>;
type GroupKey = "moradia" | "alimentacao" | "transporte" | "saude" | "lazer" | "outros";

const DASHBOARD_GRADIENT = ["#F8FBFD", "#EEF4F7", "#E8F0F4", "#E2EBF1"] as const;
const CATEGORY_GROUPS = {
  Moradia: "moradia",
  Supermercado: "alimentacao",
  Restaurante: "alimentacao",
  Padaria: "alimentacao",
  Acougue: "alimentacao",
  Delivery: "alimentacao",
  Combustivel: "transporte",
  Uber: "transporte",
  "Transporte publico": "transporte",
  Medicamentos: "saude",
  "Plano de saude": "saude",
  Academia: "saude",
  Streaming: "lazer",
  Cinema: "lazer",
  Viagens: "lazer",
  Compras: "outros",
  Educacao: "outros",
  Pets: "outros",
  Assinaturas: "outros",
  Tecnologia: "outros",
} as const;

const GROUP_ORDER: GroupKey[] = ["moradia", "alimentacao", "transporte", "saude", "lazer", "outros"];
const GROUP_LABEL: Record<GroupKey, string> = {
  moradia: "Moradia",
  alimentacao: "Alimentacao",
  transporte: "Transporte",
  saude: "Saude",
  lazer: "Lazer",
  outros: "Outros",
};

const MOCK_BUDGET_BY_GROUP: Record<GroupKey, number> = {
  moradia: 1500,
  alimentacao: 600,
  transporte: 400,
  saude: 350,
  lazer: 300,
  outros: 250,
};

export default function ReportsPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const isDesktopWide = width >= 1180;

  const [isLoading, setIsLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`;
  });
  const [monthInput, setMonthInput] = useState(selectedMonth);
  const [summary, setSummary] = useState<ResumoFinanceiroMensal | undefined>(undefined);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [topExpenses, setTopExpenses] = useState<ReportTransaction[]>([]);
  const [transactionCount, setTransactionCount] = useState(0);
  const [incomeCount, setIncomeCount] = useState(0);
  const [expenseCount, setExpenseCount] = useState(0);

  // We only need the auth check once on page mount.
  useEffect(() => {
    void checkAuthentication();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload the report whenever the selected month changes after auth is resolved.
  useEffect(() => {
    if (!isLoading) {
      void loadReportData(selectedMonth);
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

  const normalizeCategoryKey = (value: string) =>
    String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

  const resolveGroupByCategory = (category: string): GroupKey => {
    const normalizedInput = normalizeCategoryKey(category);
    for (const [rawCategory, group] of Object.entries(CATEGORY_GROUPS)) {
      if (normalizeCategoryKey(rawCategory) === normalizedInput) return group;
    }
    return "outros";
  };

  const formatCurrency = (amount: number) =>
    Number(amount || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatDate = (value: string) => {
    const parsed = parseTransactionDate(value);
    return parsed ? parsed.toLocaleDateString("pt-BR") : value;
  };

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

  const loadReportData = async (monthReference: string) => {
    try {
      setReportLoading(true);
      const data = await Promise.race<any[]>([
        apiService.getTransactions(),
        new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 8000)),
      ]);

      const normalized: ReportTransaction[] = (data ?? []).map((transaction: any, index: number) => ({
        id: String(transaction?.id ?? transaction?._id ?? index),
        description: String(transaction?.description ?? transaction?.descricao ?? "Sem descricao"),
        amount: Number(transaction?.amount ?? transaction?.valor ?? transaction?.value ?? 0),
        type: (() => {
          const rawType = String(transaction?.type ?? transaction?.tipo ?? "").toLowerCase().trim();
          return rawType === "income" || rawType === "icome" || rawType === "receita" || rawType === "entrada"
            ? "income"
            : "expense";
        })(),
        category: String(transaction?.category ?? transaction?.categoria ?? "Sem categoria"),
        date: String(transaction?.date ?? transaction?.data ?? new Date().toISOString()),
      }));

      const selected = parseMonthYear(monthReference)?.labelDate ?? new Date();
      const currentMonthTransactions = normalized.filter((transaction) => {
        const parsedDate = parseTransactionDate(transaction.date);
        return !!parsedDate && parsedDate.getMonth() === selected.getMonth() && parsedDate.getFullYear() === selected.getFullYear();
      });

      const totalIncome = currentMonthTransactions
        .filter((transaction) => transaction.type === "income")
        .reduce((acc, transaction) => acc + transaction.amount, 0);
      const totalExpenses = currentMonthTransactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((acc, transaction) => acc + transaction.amount, 0);

      const expensesByCategoryMap = new Map<string, number>();
      currentMonthTransactions
        .filter((transaction) => transaction.type === "expense")
        .forEach((transaction) => {
          expensesByCategoryMap.set(transaction.category, (expensesByCategoryMap.get(transaction.category) ?? 0) + transaction.amount);
        });

      const estadoFinanceiro = Array.from(expensesByCategoryMap.entries()).reduce<EstadoFinanceiro>((acc, [category, amount]) => {
        acc[category] = amount;
        return acc;
      }, {});

      const sugestoesIA = runFinancialAnalysis(estadoFinanceiro, totalIncome, totalExpenses);
      const gastosPorCategoria = GROUP_ORDER.map((group) => ({
        categoria: GROUP_LABEL[group],
        valorGasto: Array.from(expensesByCategoryMap.entries()).reduce((acc, [rawCategory, rawAmount]) => {
          return resolveGroupByCategory(rawCategory) === group ? acc + rawAmount : acc;
        }, 0),
        orcamento: MOCK_BUDGET_BY_GROUP[group],
      }));

      const economia = totalIncome - totalExpenses;
      const taxaPoupanca = totalIncome > 0 ? (economia / totalIncome) * 100 : 0;
      const topCategory = [...gastosPorCategoria].sort((a, b) => b.valorGasto - a.valorGasto)[0];

      setSummary({
        rendaTotal: totalIncome,
        gastosTotais: totalExpenses,
        economia,
        metaEconomia: Math.max(totalIncome * 0.2, 1),
        mes: selected.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
        gastosPorCategoria,
        sugestoesIA: sugestoesIA.slice(0, 3),
      });

      setInsights([
        {
          title: economia >= 0 ? "Resultado do mes" : "Saldo em alerta",
          description:
            economia >= 0
              ? "O periodo fechou positivo e o relatorio agora esta mais focado em leitura rapida."
              : "As despesas superaram a receita no periodo e merecem ajuste imediato.",
          type: economia >= 0 ? "positive" : "negative",
          value: formatCurrency(Math.abs(economia)),
        },
        {
          title: "Taxa de poupanca",
          description: "Mostra quanto da receita realmente virou sobra no fechamento.",
          type: taxaPoupanca >= 20 ? "positive" : taxaPoupanca >= 0 ? "warning" : "negative",
          value: `${taxaPoupanca.toFixed(1).replace(".", ",")}%`,
        },
        {
          title: "Categoria dominante",
          description: "A principal concentracao de despesas do mes.",
          type: "warning",
          value: topCategory?.valorGasto ? topCategory.categoria : "Sem destaque",
        },
        ...(sugestoesIA.slice(0, 1).map((item) => ({
          title: "Sugestao da IA",
          description: `Reduzir ${item.categoria} em ${item.percentualReducao}% pode aliviar o proximo fechamento.`,
          type: "warning" as const,
          value: formatCurrency(item.economia),
        }))),
      ]);

      setTopExpenses(
        [...currentMonthTransactions]
          .filter((transaction) => transaction.type === "expense")
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5),
      );
      setTransactionCount(currentMonthTransactions.length);
      setIncomeCount(currentMonthTransactions.filter((transaction) => transaction.type === "income").length);
      setExpenseCount(currentMonthTransactions.filter((transaction) => transaction.type === "expense").length);
    } catch (error) {
      console.error("Erro ao carregar dados de relatorios:", error);
    } finally {
      setReportLoading(false);
    }
  };

  const categoryItems = [...(summary?.gastosPorCategoria ?? [])]
    .filter((item) => item.valorGasto > 0)
    .sort((a, b) => b.valorGasto - a.valorGasto);
  const savingsRate = summary?.rendaTotal ? (summary.economia / summary.rendaTotal) * 100 : 0;
  const expenseRate = summary?.rendaTotal ? (summary.gastosTotais / summary.rendaTotal) * 100 : 0;
  const topCategory = categoryItems[0];
  const statusTone = !summary || summary.gastosTotais === 0 ? "neutral" : summary.economia < 0 ? "negative" : expenseRate > 80 ? "warning" : "positive";
  const statusLabel =
    statusTone === "negative" ? "Ajuste necessario" : statusTone === "warning" ? "Pedir atencao" : statusTone === "positive" ? "Saudavel" : "Sem movimento";

  if (isLoading || reportLoading) {
    return (
      <LinearGradient colors={DASHBOARD_GRADIENT} locations={[0, 0.3, 0.57, 0.82, 1]} style={styles.gradient}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10233f" />
          <Text style={styles.loadingText}>Carregando relatorio...</Text>
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
                    <Text style={styles.eyebrow}>RELATORIO DO MES</Text>
                    <Text style={styles.title}>Menos grafico, mais clareza para agir</Text>
                    <Text style={styles.subtitle}>
                      A tela agora prioriza leitura rapida: o que entrou, o que saiu, onde o mes pesou e quais acoes fazem mais sentido agora.
                    </Text>
                  </View>

                  <View style={styles.filterCard}>
                    <Text style={styles.filterLabel}>Periodo analisado</Text>
                    <Text style={styles.filterValue}>{summary?.mes ?? "Mes atual"}</Text>
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

                <View style={[styles.statsGrid, !isLargeScreen && styles.stackColumn]}>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Receitas</Text>
                    <Text style={[styles.statValue, styles.positiveValue]}>{formatCurrency(summary?.rendaTotal ?? 0)}</Text>
                    <Text style={styles.statHint}>{incomeCount} entradas registradas</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Despesas</Text>
                    <Text style={[styles.statValue, styles.negativeValue]}>{formatCurrency(summary?.gastosTotais ?? 0)}</Text>
                    <Text style={styles.statHint}>{expenseCount} saidas registradas</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Saldo do periodo</Text>
                    <Text style={[styles.statValue, (summary?.economia ?? 0) >= 0 ? styles.balanceValue : styles.negativeValue]}>
                      {formatCurrency(summary?.economia ?? 0)}
                    </Text>
                    <Text style={styles.statHint}>{transactionCount} lancamentos no total</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Taxa de poupanca</Text>
                    <Text style={styles.statValue}>{`${savingsRate.toFixed(1).replace(".", ",")}%`}</Text>
                    <Text style={styles.statHint}>{`${expenseRate.toFixed(1).replace(".", ",")}% da receita foi consumida`}</Text>
                  </View>
                </View>

                <View style={[styles.grid, !isDesktopWide && styles.stackColumn]}>
                  <View style={styles.mainColumn}>
                    <View style={styles.panel}>
                      <View style={styles.panelHeader}>
                        <View style={styles.grow}>
                          <Text style={styles.panelTitle}>Leitura do periodo</Text>
                          <Text style={styles.panelDescription}>Resumo curto para substituir a dependencia de graficos.</Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            statusTone === "positive" && styles.statusPositive,
                            statusTone === "warning" && styles.statusWarning,
                            statusTone === "negative" && styles.statusNegative,
                          ]}
                        >
                          <Text style={styles.statusBadgeText}>{statusLabel}</Text>
                        </View>
                      </View>

                      <Text style={styles.lead}>
                        {transactionCount === 0
                          ? "Nao houve movimentacoes no periodo selecionado. A tela segue limpa e pronta para acompanhar o proximo mes."
                          : `Voce registrou ${transactionCount} lancamentos em ${summary?.mes ?? "este periodo"}. ${
                              (summary?.economia ?? 0) >= 0
                                ? "O fechamento ficou positivo, entao o relatorio pode focar em manutencao e consistencia."
                                : "O fechamento ficou negativo, entao o foco precisa ir para corte de gastos e revisao das principais despesas."
                            }`}
                      </Text>

                      <View style={[styles.miniGrid, !isLargeScreen && styles.stackColumn]}>
                        <View style={styles.miniCard}>
                          <Text style={styles.miniLabel}>Categoria que mais pesa</Text>
                          <Text style={styles.miniValue}>{topCategory?.categoria ?? "Sem destaque"}</Text>
                          <Text style={styles.miniHint}>{formatCurrency(topCategory?.valorGasto ?? 0)}</Text>
                        </View>
                        <View style={styles.miniCard}>
                          <Text style={styles.miniLabel}>Meta sugerida</Text>
                          <Text style={styles.miniValue}>{formatCurrency(summary?.metaEconomia ?? 0)}</Text>
                          <Text style={styles.miniHint}>Reserva ideal para o mes</Text>
                        </View>
                        <View style={styles.miniCard}>
                          <Text style={styles.miniLabel}>Leitura geral</Text>
                          <Text style={styles.miniValue}>{statusLabel}</Text>
                          <Text style={styles.miniHint}>Resumo visual sem excesso de elementos</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.panel}>
                      <View style={styles.panelHeader}>
                        <View style={styles.grow}>
                          <Text style={styles.panelTitle}>Categorias do mes</Text>
                          <Text style={styles.panelDescription}>Mostra onde o dinheiro saiu e o peso de cada grupo.</Text>
                        </View>
                        <Text style={styles.panelTag}>{categoryItems.length} categorias</Text>
                      </View>

                      {categoryItems.length === 0 ? (
                        <View style={styles.emptyBox}>
                          <Text style={styles.emptyTitle}>Nenhuma despesa registrada neste mes.</Text>
                          <Text style={styles.emptyText}>Quando as saidas aparecerem, esta area mostra rapidamente onde concentrar a atencao.</Text>
                        </View>
                      ) : (
                        <View style={styles.list}>
                          {categoryItems.slice(0, 6).map((item) => {
                            const share = (summary?.gastosTotais ?? 0) > 0 ? (item.valorGasto / (summary?.gastosTotais ?? 1)) * 100 : 0;
                            const budgetUsage = item.orcamento > 0 ? (item.valorGasto / item.orcamento) * 100 : 0;
                            return (
                              <View key={item.categoria} style={styles.categoryRow}>
                                <View style={styles.rowTop}>
                                  <View style={styles.grow}>
                                    <Text style={styles.rowTitle}>{item.categoria}</Text>
                                    <Text style={styles.rowMeta}>{share.toFixed(1).replace(".", ",")}% das despesas</Text>
                                  </View>
                                  <View style={styles.alignEnd}>
                                    <Text style={styles.rowValue}>{formatCurrency(item.valorGasto)}</Text>
                                    <Text style={styles.rowMeta}>{`Meta ${formatCurrency(item.orcamento)}`}</Text>
                                  </View>
                                </View>
                                <View style={styles.progressTrack}>
                                  <View
                                    style={[
                                      styles.progressFill,
                                      budgetUsage >= 100
                                        ? styles.progressDanger
                                        : budgetUsage >= 75
                                          ? styles.progressWarning
                                          : styles.progressPositive,
                                      { width: `${Math.min(budgetUsage, 100)}%` },
                                    ]}
                                  />
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    <View style={styles.panel}>
                      <View style={styles.panelHeader}>
                        <View style={styles.grow}>
                          <Text style={styles.panelTitle}>Lancamentos que puxaram o mes</Text>
                          <Text style={styles.panelDescription}>Maiores despesas para revisar sem depender de graficos.</Text>
                        </View>
                        <Text style={styles.panelTag}>{topExpenses.length} itens</Text>
                      </View>

                      {topExpenses.length === 0 ? (
                        <View style={styles.emptyBox}>
                          <Text style={styles.emptyTitle}>Sem despesas relevantes no periodo.</Text>
                          <Text style={styles.emptyText}>Isso pode indicar um mes sem movimentacao ou apenas receitas registradas.</Text>
                        </View>
                      ) : (
                        <View style={styles.list}>
                          {topExpenses.map((transaction) => (
                            <View key={transaction.id} style={styles.transactionRow}>
                              <View style={styles.grow}>
                                <Text style={styles.rowTitle}>{transaction.description}</Text>
                                <Text style={styles.rowMeta}>{transaction.category} • {formatDate(transaction.date)}</Text>
                              </View>
                              <Text style={[styles.rowValue, styles.negativeValue]}>{formatCurrency(transaction.amount)}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.sideColumn}>
                    <View style={styles.panel}>
                      <View style={styles.panelHeader}>
                        <View style={styles.grow}>
                          <Text style={styles.panelTitle}>Pontos de atencao</Text>
                          <Text style={styles.panelDescription}>Leitura curta para orientar a proxima acao do usuario.</Text>
                        </View>
                      </View>

                      <View style={styles.list}>
                        {insights.slice(0, 4).map((insight, index) => (
                          <View key={`${insight.title}-${index}`} style={styles.insightRow}>
                            <View
                              style={[
                                styles.dot,
                                insight.type === "positive" && styles.dotPositive,
                                insight.type === "warning" && styles.dotWarning,
                                insight.type === "negative" && styles.dotNegative,
                              ]}
                            />
                            <View style={styles.grow}>
                              <View style={styles.rowTop}>
                                <Text style={styles.rowTitle}>{insight.title}</Text>
                                {insight.value ? <Text style={styles.rowValue}>{insight.value}</Text> : null}
                              </View>
                              <Text style={styles.rowMeta}>{insight.description}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>

                    <View style={styles.panel}>
                      <View style={styles.panelHeader}>
                        <View style={styles.grow}>
                          <Text style={styles.panelTitle}>Proximas acoes</Text>
                          <Text style={styles.panelDescription}>A tela de relatorio fica mais coerente quando ela empurra o usuario para o proximo passo.</Text>
                        </View>
                      </View>

                      <View style={styles.list}>
                        <TouchableOpacity style={styles.primaryAction} onPress={() => router.push("/(tabs)/transactions")}>
                          <Text style={styles.primaryActionTitle}>Ver transacoes do periodo</Text>
                          <Text style={styles.primaryActionText}>Abrir a listagem completa para revisar os lancamentos com contexto.</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.secondaryAction}
                          onPress={() => router.push("/(tabs)/transactions?new=1&type=expense")}
                        >
                          <Text style={styles.secondaryActionTitle}>Registrar nova despesa</Text>
                          <Text style={styles.secondaryActionText}>Conecta a analise com a acao, sem sair do fluxo do sistema.</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryAction} onPress={() => router.push("/(tabs)/chat")}>
                          <Text style={styles.secondaryActionTitle}>Conversar com a IA</Text>
                          <Text style={styles.secondaryActionText}>Use os insights para pedir sugestoes de economia ou reorganizacao.</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
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
  gradient: { flex: 1 },
  layoutContainer: { flex: 1, backgroundColor: "transparent" },
  content: { flex: 1, flexDirection: "row" },
  sidebar: {
    width: 246,
    borderRightWidth: 1,
    borderRightColor: "rgba(148, 163, 184, 0.18)",
    backgroundColor: "rgba(255, 255, 255, 0.78)",
  },
  sidebarContent: { paddingVertical: 24 },
  main: { flex: 1 },
  scrollView: { flex: 1 },
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
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  loadingText: { fontSize: 16, color: "#64748b" },
  header: { flexDirection: "row", gap: 16, alignItems: "stretch" },
  headerStacked: { flexDirection: "column" },
  heroBlock: { flex: 1.2, paddingRight: 8 },
  eyebrow: { fontSize: 11, fontWeight: "800", color: "#6b7a90", letterSpacing: 1.2, marginBottom: 12 },
  title: { fontSize: 36, fontWeight: "800", color: "#10233f", letterSpacing: -1 },
  subtitle: { fontSize: 14, lineHeight: 22, color: "#5f7087", marginTop: 10, maxWidth: 760 },
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
  filterLabel: { fontSize: 12, fontWeight: "700", color: "#718198", textTransform: "uppercase", letterSpacing: 0.8 },
  filterValue: { fontSize: 24, fontWeight: "800", color: "#10233f", letterSpacing: -0.6 },
  monthFilterRow: { flexDirection: "row", gap: 8, alignItems: "center" },
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
  monthButton: { backgroundColor: "#10233f", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 11 },
  monthButtonText: { fontSize: 13, fontWeight: "700", color: "#f8fafc" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  stackColumn: { flexDirection: "column" },
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
  statLabel: { fontSize: 12, fontWeight: "700", color: "#718198", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 },
  statValue: { fontSize: 26, fontWeight: "800", color: "#10233f", letterSpacing: -0.6 },
  statHint: { fontSize: 12, color: "#748398", marginTop: 10, lineHeight: 18 },
  positiveValue: { color: "#0d8a67" },
  negativeValue: { color: "#c44747" },
  balanceValue: { color: "#10233f" },
  grid: { flexDirection: "row", gap: 16, alignItems: "flex-start" },
  mainColumn: { flex: 1.45, gap: 16 },
  sideColumn: { flex: 1, gap: 16, minWidth: 320 },
  panel: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(197, 210, 223, 0.42)",
    padding: 20,
  },
  panelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 },
  panelTitle: { fontSize: 20, fontWeight: "800", color: "#10233f", letterSpacing: -0.4 },
  panelDescription: { fontSize: 13, color: "#718198", marginTop: 6, lineHeight: 19 },
  panelTag: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  grow: { flex: 1 },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    backgroundColor: "#f8fafc",
    borderColor: "rgba(148, 163, 184, 0.18)",
  },
  statusPositive: { backgroundColor: "rgba(13, 138, 103, 0.12)", borderColor: "rgba(13, 138, 103, 0.16)" },
  statusWarning: { backgroundColor: "rgba(245, 158, 11, 0.12)", borderColor: "rgba(245, 158, 11, 0.16)" },
  statusNegative: { backgroundColor: "rgba(196, 71, 71, 0.12)", borderColor: "rgba(196, 71, 71, 0.16)" },
  statusBadgeText: { fontSize: 12, fontWeight: "700", color: "#10233f" },
  lead: { fontSize: 15, lineHeight: 25, color: "#334155" },
  miniGrid: { flexDirection: "row", gap: 12, marginTop: 18 },
  miniCard: {
    flex: 1,
    backgroundColor: "#f6fafc",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(197, 210, 223, 0.42)",
    padding: 16,
    minHeight: 116,
  },
  miniLabel: { fontSize: 11, fontWeight: "700", color: "#718198", textTransform: "uppercase", letterSpacing: 0.8 },
  miniValue: { fontSize: 18, fontWeight: "800", color: "#10233f", marginTop: 12 },
  miniHint: { fontSize: 13, color: "#5f7087", marginTop: 8, lineHeight: 19 },
  emptyBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(197, 210, 223, 0.42)",
    padding: 18,
    gap: 6,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#334155" },
  emptyText: { fontSize: 13, color: "#718198", lineHeight: 20 },
  list: { gap: 12 },
  categoryRow: { gap: 10 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  alignEnd: { alignItems: "flex-end" },
  rowTitle: { fontSize: 14, fontWeight: "700", color: "#11243f" },
  rowMeta: { fontSize: 12, color: "#718198", marginTop: 5, lineHeight: 18 },
  rowValue: { fontSize: 14, fontWeight: "800", color: "#10233f" },
  progressTrack: { height: 8, backgroundColor: "#e2e8f0", borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },
  progressPositive: { backgroundColor: "#0d8a67" },
  progressWarning: { backgroundColor: "#f59e0b" },
  progressDanger: { backgroundColor: "#c44747" },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(203, 213, 225, 0.38)",
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "rgba(197, 210, 223, 0.42)",
  },
  dot: { width: 12, height: 12, borderRadius: 999, marginTop: 5 },
  dotPositive: { backgroundColor: "#0d8a67" },
  dotWarning: { backgroundColor: "#f59e0b" },
  dotNegative: { backgroundColor: "#c44747" },
  primaryAction: { backgroundColor: "#10233f", borderRadius: 22, padding: 18 },
  primaryActionTitle: { fontSize: 15, fontWeight: "800", color: "#f8fafc" },
  primaryActionText: { fontSize: 13, color: "rgba(248, 250, 252, 0.82)", lineHeight: 20, marginTop: 8 },
  secondaryAction: {
    backgroundColor: "#f6fafc",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(197, 210, 223, 0.42)",
    padding: 18,
  },
  secondaryActionTitle: { fontSize: 15, fontWeight: "700", color: "#11243f" },
  secondaryActionText: { fontSize: 13, color: "#5f7087", lineHeight: 20, marginTop: 8 },
});
