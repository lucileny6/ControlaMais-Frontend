import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import React from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

export interface ExpenseData {
  category: string;
  budget: number;
  amount: number;
  color: string;
}

export function ExpenseChart({ data }: { data?: ExpenseData[] }) {
  const expenseData = data ?? [];
  const hasData = expenseData.length > 0;
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const chartSize = isLargeScreen ? 170 : 150;
  const radius = chartSize * 0.4;
  const center = chartSize / 2;

  const total = expenseData.reduce((sum, item) => sum + item.amount, 0);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
    });
  };

  return (
    <Card style={styles.card} maxWidth={isLargeScreen ? 600 : 0}>
      <CardHeader>
        <CardTitle>Despesas e Orcamento por Categoria</CardTitle>
        <CardDescription>Comparativo entre planejamento e gastos do mes</CardDescription>
      </CardHeader>

      <CardContent style={styles.cardContent}>
        {hasData ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.chartContainer}>
              <Svg width={chartSize} height={chartSize} style={styles.svg}>
                <G rotation={-90} origin={`${center}, ${center}`}>
                  {(() => {
                    let currentAngle = 0;
                    const circumference = 2 * Math.PI * radius;

                    return expenseData.map((item, index) => {
                      const percentage = total > 0 ? (item.amount / total) : 0;
                      const strokeDasharray = `${percentage * circumference} ${circumference}`;

                      const segment = (
                        <Circle
                          key={index}
                          cx={center}
                          cy={center}
                          r={radius}
                          stroke={item.color}
                          strokeWidth={isLargeScreen ? 24 : 20}
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={-currentAngle * circumference / 360}
                          fill="transparent"
                        />
                      );

                      currentAngle += percentage * 360;
                      return segment;
                    });
                  })()}
                </G>
              </Svg>

              <View style={[styles.centerLabel, { top: center - 20 }]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>R$ {formatCurrency(total)}</Text>
              </View>
            </View>

            <View style={styles.legend}>
              {expenseData.map((item, index) => {
                const percentage = total > 0 ? ((item.amount / total) * 100).toFixed(1) : '0.0';

                return (
                  <View key={`${item.category}-${index}`} style={styles.legendItem}>
                    <View style={styles.legendLeft}>
                      <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                      <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                    <View style={styles.legendRight}>
                      <Text style={styles.amountText}>R$ {formatCurrency(item.amount)}</Text>
                      <Text style={styles.percentageText}>({percentage}%)</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.tableSection}>
              <Text style={styles.tableTitle}>Resumo por categoria</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeaderRow]}>
                    <Text style={[styles.tableCell, styles.headerCell, styles.categoryColumn]}>Categoria</Text>
                    <Text style={[styles.tableCell, styles.headerCell, styles.valueColumn]}>Orcamento</Text>
                    <Text style={[styles.tableCell, styles.headerCell, styles.valueColumn]}>Despesa</Text>
                  </View>
                  {expenseData.map((item, index) => (
                    <View key={`table-${item.category}-${index}`} style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.categoryColumn]}>{item.category}</Text>
                      <Text style={[styles.tableCell, styles.valueColumn]}>
                        {item.budget > 0 ? `R$ ${formatCurrency(item.budget)}` : '-'}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.valueColumn,
                          item.budget > 0
                            ? item.amount > item.budget
                              ? styles.expenseOverBudget
                              : styles.expenseWithinBudget
                            : undefined,
                        ]}
                      >
                        R$ {formatCurrency(item.amount)}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Sem despesas no mes atual.</Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 430,
  },
  cardContent: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 4
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginBottom: 14,
    position: 'relative',
  },
  svg: {
    alignSelf: 'center',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  legend: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 5,
  },
  categoryText: {
    fontSize: 13,
    color: '#000000',
  },
  legendRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
  },
  percentageText: {
    fontSize: 12,
    color: '#666666',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
  },
  tableSection: {
    marginTop: 12,
    gap: 8,
  },
  tableTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  table: {
    minWidth: 420,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    backgroundColor: '#f8fafc',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableCell: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#111827',
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  categoryColumn: {
    minWidth: 150,
    flex: 2,
  },
  valueColumn: {
    minWidth: 130,
    flex: 1.5,
  },
  expenseOverBudget: {
    color: '#dc2626',
    fontWeight: '700',
  },
  expenseWithinBudget: {
    color: '#16a34a',
    fontWeight: '700',
  },
});





