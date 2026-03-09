import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

export interface MonthlySummaryData {
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  savingsGoal: number;
  monthLabel: string;
  expensesByCategory: Array<{ category: string; amount: number; budget: number }>;
  aiSuggestions?: Array<{ categoria: string; percentualReducao: number; economia: number }>;
}

const fallbackSummary: MonthlySummaryData = {
  totalIncome: 3200,
  totalExpenses: 1200,
  savings: 2000,
  savingsGoal: 1000,
  monthLabel: 'Janeiro 2024',
  expensesByCategory: [
    { category: 'Alimentacao', amount: 450, budget: 500 },
    { category: 'Transporte', amount: 200, budget: 250 },
    { category: 'Contas', amount: 300, budget: 350 },
    { category: 'Lazer', amount: 150, budget: 200 },
  ],
  aiSuggestions: [
    { categoria: 'Moradia', percentualReducao: 10, economia: 120 },
    { categoria: 'Compras', percentualReducao: 15, economia: 90 },
    { categoria: 'Restaurante', percentualReducao: 10, economia: 45 },
  ],
};

export function MonthlySummary({ data }: { data?: MonthlySummaryData }) {
  const summary = data ?? fallbackSummary;
  const { width } = useWindowDimensions();
  const isTabletOrMobile = width < 1024;
  const savingsRate = summary.totalIncome > 0 ? (summary.savings / summary.totalIncome) * 100 : 0;
  const expenseRate = summary.totalIncome > 0 ? (summary.totalExpenses / summary.totalIncome) * 100 : 0;
  const plannedExpenseLimit = 0.6;
  const expenseRateDecimal =
    summary.totalIncome > 0
      ? summary.totalExpenses / summary.totalIncome
      : summary.totalExpenses > 0
        ? 1
        : 0;
  const financialStatus =
    expenseRateDecimal <= plannedExpenseLimit
      ? 'Planejado'
      : expenseRateDecimal <= 0.8
        ? 'Equilibrado'
        : 'Desequilibrado';
  const aiSuggestions = (summary.aiSuggestions ?? []).slice(0, 3);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
    });
  };

  const ProgressBar = ({ value, color = '#000000' }: { value: number; color?: string }) => {
    const progressValue = Math.min(Math.max(value, 0), 100);

    return (
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressBar,
            { width: `${progressValue}%`, backgroundColor: color }
          ]}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, isTabletOrMobile ? styles.containerResponsive : styles.containerDesktop]}>
      <View style={[styles.card, isTabletOrMobile ? styles.cardResponsive : styles.cardDesktop]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Resumo do Mes</Text>
          <Text style={styles.cardDescription}>{summary.monthLabel}</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.valuesContainer}>
            <View style={styles.valueRow}>
              <Text style={styles.valueLabel}>Receitas totais</Text>
              <Text style={[styles.valueAmount, styles.incomeText]} numberOfLines={1}>
                R$ {formatCurrency(summary.totalIncome)}
              </Text>
            </View>

            <View style={styles.valueRow}>
              <Text style={styles.valueLabel}>Despesas totais</Text>
              <Text style={[styles.valueAmount, styles.expenseText]} numberOfLines={1}>
                R$ {formatCurrency(summary.totalExpenses)}
              </Text>
            </View>

            <View style={styles.valueRow}>
              <Text style={styles.valueLabel}>Economia</Text>
              <Text style={[styles.valueAmount, styles.savingsText]} numberOfLines={1}>
                R$ {formatCurrency(summary.savings)}
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Taxa de poupanca</Text>
                <Text style={styles.progressPercentage}>{savingsRate.toFixed(1)}%</Text>
              </View>
              <ProgressBar value={savingsRate} color="#16a34a" />
            </View>

            <View style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Taxa de gastos</Text>
                <Text style={styles.progressPercentage}>{expenseRate.toFixed(1)}%</Text>
              </View>
              <ProgressBar value={expenseRate} color="#dc2626" />
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.card, styles.budgetCard, isTabletOrMobile ? styles.cardResponsive : styles.cardDesktop]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Status Financeiro</Text>
          <Text style={styles.cardDescription}>Status financeiro e recomendacoes da IA</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.budgetSummaryBox}>
            <Text style={styles.statusTitle}>Status Financeiro</Text>
            <Text
              style={[
                styles.statusValue,
                financialStatus === 'Planejado'
                  ? styles.withinPlanned
                  : financialStatus === 'Equilibrado'
                    ? styles.equilibrado
                    : styles.abovePlanned,
              ]}
            >
              {financialStatus}
            </Text>
            <Text style={styles.statusLine}>Gasto atual: {(expenseRateDecimal * 100).toFixed(1)}%</Text>
            <Text style={styles.statusLine}>Meta ideal: {(plannedExpenseLimit * 100).toFixed(0)}%</Text>
          </View>

          <View style={styles.aiSection}>
            <Text style={styles.aiTitle}>Sugestoes da IA</Text>
            {aiSuggestions.length === 0 && (
              <Text style={styles.emptyBudgetText}>Sem sugestoes para este periodo.</Text>
            )}
            {aiSuggestions.map((item, index) => {
              return (
                <View key={`${item.categoria}-${index}`} style={styles.suggestionItem}>
                  <Text style={styles.suggestionText} numberOfLines={2}>
                    - Reduzir {item.categoria} em {item.percentualReducao}%
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    padding: 8,
    alignItems: 'flex-start',
  },
  containerDesktop: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  containerResponsive: {
    flexDirection: 'column',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 3,
    padding: 20,
  },
  cardDesktop: {
    width: 600,
    minWidth: 600,
    maxWidth: 600,
    height: 360,
    minHeight: 360,
    maxHeight: 360,
  },
  cardResponsive: {
    width: '100%',
    minHeight: 180,
  },
  budgetCard: {
    minHeight: 180,
  },
  cardHeader: {
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666666',
  },
  cardContent: {
    paddingTop: 16,
    flex: 1,
  },
  valuesContainer: {
    gap: 12,
    marginBottom: 20,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  valueLabel: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  valueAmount: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
    maxWidth: '55%',
    textAlign: 'right',
  },
  incomeText: {
    color: '#16a34a',
  },
  expenseText: {
    color: '#dc2626',
  },
  savingsText: {
    color: '#000000',
  },
  progressContainer: {
    gap: 16,
  },
  progressItem: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    color: '#666666',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  budgetContainer: {
    gap: 14,
  },
  budgetSummaryBox: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  statusTitle: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '700',
  },
  statusValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 6,
  },
  statusLine: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '600',
  },
  abovePlanned: {
    color: '#dc2626',
  },
  equilibrado: {
    color: '#f59e0b',
  },
  withinPlanned: {
    color: '#16a34a',
  },
  aiSection: {
    gap: 8,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  suggestionItem: {
    paddingVertical: 2,
  },
  suggestionText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  emptyBudgetText: {
    fontSize: 13,
    color: '#64748b',
  },
});


