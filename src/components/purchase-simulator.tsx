import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface SimulationResult {
  canAfford: boolean;
  impactOnSavings: number;
  monthsToRecover: number;
  recommendation: string;
  alternativeSuggestion?: string;
}

export function PurchaseSimulator() {
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [purchaseDescription, setPurchaseDescription] = useState("");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock financial data - seria obtido do contexto real do usuário
  const mockUserData = {
    currentBalance: 2350,
    monthlyIncome: 3200,
    monthlyExpenses: 1200,
    savingsGoal: 1000,
    currentSavings: 750,
  };

  const simulatePurchase = () => {
    if (!purchaseAmount || Number.parseFloat(purchaseAmount) <= 0) return;

    setIsLoading(true);

    // Simular processamento
    setTimeout(() => {
      const amount = Number.parseFloat(purchaseAmount);
      const monthlySurplus = mockUserData.monthlyIncome - mockUserData.monthlyExpenses;
      const newBalance = mockUserData.currentBalance - amount;
      const impactOnSavings = Math.max(0, amount - (mockUserData.currentBalance - mockUserData.savingsGoal));
      const monthsToRecover = impactOnSavings > 0 ? Math.ceil(impactOnSavings / monthlySurplus) : 0;

      let recommendation = "";
      let alternativeSuggestion = "";
      let canAfford = true;

      if (newBalance < 0) {
        canAfford = false;
        recommendation = "❌ Compra não recomendada: Você ficaria com saldo negativo.";
        alternativeSuggestion = `Considere economizar por ${Math.ceil(Math.abs(newBalance) / monthlySurplus)} meses antes desta compra.`;
      } else if (impactOnSavings > 0) {
        canAfford = true;
        recommendation = `⚠️ Compra possível, mas afetará sua meta de poupança em R$ ${impactOnSavings.toFixed(2)}.`;
        alternativeSuggestion = `Você precisará de ${monthsToRecover} meses para recuperar o impacto na poupança.`;
      } else {
        recommendation = "✅ Compra recomendada: Não afetará significativamente suas finanças.";
      }

      setResult({
        canAfford,
        impactOnSavings,
        monthsToRecover,
        recommendation,
        alternativeSuggestion,
      });
      setIsLoading(false);
    }, 1000);
  };

  const resetSimulation = () => {
    setPurchaseAmount("");
    setPurchaseDescription("");
    setResult(null);
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
    });
  };

  const newBalance = result ? mockUserData.currentBalance - Number.parseFloat(purchaseAmount) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Simulador de Compras</Text>
        <Text style={styles.cardDescription}>
          Analise o impacto de uma compra no seu orçamento
        </Text>
      </View>
      
      <ScrollView style={styles.cardContent} showsVerticalScrollIndicator={false}>
        {/* Formulário */}
        <View style={styles.formContainer}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Descrição da compra</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Notebook, Geladeira, Viagem..."
              value={purchaseDescription}
              onChangeText={setPurchaseDescription}
              placeholderTextColor="#999999"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Valor (R$)</Text>
            <TextInput
              style={styles.input}
              placeholder="0,00"
              value={purchaseAmount}
              onChangeText={setPurchaseAmount}
              keyboardType="numeric"
              placeholderTextColor="#999999"
            />
          </View>
        </View>

        {/* Botões */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[
              styles.simulateButton,
              (!purchaseAmount || isLoading) && styles.simulateButtonDisabled
            ]}
            onPress={simulatePurchase}
            disabled={!purchaseAmount || isLoading}
          >
            <Text style={styles.simulateButtonText}>
              {isLoading ? "Simulando..." : "Simular Compra"}
            </Text>
          </TouchableOpacity>
          
          {result && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetSimulation}
            >
              <Text style={styles.resetButtonText}>Nova Simulação</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Resultado */}
        {result && (
          <View style={styles.resultContainer}>
            {/* Alerta principal */}
            <View style={[
              styles.alert,
              result.canAfford ? styles.positiveAlert : styles.negativeAlert
            ]}>
              <Text style={styles.alertText}>{result.recommendation}</Text>
            </View>

            {/* Sugestão alternativa */}
            {result.alternativeSuggestion && (
              <View style={styles.alert}>
                <Text style={styles.alertText}>{result.alternativeSuggestion}</Text>
              </View>
            )}

            {/* Dados financeiros */}
            <View style={styles.financialData}>
              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Saldo após compra</Text>
                <Text style={styles.dataValue}>
                  R$ {formatCurrency(newBalance)}
                </Text>
              </View>

              {result.impactOnSavings > 0 && (
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Impacto na poupança</Text>
                  <Text style={[styles.dataValue, styles.negativeValue]}>
                    -R$ {formatCurrency(result.impactOnSavings)}
                  </Text>
                </View>
              )}
            </View>

            {/* Informações adicionais */}
            <View style={styles.additionalInfo}>
              <Text style={styles.infoTitle}>Sua situação atual:</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Saldo atual</Text>
                  <Text style={styles.infoValue}>R$ {formatCurrency(mockUserData.currentBalance)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Meta de poupança</Text>
                  <Text style={styles.infoValue}>R$ {formatCurrency(mockUserData.savingsGoal)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Poupança atual</Text>
                  <Text style={styles.infoValue}>R$ {formatCurrency(mockUserData.currentSavings)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Sobra mensal</Text>
                  <Text style={styles.infoValue}>
                    R$ {formatCurrency(mockUserData.monthlyIncome - mockUserData.monthlyExpenses)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
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
  formContainer: {
    gap: 16,
    marginBottom: 20,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000000',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  simulateButton: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simulateButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  simulateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  resetButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  alert: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  positiveAlert: {
    borderLeftColor: '#16a34a', // chart-3 - green
  },
  negativeAlert: {
    borderLeftColor: '#dc2626', // destructive - red
  },
  alertText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
  financialData: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  dataItem: {
    flex: 1,
    minWidth: '45%',
    gap: 4,
  },
  dataLabel: {
    fontSize: 14,
    color: '#666666',
  },
  dataValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  negativeValue: {
    color: '#dc2626',
  },
  additionalInfo: {
    gap: 12,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
    gap: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
});