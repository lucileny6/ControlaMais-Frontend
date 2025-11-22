import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SavingSuggestion {
  title: string;
  description: string;
  potentialSavings: number;
  difficulty: "easy" | "medium" | "hard";
  category: string;
}

export function SavingsSuggestions() {
  // Mock suggestions baseadas no perfil do usuário
  const mockSuggestions: SavingSuggestion[] = [
    {
      title: "Reduza gastos com delivery",
      description: "Você gastou R$ 180 com delivery este mês. Cozinhar em casa 2x por semana pode economizar:",
      potentialSavings: 80,
      difficulty: "easy",
      category: "Alimentação",
    },
    {
      title: "Renegocie planos de assinatura",
      description: "Revise seus planos de streaming e telefone. Muitas vezes há opções mais baratas:",
      potentialSavings: 45,
      difficulty: "easy",
      category: "Contas",
    },
    {
      title: "Use transporte público",
      description: "Substituir Uber por transporte público 3x por semana pode economizar:",
      potentialSavings: 120,
      difficulty: "medium",
      category: "Transporte",
    },
    {
      title: "Compre produtos genéricos",
      description: "Trocar marcas por produtos genéricos no supermercado pode reduzir a conta em:",
      potentialSavings: 60,
      difficulty: "easy",
      category: "Alimentação",
    },
    {
      title: "Cancele academia e exercite-se em casa",
      description: "Apps de exercício e atividades ao ar livre podem substituir a academia:",
      potentialSavings: 89,
      difficulty: "hard",
      category: "Saúde",
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
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

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "Fácil";
      case "medium":
        return "Médio";
      case "hard":
        return "Difícil";
      default:
        return "Indefinido";
    }
  };

  const totalPotentialSavings = mockSuggestions.reduce((sum, suggestion) => sum + suggestion.potentialSavings, 0);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Sugestões de Economia</Text>
        <Text style={styles.cardDescription}>
          Personalizadas baseadas nos seus gastos. Economia potencial: R$ {formatCurrency(totalPotentialSavings)}/mês
        </Text>
      </View>
      
      <ScrollView style={styles.cardContent} showsVerticalScrollIndicator={false}>
        <View style={styles.suggestionsContainer}>
          {mockSuggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionItem}>
              <View style={styles.suggestionHeader}>
                <View style={styles.suggestionInfo}>
                  <View style={styles.badgeContainer}>
                    <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                    <View style={styles.badgesRow}>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{suggestion.category}</Text>
                      </View>
                      <View style={[styles.difficultyBadge, getDifficultyColor(suggestion.difficulty)]}>
                        <Text style={styles.difficultyBadgeText}>
                          {getDifficultyLabel(suggestion.difficulty)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                </View>

                <View style={styles.savingsContainer}>
                  <Text style={styles.savingsAmount}>R$ {formatCurrency(suggestion.potentialSavings)}</Text>
                  <Text style={styles.savingsPeriod}>por mês</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.applyButton}>
                <Text style={styles.applyButtonText}>Aplicar Sugestão</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Resumo total */}
        <View style={styles.totalContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Economia total potencial:</Text>
            <Text style={styles.totalAmount}>R$ {formatCurrency(totalPotentialSavings)}/mês</Text>
          </View>
          <Text style={styles.totalDescription}>
            Isso representa R$ {formatCurrency(totalPotentialSavings * 12)} por ano!
          </Text>
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
    lineHeight: 20,
  },
  cardContent: {
    padding: 20,
  },
  suggestionsContainer: {
    gap: 16,
    marginBottom: 20,
  },
  suggestionItem: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    gap: 12,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  suggestionInfo: {
    flex: 1,
    gap: 8,
  },
  badgeContainer: {
    gap: 8,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  categoryBadgeText: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '500',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  difficultyBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  easyBadge: {
    backgroundColor: '#16a34a', // chart-3 - green
  },
  mediumBadge: {
    backgroundColor: '#f59e0b', // chart-4 - amber
  },
  hardBadge: {
    backgroundColor: '#dc2626', // destructive - red
  },
  defaultBadge: {
    backgroundColor: '#666666',
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  savingsContainer: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  savingsAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a', // chart-3 - green
  },
  savingsPeriod: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  applyButton: {
    backgroundColor: 'transparent',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  applyButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  totalContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  totalDescription: {
    fontSize: 14,
    color: '#666666',
  },
});