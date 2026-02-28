import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export interface Insight {
  title: string;
  description: string;
  type: 'positive' | 'warning' | 'negative';
  value?: string;
}

const fallbackInsights: Insight[] = [
  {
    title: 'Economia este mes',
    description: 'Voce gastou menos que no mes passado. Continue assim.',
    type: 'positive',
  },
  {
    title: 'Categoria em alta',
    description: 'Monitore a categoria que mais cresce para evitar surpresas.',
    type: 'warning',
  },
];

export function FinancialInsights({ insights }: { insights?: Insight[] }) {
  const list = insights && insights.length > 0 ? insights : fallbackInsights;

  const getInsightColor = (type: Insight['type']) => {
    switch (type) {
      case 'positive':
        return styles.positiveBadge;
      case 'warning':
        return styles.warningBadge;
      case 'negative':
        return styles.negativeBadge;
      default:
        return styles.defaultBadge;
    }
  };

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'positive':
        return 'OK';
      case 'warning':
        return '!';
      case 'negative':
        return 'X';
      default:
        return '-';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Insights Financeiros</Text>
        <Text style={styles.cardDescription}>Analises personalizadas das suas financas</Text>
      </View>

      <ScrollView style={styles.cardContent} showsVerticalScrollIndicator={false}>
        <View style={styles.insightsContainer}>
          {list.map((insight, index) => (
            <View key={`${insight.title}-${index}`} style={styles.insightItem}>
              <View style={[styles.badge, getInsightColor(insight.type)]}>
                <Text style={styles.badgeText}>{getInsightIcon(insight.type)}</Text>
              </View>

              <View style={styles.insightContent}>
                <View style={styles.insightHeader}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  {insight.value && <Text style={styles.insightValue}>{insight.value}</Text>}
                </View>
                <Text style={styles.insightDescription}>{insight.description}</Text>
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
    fontSize: 10,
    fontWeight: 'bold',
  },
  positiveBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  warningBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  negativeBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  defaultBadge: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e5e5e5',
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
    color: '#000000',
    flexShrink: 0,
  },
  insightDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});
