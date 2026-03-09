import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNav } from '@/components/dashboard-nav';
import { ExpenseChart, ExpenseData } from '@/components/expense-chart';
import { FinancialInsights, Insight } from '@/components/financial-insights';
import { IncomeExpenseChart, MonthlyChartPoint } from '@/components/income-expense-chart';
import { MonthlySummary, MonthlySummaryData } from '@/components/monthly-summary';
import analisarFinancas from '@/services/financial-ai';
import { apiService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface User {
  name?: string;
  email?: string;
}

interface ReportTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

type EstadoFinanceiro = Record<string, number>;
type GroupKey = 'moradia' | 'alimentacao' | 'transporte' | 'saude' | 'lazer' | 'outros';

const DASHBOARD_GRADIENT = ['#000000', '#073D33', '#107A65', '#20F4CA'] as const;
const CATEGORY_GROUPS = {
  Moradia: 'moradia',

  Supermercado: 'alimentacao',
  Restaurante: 'alimentacao',
  Padaria: 'alimentacao',
  Açougue: 'alimentacao',
  Delivery: 'alimentacao',

  Combustível: 'transporte',
  Uber: 'transporte',
  'Transporte público': 'transporte',

  Medicamentos: 'saude',
  'Plano de saúde': 'saude',
  Academia: 'saude',

  Streaming: 'lazer',
  Cinema: 'lazer',
  Viagens: 'lazer',

  Compras: 'outros',
  Educação: 'outros',
  Pets: 'outros',
  Assinaturas: 'outros',
  Tecnologia: 'outros',
} as const;

const GROUP_ORDER: GroupKey[] = [
  'moradia',
  'alimentacao',
  'transporte',
  'saude',
  'lazer',
  'outros',
];

const GROUP_LABEL: Record<GroupKey, string> = {
  moradia: 'Moradia',
  alimentacao: 'Alimentação',
  transporte: 'Transporte',
  saude: 'Saúde',
  lazer: 'Lazer',
  outros: 'Outros',
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
  });
  const [monthInput, setMonthInput] = useState(() => {
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
  });
  const [monthlySummaryData, setMonthlySummaryData] = useState<MonthlySummaryData | undefined>(undefined);
  const [monthlyChartData, setMonthlyChartData] = useState<MonthlyChartPoint[]>([]);
  const [expenseChartData, setExpenseChartData] = useState<ExpenseData[]>([]);
  const [insightsData, setInsightsData] = useState<Insight[]>([]);

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      void loadReportData(selectedMonth);
    }
  }, [isLoading, selectedMonth]);

  const parseTransactionDate = (value: unknown): Date | null => {
    const raw = String(value ?? '').trim();
    if (!raw) return null;

    const isoDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
    const brSlashPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const brDashPattern = /^(\d{2})-(\d{2})-(\d{4})$/;
    const isoMonthPattern = /^(\d{4})-(\d{2})$/;
    const monthYearPattern = /^(\d{2})-(\d{4})$/;

    let parsed: Date;
    if (isoDatePattern.test(raw)) {
      const [, year, month, day] = raw.match(isoDatePattern)!;
      parsed = new Date(Number(year), Number(month) - 1, Number(day));
    } else if (brSlashPattern.test(raw)) {
      const [, day, month, year] = raw.match(brSlashPattern)!;
      parsed = new Date(Number(year), Number(month) - 1, Number(day));
    } else if (brDashPattern.test(raw)) {
      const [, day, month, year] = raw.match(brDashPattern)!;
      parsed = new Date(Number(year), Number(month) - 1, Number(day));
    } else if (isoMonthPattern.test(raw)) {
      const [, year, month] = raw.match(isoMonthPattern)!;
      parsed = new Date(Number(year), Number(month) - 1, 1);
    } else if (monthYearPattern.test(raw)) {
      const [, month, year] = raw.match(monthYearPattern)!;
      parsed = new Date(Number(year), Number(month) - 1, 1);
    } else {
      parsed = new Date(raw);
    }

    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  };

  const normalizeCategoryKey = (value: string) =>
    String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();

  const resolveGroupByCategory = (category: string): GroupKey => {
    const normalizedInput = normalizeCategoryKey(category);
    for (const [rawCategory, group] of Object.entries(CATEGORY_GROUPS)) {
      if (normalizeCategoryKey(rawCategory) === normalizedInput) {
        return group;
      }
    }
    return 'outros';
  };

  const parseMonthYear = (value: string) => {
    const normalized = String(value ?? '').trim();
    const brMatch = normalized.match(/^(\d{2})-(\d{4})$/);
    const isoMatch = normalized.match(/^(\d{4})-(\d{2})$/);
    const match = brMatch ?? isoMatch;
    if (!match) return null;

    const year = brMatch ? Number(match[2]) : Number(match[1]);
    const month = brMatch ? Number(match[1]) : Number(match[2]);
    if (month < 1 || month > 12) return null;

    return {
      year,
      month,
      monthIndex: month - 1,
      labelDate: new Date(year, month - 1, 1),
    };
  };

  const formatCurrency = (amount: number) =>
    Number(amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

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

  const applyMonthFilter = () => {
    const parsed = parseMonthYear(monthInput);
    if (!parsed) {
      Alert.alert('Mês inválido', 'Use o formato MM-AAAA. Exemplo: 03-2026');
      return;
    }
    setSelectedMonth(`${String(parsed.month).padStart(2, '0')}-${parsed.year}`);
  };

  const loadReportData = async (monthReference: string) => {
    try {
      setReportLoading(true);
      const data = await Promise.race<any[]>([
        apiService.getTransactions(),
        new Promise<any[]>((resolve) => {
          setTimeout(() => resolve([]), 8000);
        }),
      ]);
      const normalized: ReportTransaction[] = (data ?? []).map((t: any, index: number) => ({
        id: String(t?.id ?? t?._id ?? index),
        description: String(t?.description ?? t?.descricao ?? ''),
        amount: Number(t?.amount ?? t?.valor ?? t?.value ?? 0),
        type: (() => {
          const rawType = String(t?.type ?? t?.tipo ?? '').toLowerCase().trim();
          if (rawType === 'income' || rawType === 'icome' || rawType === 'receita') return 'income';
          return 'expense';
        })(),
        category: String(t?.category ?? t?.categoria ?? 'Sem categoria'),
        date: String(t?.date ?? t?.data ?? new Date().toISOString()),
      }));

      const baseMonthParsed = parseMonthYear(monthReference);
      const baseDate = baseMonthParsed?.labelDate ?? new Date();
      const currentMonth = baseDate.getMonth();
      const currentYear = baseDate.getFullYear();
      const currentMonthTransactions = normalized.filter((transaction) => {
        const date = parseTransactionDate(transaction.date);
        if (!date) return false;
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });

      const totalIncome = currentMonthTransactions
        .filter((transaction) => transaction.type === 'income')
        .reduce((acc, transaction) => acc + transaction.amount, 0);
      const totalExpenses = currentMonthTransactions
        .filter((transaction) => transaction.type === 'expense')
        .reduce((acc, transaction) => acc + transaction.amount, 0);

      const expensesByCategoryMap = new Map<string, number>();
      currentMonthTransactions
        .filter((transaction) => transaction.type === 'expense')
        .forEach((transaction) => {
          const current = expensesByCategoryMap.get(transaction.category) ?? 0;
          expensesByCategoryMap.set(transaction.category, current + transaction.amount);
        });

      const estadoFinanceiro = Array.from(expensesByCategoryMap.entries()).reduce<EstadoFinanceiro>((acc, [category, amount]) => {
        acc[category] = amount;
        return acc;
      }, {});
      const sugestoesIA = analisarFinancas(estadoFinanceiro, totalIncome, totalExpenses);

      const expensesByCategory = GROUP_ORDER.map((group) => {
        const amount = Array.from(expensesByCategoryMap.entries()).reduce((acc, [rawCategory, rawAmount]) => {
          if (resolveGroupByCategory(rawCategory) !== group) return acc;
          return acc + rawAmount;
        }, 0);

        return {
          category: GROUP_LABEL[group],
          amount,
          budget: MOCK_BUDGET_BY_GROUP[group],
        };
      });

      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      // Fixed window from January to June for the selected year.
      const chartData: MonthlyChartPoint[] = Array.from({ length: 6 }).map((_, month) => {
        const year = currentYear;
        const monthTransactions = normalized.filter((transaction) => {
          const transactionDate = parseTransactionDate(transaction.date);
          if (!transactionDate) return false;
          return transactionDate.getMonth() === month && transactionDate.getFullYear() === year;
        });
        return {
          month: monthNames[month],
          receitas: monthTransactions
            .filter((transaction) => transaction.type === 'income')
            .reduce((acc, transaction) => acc + transaction.amount, 0),
          despesas: monthTransactions
            .filter((transaction) => transaction.type === 'expense')
            .reduce((acc, transaction) => acc + transaction.amount, 0),
        };
      });

      const palette = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#14b8a6'];
      const chartExpenses: ExpenseData[] = expensesByCategory.map((item, index) => ({
        category: item.category,
        budget: item.budget,
        amount: item.amount,
        color: palette[index % palette.length],
      }));

      const savings = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

      const topCategory = [...chartExpenses].sort((a, b) => b.amount - a.amount)[0];

      const generatedInsights: Insight[] = [
        {
          title: savings >= 0 ? 'Resultado do mes' : 'Atencao ao saldo',
          description: savings >= 0 ? 'Voce fechou o mes com saldo positivo.' : 'Voce fechou o mes com saldo negativo.',
          type: savings >= 0 ? 'positive' : 'negative',
          value: `R$ ${Math.abs(savings).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        },
        {
          title: 'Taxa de poupanca',
          description: 'Percentual de economia em relacao a receita do mes.',
          type: savingsRate >= 20 ? 'positive' : 'warning',
          value: `${savingsRate.toFixed(1).replace('.', ',')}%`,
        },
      ];

      if (topCategory) {
        generatedInsights.push({
          title: 'Maior categoria de gasto',
          description: 'Categoria que concentrou o maior volume de despesas no mes.',
          type: 'warning',
          value: topCategory.category,
        });
      }

      if (sugestoesIA.length > 0) {
        sugestoesIA.slice(0, 3).forEach((s) => {
          const suggestedGroup = resolveGroupByCategory(s.categoria);
          const detailItems = Array.from(expensesByCategoryMap.entries())
            .filter(([rawCategory, rawAmount]) =>
              resolveGroupByCategory(rawCategory) === suggestedGroup && rawAmount > 0
            )
            .sort((a, b) => b[1] - a[1])
            .map(([rawCategory, rawAmount]) => ({
              label: rawCategory,
              value: `R$ ${formatCurrency(rawAmount)}`,
            }));

          generatedInsights.push({
            title: 'Sugestão da IA',
            description: `Reduza ${s.categoria} em ${s.percentualReducao}%`,
            type: 'warning',
            value: `Economia estimada: R$ ${s.economia.toFixed(2)}`,
            details: detailItems,
          });
        });
      } else {
        generatedInsights.push({
          title: 'Resultado da IA',
          description: 'Sem ajustes sugeridos para este periodo.',
          type: 'positive',
          value: 'Orcamento sob controle',
        });
      }

      setMonthlySummaryData({
        totalIncome,
        totalExpenses,
        savings,
        savingsGoal: Math.max(totalIncome * 0.2, 1),
        monthLabel: baseDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        expensesByCategory,
        aiSuggestions: sugestoesIA.slice(0, 3),
      });
      setMonthlyChartData(chartData);
      setExpenseChartData(chartExpenses);
      setInsightsData(generatedInsights);
    } catch (error) {
      console.error('Erro ao carregar dados de relatorios:', error);
    } finally {
      setReportLoading(false);
    }
  };

  if (isLoading || reportLoading) {
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
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              <View style={styles.pageContent}>
                <View style={styles.header}>
                  <Text style={styles.title}>Relatorios</Text>
                  <View style={styles.monthFilterRow}>
                    <TextInput
                      style={styles.monthInput}
                      placeholder="MM-AAAA"
                      value={monthInput}
                      onChangeText={setMonthInput}
                    />
                    <TouchableOpacity style={styles.monthFilterButton} onPress={applyMonthFilter}>
                      <Text style={styles.monthFilterButtonText}>Aplicar mês</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.section}>
                  <MonthlySummary data={monthlySummaryData} />
                </View>

                <View
                  style={[
                    styles.chartsGrid,
                    {
                      flexDirection: isLargeScreen ? 'row' : 'column',
                      gap: isLargeScreen ? 4 : 16
                    }
                  ]}
                >
                  <View
                    style={[
                      styles.chartContainer,
                      {
                        flex: 0,
                        width: isLargeScreen ? 600 : '100%',
                        minWidth: isLargeScreen ? 600 : '100%',
                        maxWidth: isLargeScreen ? 600 : '100%',
                      }
                    ]}
                  >
                    <IncomeExpenseChart data={monthlyChartData} />
                  </View>
                  <View
                    style={[
                      styles.chartContainer,
                      {
                        flex: 0,
                        width: isLargeScreen ? 600 : '100%',
                        minWidth: isLargeScreen ? 600 : '100%',
                        maxWidth: isLargeScreen ? 600 : '100%',
                      }
                    ]}
                  >
                    <ExpenseChart data={expenseChartData} />
                  </View>
                </View>

                <View
                  style={[
                    styles.bottomGrid,
                    {
                      flexDirection: isLargeScreen ? 'row' : 'column',
                      gap: isLargeScreen ? 20 : 16,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.chartContainer,
                      styles.insightsColumn,
                      {
                        flex: isLargeScreen ? 1 : undefined,
                        minWidth: isLargeScreen ? 0 : '100%',
                      },
                    ]}
                  >
                    <FinancialInsights insights={insightsData} />
                  </View>
                  {isLargeScreen && <View style={[styles.chartContainer, styles.futureColumnPlaceholder]} />}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  pageContent: {
    flex: 1,
    padding: 16,
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
  header: {
    marginBottom: 24,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  monthFilterRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  monthInput: {
    width: 120,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
  },
  monthFilterButton: {
    backgroundColor: '#0B6E5B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  monthFilterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ECFEFF',
  },
  section: {
    marginBottom: 24,
  },
  chartsGrid: {
    marginBottom: 24,
    alignItems: 'stretch',
    paddingHorizontal: 8,
  },
  bottomGrid: {
    marginBottom: 24,
    alignItems: 'stretch',
    paddingHorizontal: 8,
  },
  chartContainer: {
    flex: 1,
    minWidth: 280
  },
  insightsColumn: {
    alignSelf: 'flex-start',
  },
  futureColumnPlaceholder: {
    minHeight: 260,
  },
});




