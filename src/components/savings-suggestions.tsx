import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export interface SavingSuggestionItem {
  title: string;
  description: string;
  potentialSavings: number;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  reductionTarget: string;
}

interface SavingsSuggestionsProps {
  suggestions: SavingSuggestionItem[];
  monthLabel: string;
  totalPotentialSavings: number;
  totalExpenses: number;
  expenseLimit: number;
  loading?: boolean;
}

export function SavingsSuggestions({
  suggestions,
  monthLabel,
  totalPotentialSavings,
  totalExpenses,
  expenseLimit,
  loading = false,
}: SavingsSuggestionsProps) {
  const getDifficultyColor = (difficulty: SavingSuggestionItem["difficulty"]) => {
    switch (difficulty) {
      case "easy":
        return styles.easyBadge;
      case "medium":
        return styles.mediumBadge;
      case "hard":
        return styles.hardBadge;
      default:
        return styles.defaultBadge;
    }
  };

  const getDifficultyLabel = (difficulty: SavingSuggestionItem["difficulty"]) => {
    switch (difficulty) {
      case "easy":
        return "Facil";
      case "medium":
        return "Moderada";
      case "hard":
        return "Alta";
      default:
        return "Indefinido";
    }
  };

  const formatCurrency = (amount: number) =>
    Number(amount || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const overLimit = Math.max(totalExpenses - expenseLimit, 0);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Sugestoes de Economia</Text>
        <Text style={styles.cardDescription}>
          Leitura do periodo de {monthLabel}. Faixa ideal de despesas: {formatCurrency(expenseLimit)}.
        </Text>
      </View>

      <View style={styles.cardContent}>
        {loading ? (
          <View style={styles.loadingBanner}>
            <ActivityIndicator size="small" color="#10233f" />
            <Text style={styles.loadingBannerText}>Atualizando analise do periodo...</Text>
          </View>
        ) : null}

        {suggestions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Nenhum corte prioritario agora.</Text>
            <Text style={styles.emptyStateText}>
              Suas despesas somaram {formatCurrency(totalExpenses)} e ficaram dentro da faixa planejada para o periodo.
            </Text>
          </View>
        ) : (
          <View style={styles.suggestionsContainer}>
            {suggestions.map((suggestion, index) => (
              <View key={`${suggestion.title}-${suggestion.reductionTarget}-${index}`} style={styles.suggestionItem}>
                <View style={styles.suggestionHeader}>
                  <View style={styles.suggestionInfo}>
                    <View style={styles.badgeContainer}>
                      <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                      <View style={styles.badgesRow}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>{suggestion.category}</Text>
                        </View>
                        <View style={[styles.difficultyBadge, getDifficultyColor(suggestion.difficulty)]}>
                          <Text style={styles.difficultyBadgeText}>{getDifficultyLabel(suggestion.difficulty)}</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                  </View>

                  <View style={styles.savingsContainer}>
                    <Text style={styles.savingsAmount}>{formatCurrency(suggestion.potentialSavings)}</Text>
                    <Text style={styles.savingsPeriod}>economia estimada</Text>
                  </View>
                </View>

                <View style={styles.reductionBadge}>
                  <Text style={styles.reductionBadgeText}>{suggestion.reductionTarget}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.totalContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Despesas do periodo</Text>
            <Text style={styles.totalAmount}>{formatCurrency(totalExpenses)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Acima da faixa ideal</Text>
            <Text style={styles.totalAmount}>{formatCurrency(overLimit)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Economia potencial sugerida</Text>
            <Text style={styles.totalAmount}>{formatCurrency(totalPotentialSavings)}</Text>
          </View>
          <Text style={styles.totalDescription}>
            Mantendo esse ajuste por 12 meses, o impacto projetado seria de {formatCurrency(totalPotentialSavings * 12)}.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(197, 210, 223, 0.42)",
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  cardHeader: {
    padding: 22,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(203, 213, 225, 0.38)",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#10233f",
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: "#5f7087",
    lineHeight: 21,
  },
  cardContent: {
    padding: 22,
  },
  loadingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#f8fbfd",
    borderWidth: 1,
    borderColor: "rgba(197, 210, 223, 0.42)",
  },
  loadingBannerText: {
    fontSize: 13,
    color: "#5f7087",
    fontWeight: "600",
  },
  suggestionsContainer: {
    gap: 16,
    marginBottom: 22,
  },
  suggestionItem: {
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(197, 210, 223, 0.42)",
    borderRadius: 20,
    gap: 14,
    backgroundColor: "#f8fbfd",
  },
  suggestionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  suggestionInfo: {
    flex: 1,
    gap: 8,
  },
  badgeContainer: {
    gap: 8,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#10233f",
  },
  badgesRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  categoryBadge: {
    backgroundColor: "transparent",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(197, 210, 223, 0.56)",
  },
  categoryBadgeText: {
    fontSize: 10,
    color: "#5f7087",
    fontWeight: "700",
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  difficultyBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ffffff",
  },
  easyBadge: {
    backgroundColor: "#0d8a67",
  },
  mediumBadge: {
    backgroundColor: "#f59e0b",
  },
  hardBadge: {
    backgroundColor: "#dc2626",
  },
  defaultBadge: {
    backgroundColor: "#64748b",
  },
  suggestionDescription: {
    fontSize: 14,
    color: "#5f7087",
    lineHeight: 21,
  },
  savingsContainer: {
    alignItems: "flex-end",
    minWidth: 130,
  },
  savingsAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0d8a67",
  },
  savingsPeriod: {
    fontSize: 12,
    color: "#718198",
    marginTop: 4,
  },
  reductionBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#ecfdf5",
    borderColor: "rgba(13, 138, 103, 0.18)",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reductionBadgeText: {
    fontSize: 12,
    color: "#0d8a67",
    fontWeight: "700",
  },
  emptyState: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(197, 210, 223, 0.42)",
    backgroundColor: "#f8fbfd",
    gap: 8,
    marginBottom: 22,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#10233f",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#5f7087",
    lineHeight: 21,
  },
  totalContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(203, 213, 225, 0.38)",
    gap: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    flex: 1,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#10233f",
  },
  totalDescription: {
    fontSize: 13,
    color: "#5f7087",
    marginTop: 8,
    lineHeight: 20,
  },
});
