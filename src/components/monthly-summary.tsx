import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export interface MonthlySummaryData {
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  savingsGoal: number;
  monthLabel: string;
  expensesByCategory: Array<{ category: string; amount: number; budget: number }>;
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
};

export function MonthlySummary({ data }: { data?: MonthlySummaryData }) {
  const summary = data ?? fallbackSummary;
  const savingsRate = summary.totalIncome > 0 ? (summary.savings / summary.totalIncome) * 100 : 0;
  const expenseRate = summary.totalIncome > 0 ? (summary.totalExpenses / summary.totalIncome) * 100 : 0;

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
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Resumo do Mes</Text>
          <Text style={styles.cardDescription}>{summary.monthLabel}</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.valuesContainer}>
            <View style={styles.valueRow}>
              <Text style={styles.valueLabel}>Receitas totais</Text>
              <Text style={[styles.valueAmount, styles.incomeText]}>
                R$ {formatCurrency(summary.totalIncome)}
              </Text>
            </View>

            <View style={styles.valueRow}>
              <Text style={styles.valueLabel}>Despesas totais</Text>
              <Text style={[styles.valueAmount, styles.expenseText]}>
                R$ {formatCurrency(summary.totalExpenses)}
              </Text>
            </View>

            <View style={styles.valueRow}>
              <Text style={styles.valueLabel}>Economia</Text>
              <Text style={[styles.valueAmount, styles.savingsText]}>
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

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Orcamento por Categoria</Text>
          <Text style={styles.cardDescription}>Comparacao com o planejado</Text>
        </View>
        <ScrollView style={styles.cardContent} showsVerticalScrollIndicator={false}>
          <View style={styles.budgetContainer}>
            {summary.expensesByCategory.map((item) => {
              const percentage = item.budget > 0 ? (item.amount / item.budget) * 100 : 0;
              const isOverBudget = percentage > 100;
              const overBudgetAmount = item.amount - item.budget;

              return (
                <View key={item.category} style={styles.budgetItem}>
                  <View style={styles.budgetHeader}>
                    <Text style={styles.budgetCategory}>{item.category}</Text>
                    <Text style={[
                      styles.budgetAmount,
                      isOverBudget && styles.overBudgetText
                    ]}>
                      R$ {formatCurrency(item.amount)} / R$ {formatCurrency(item.budget)}
                    </Text>
                  </View>

                  <ProgressBar
                    value={Math.min(percentage, 100)}
                    color={isOverBudget ? '#dc2626' : '#3b82f6'}
                  />

                  {isOverBudget && (
                    <Text style={styles.overBudgetWarning}>
                      {percentage.toFixed(0)}% do orcamento (R$ {formatCurrency(overBudgetAmount)} acima)
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    padding: 8,
    flexDirection: 'row',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 3,
    minWidth: 300,
    minHeight: 180,
    padding: 24,
    flex: 1
  },
  cardHeader: {
    padding: 20,
    paddingBottom: 16,
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
    padding: 20,
  },
  valuesContainer: {
    gap: 12,
    marginBottom: 20,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: 14,
    color: '#666666',
  },
  valueAmount: {
    fontSize: 14,
    fontWeight: '600',
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
    gap: 16,
  },
  budgetItem: {
    gap: 8,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetCategory: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  budgetAmount: {
    fontSize: 14,
    color: '#666666',
  },
  overBudgetText: {
    color: '#dc2626',
    fontWeight: '500',
  },
  overBudgetWarning: {
    fontSize: 12,
    color: '#dc2626',
    fontStyle: 'italic',
  },
});
