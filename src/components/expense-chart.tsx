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
  const isCompactScreen = width < 430;

  const chartSize = isLargeScreen ? 170 : isCompactScreen ? 128 : 150;
  const radius = chartSize * 0.4;
  const center = chartSize / 2;

  const total = expenseData.reduce((sum, item) => sum + item.amount, 0);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
    });
  };

  return (
    <Card
      style={[
        styles.card,
        isLargeScreen ? styles.cardDesktop : styles.cardMobile,
        isCompactScreen && styles.cardCompact,
      ]}
      maxWidth={isLargeScreen ? 600 : 0}
    >
      <CardHeader>
        <CardTitle>Despesas e Orcamento por Categoria</CardTitle>
        <CardDescription>Comparativo entre planejamento e gastos do mes</CardDescription>
      </CardHeader>

      <CardContent style={styles.cardContent}>
        {hasData ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={[styles.chartContainer, isCompactScreen && styles.chartContainerCompact]}>
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
                          strokeWidth={isLargeScreen ? 24 : isCompactScreen ? 16 : 20}
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

              <View style={[styles.centerLabel, { top: center - (isCompactScreen ? 18 : 20) }]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={[styles.totalAmount, isCompactScreen && styles.totalAmountCompact]}>R$ {formatCurrency(total)}</Text>
              </View>
            </View>

            <View style={styles.legend}>
              {expenseData.map((item, index) => {
                const percentage = total > 0 ? ((item.amount / total) * 100).toFixed(1) : '0.0';

                return (
                  <View key={`${item.category}-${index}`} style={[styles.legendItem, isCompactScreen && styles.legendItemCompact]}>
                    <View style={styles.legendLeft}>
                      <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                      <Text style={[styles.categoryText, isCompactScreen && styles.categoryTextCompact]}>{item.category}</Text>
                    </View>
                    <View style={[styles.legendRight, isCompactScreen && styles.legendRightCompact]}>
                      <Text style={[styles.amountText, isCompactScreen && styles.amountTextCompact]}>R$ {formatCurrency(item.amount)}</Text>
                      <Text style={styles.percentageText}>({percentage}%)</Text>
                    </View>
                  </View>
                );
              })}
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
    minHeight: 0,
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  cardDesktop: {
    flex: 1,
    minHeight: 430,
  },
  cardMobile: {
    width: '100%',
    alignSelf: 'stretch',
    flexGrow: 0,
    flexShrink: 1,
  },
  cardCompact: {
    minHeight: 0,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  cardContent: {
    flex: 1
  },
  scrollContent: {
    
    paddingVertical: 4
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginBottom: 14,
    position: 'relative',
  },
  chartContainerCompact: {
    height: 154,
    marginBottom: 10,
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
  totalAmountCompact: {
    fontSize: 12,
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
  legendItemCompact: {
    alignItems: 'flex-start',
    gap: 6,
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
    flexShrink: 1,
  },
  categoryTextCompact: {
    fontSize: 12,
  },
  legendRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  legendRightCompact: {
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    flexShrink: 1,
  },
  amountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
  },
  amountTextCompact: {
    fontSize: 12,
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
});





