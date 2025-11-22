import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import React from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';

const mockMonthlyData = [
  { month: "Jan", receitas: 3200, despesas: 2100 },
  { month: "Fev", receitas: 3500, despesas: 2300 },
  { month: "Mar", receitas: 3200, despesas: 1900 },
  { month: "Abr", receitas: 3800, despesas: 2500 },
  { month: "Mai", receitas: 3200, despesas: 2200 },
  { month: "Jun", receitas: 3600, despesas: 2400 },
];

export function IncomeExpenseChart() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const chartWidth = Math.min(width - 64, 650); 
  const chartHeight = 320;
  const maxValue = Math.max(...mockMonthlyData.flatMap(item => [item.receitas, item.despesas]));
  
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
    });
  };

  const barWidth = isLargeScreen ? 24 : 20;
  const spacing = 10;
  const groupWidth = barWidth * 2 + spacing;
  const availableWidth = chartWidth - 80;
  const groupSpacing = availableWidth / mockMonthlyData.length - groupWidth;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receitas vs Despesas</CardTitle>
        <CardDescription>
          Comparação mensal dos últimos 6 meses
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <ScrollView 
          horizontal={!isLargeScreen}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.chartContainer}>
            <View style={{ width: chartWidth }}>
              <Svg width={chartWidth} height={chartHeight}>
                <Line x1={40} y1={20} x2={40} y2={chartHeight - 40} stroke="#e5e5e5" strokeWidth="1" />
                <Line x1={40} y1={chartHeight - 40} x2={chartWidth - 20} y2={chartHeight - 40} stroke="#e5e5e5" strokeWidth="1" />
                
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                  const y = 20 + (chartHeight - 60) * (1 - ratio);
                  return (
                    <Line
                      key={index}
                      x1={40}
                      y1={y}
                      x2={chartWidth - 20}
                      y2={y}
                      stroke="#f5f5f5"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                    />
                  );
                })}

                {mockMonthlyData.map((item, index) => {
                  const x = 60 + (index * (groupWidth + groupSpacing));
                  
                  const receitasHeight = (item.receitas / maxValue) * (chartHeight - 80);
                  const despesasHeight = (item.despesas / maxValue) * (chartHeight - 80);
                  
                  const receitasY = chartHeight - 40 - receitasHeight;
                  const despesasY = chartHeight - 40 - despesasHeight;

                  return (
                    <G key={index}>
                      <Rect
                        x={x}
                        y={receitasY}
                        width={barWidth}
                        height={receitasHeight}
                        fill="#16a34a"
                        rx={4}
                      />
                      
                      <Rect
                        x={x + barWidth + spacing}
                        y={despesasY}
                        width={barWidth}
                        height={despesasHeight}
                        fill="#dc2626"
                        rx={4}
                      />
                      
                      <SvgText
                        x={x + groupWidth / 2}
                        y={chartHeight - 20}
                        textAnchor="middle"
                        fontSize="12"
                        fill="#666666"
                      >
                        {item.month}
                      </SvgText>
                      
                      {receitasHeight > 20 && (
                        <SvgText
                          x={x + barWidth / 2}
                          y={receitasY - 5}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#16a34a"
                          fontWeight="bold"
                        >
                          {(item.receitas / 1000).toFixed(0)}k
                        </SvgText>
                      )}
                      
                      {despesasHeight > 20 && (
                        <SvgText
                          x={x + barWidth + spacing + barWidth / 2}
                          y={despesasY - 5}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#dc2626"
                          fontWeight="bold"
                        >
                          {(item.despesas / 1000).toFixed(0)}k
                        </SvgText>
                      )}
                    </G>
                  );
                })}

                {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                  const y = 20 + (chartHeight - 60) * (1 - ratio);
                  const value = (maxValue * ratio) / 1000;
                  return (
                    <SvgText
                      key={index}
                      x={30}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="10"
                      fill="#666666"
                    >
                      {value.toFixed(0)}k
                    </SvgText>
                  );
                })}
              </Svg>

              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: "#16a34a" }]} />
                  <Text style={styles.legendText}>Receitas</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: "#dc2626" }]} />
                  <Text style={styles.legendText}>Despesas</Text>
                </View>
              </View>
            </View>

            <View style={styles.dataTable}>
              <Text style={styles.dataTableTitle}>Dados Detalhados</Text>
              {mockMonthlyData.map((item, index) => {
                const saldo = item.receitas - item.despesas;
                return (
                  <View key={index} style={styles.dataRow}>
                    <Text style={styles.monthText}>{item.month}</Text>
                    <View style={styles.dataValues}>
                      <Text style={styles.incomeText}>R$ {formatCurrency(item.receitas)}</Text>
                      <Text style={styles.expenseText}>R$ {formatCurrency(item.despesas)}</Text>
                      <Text style={[
                        styles.balanceText,
                        saldo >= 0 ? styles.positiveBalance : styles.negativeBalance
                      ]}>
                        R$ {formatCurrency(saldo)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, 
    minHeight: 540,
  },

  chartContainer: {
    padding: 16,
    alignItems: 'center',
    minWidth: 350,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#374151',
  },
  dataTable: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    minWidth: 350,
  },
  dataTableTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  monthText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    minWidth: 40,
  },
  dataValues: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 16,
  },
  incomeText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '500',
  },
  expenseText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  positiveBalance: {
    color: '#16a34a',
  },
  negativeBalance: {
    color: '#dc2626',
  },
});