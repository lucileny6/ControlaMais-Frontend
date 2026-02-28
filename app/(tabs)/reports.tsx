import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNav } from '@/components/dashboard-nav';
import { ExpenseChart, ExpenseData } from '@/components/expense-chart';
import { FinancialInsights, Insight } from '@/components/financial-insights';
import { IncomeExpenseChart, MonthlyChartPoint } from '@/components/income-expense-chart';
import { MonthlySummary, MonthlySummaryData } from '@/components/monthly-summary';
import { apiService } from '@/services/api';
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

interface ReportTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

const DASHBOARD_GRADIENT = ['#000000', '#073D33', '#107A65', '#20F4CA'] as const;

export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(true);
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
      void loadReportData();
    }
  }, [isLoading]);

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

  const loadReportData = async () => {
    try {
      setReportLoading(true);
      const data = await apiService.getTransactions();
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

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const currentMonthTransactions = normalized.filter((transaction) => {
        const date = new Date(transaction.date);
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

      const expensesByCategory = Array.from(expensesByCategoryMap.entries()).map(([category, amount]) => ({
        category,
        amount,
        budget: amount,
      }));

      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const chartData: MonthlyChartPoint[] = Array.from({ length: 6 }).map((_, offset) => {
        const date = new Date(currentYear, currentMonth - (5 - offset), 1);
        const month = date.getMonth();
        const year = date.getFullYear();
        const monthTransactions = normalized.filter((transaction) => {
          const transactionDate = new Date(transaction.date);
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

      setMonthlySummaryData({
        totalIncome,
        totalExpenses,
        savings,
        savingsGoal: Math.max(totalIncome * 0.2, 1),
        monthLabel: now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        expensesByCategory,
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
                </View>

                <View style={styles.section}>
                  <MonthlySummary data={monthlySummaryData} />
                </View>

                <View
                  style={[
                    styles.chartsGrid,
                    {
                      flexDirection: isLargeScreen ? 'row' : 'column',
                      gap: isLargeScreen ? 20 : 16
                    }
                  ]}
                >
                  <View
                    style={[
                      styles.chartContainer,
                      {
                        flex: isLargeScreen ? 1 : undefined,
                        minWidth: isLargeScreen ? 0 : '100%'
                      }
                    ]}
                  >
                    <IncomeExpenseChart data={monthlyChartData} />
                  </View>
                  <View
                    style={[
                      styles.chartContainer,
                      {
                        flex: isLargeScreen ? 1 : undefined,
                        minWidth: isLargeScreen ? 0 : '100%'
                      }
                    ]}
                  >
                    <ExpenseChart data={expenseChartData} />
                  </View>
                </View>

                <View style={styles.section}>
                  <FinancialInsights insights={insightsData} />
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  section: {
    marginBottom: 24,
  },
  chartsGrid: {
    marginBottom: 24,
    alignItems: 'stretch'
  },
  chartContainer: {
    flex: 1,
    minWidth: 350
  },
});
