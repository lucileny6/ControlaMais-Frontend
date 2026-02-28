import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import React from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

export interface ExpenseData {
  category: string;
  amount: number;
  color: string;
}

const fallbackExpenseData: ExpenseData[] = [
  { category: 'Alimentacao', amount: 450, color: '#3b82f6' },
  { category: 'Transporte', amount: 200, color: '#ef4444' },
  { category: 'Contas', amount: 300, color: '#10b981' },
  { category: 'Lazer', amount: 150, color: '#f59e0b' },
  { category: 'Saude', amount: 100, color: '#8b5cf6' },
];

export function ExpenseChart({ data }: { data?: ExpenseData[] }) {
  const expenseData = data && data.length > 0 ? data : fallbackExpenseData;
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const chartSize = isLargeScreen ? 200 : 180;
  const radius = chartSize * 0.4;
  const center = chartSize / 2;

  const total = expenseData.reduce((sum, item) => sum + item.amount, 0);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
    });
  };

  return (
    <Card style={styles.card}>
      <CardHeader>
        <CardTitle>Despesas por Categoria</CardTitle>
        <CardDescription>Distribuicao dos seus gastos este mes</CardDescription>
      </CardHeader>

      <CardContent style={styles.cardContent}>
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
                        strokeWidth={isLargeScreen ? 32 : 28}
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
        </ScrollView>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 480,
  },
  cardContent: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 8
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 240,
    marginBottom: 24,
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
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  legend: {
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
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
    fontSize: 14,
    color: '#000000',
  },
  legendRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  percentageText: {
    fontSize: 12,
    color: '#666666',
  },
});
