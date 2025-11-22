import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

interface Insight {
  title: string;
  description: string;
  type: "positive" | "warning" | "negative";
  value?: string;
}

// Mock insights - serão gerados dinamicamente baseados nos dados reais
const mockInsights: Insight[] = [
  {
    title: "Economia este mês",
    description: "Você gastou 15% menos que no mês passado. Continue assim!",
    type: "positive",
    value: "R$ 320",
  },
  {
    title: "Categoria em alta",
    description: "Seus gastos com alimentação aumentaram 25% este mês.",
    type: "warning",
    value: "Alimentação",
  },
  {
    title: "Meta de poupança",
    description: "Você está 75% próximo da sua meta mensal de R$ 1.000.",
    type: "positive",
    value: "75%",
  },
  {
    title: "Atenção aos gastos",
    description: "Você gastou mais que a média nos últimos 3 dias.",
    type: "warning",
  },
];

export function FinancialInsights() {
  const getInsightColor = (type: Insight["type"]) => {
    switch (type) {
      case "positive":
        return styles.positiveBadge;
      case "warning":
        return styles.warningBadge;
      case "negative":
        return styles.negativeBadge;
      default:
        return styles.defaultBadge;
    }
  };

  const getInsightIcon = (type: Insight["type"]) => {
    switch (type) {
      case "positive":
        return "✓";
      case "warning":
        return "⚠";
      case "negative":
        return "!";
      default:
        return "•";
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Insights Financeiros</Text>
        <Text style={styles.cardDescription}>
          Análises personalizadas das suas finanças
        </Text>
      </View>
      
      <ScrollView style={styles.cardContent} showsVerticalScrollIndicator={false}>
        <View style={styles.insightsContainer}>
          {mockInsights.map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              {/* Badge/Ícone */}
              <View style={[styles.badge, getInsightColor(insight.type)]}>
                <Text style={styles.badgeText}>
                  {getInsightIcon(insight.type)}
                </Text>
              </View>

              {/* Conteúdo do Insight */}
              <View style={styles.insightContent}>
                <View style={styles.insightHeader}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  {insight.value && (
                    <Text style={styles.insightValue}>{insight.value}</Text>
                  )}
                </View>
                <Text style={styles.insightDescription}>
                  {insight.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 8,
    elevation: 3,
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
  insightsContainer: {
    gap: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  positiveBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)', // chart-3/10 - green
    borderColor: 'rgba(34, 197, 94, 0.2)', // chart-3/20
  },
  warningBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)', // chart-4/10 - amber
    borderColor: 'rgba(245, 158, 11, 0.2)', // chart-4/20
  },
  negativeBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // destructive/10 - red
    borderColor: 'rgba(239, 68, 68, 0.2)', // destructive/20
  },
  defaultBadge: {
    backgroundColor: '#f5f5f5', // muted
    borderColor: '#e5e5e5',
  },
  positiveBadgeText: {
    color: '#16a34a', // chart-3 - green
  },
  warningBadgeText: {
    color: '#d97706', // chart-4 - amber
  },
  negativeBadgeText: {
    color: '#dc2626', // destructive - red
  },
  insightContent: {
    flex: 1,
    gap: 4,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    marginRight: 8,
  },
  insightValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000', // text-primary
    flexShrink: 0,
  },
  insightDescription: {
    fontSize: 14,
    color: '#666666', // text-muted-foreground
    lineHeight: 20,
  },
});