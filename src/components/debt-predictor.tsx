import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

interface DebtPrediction {
  riskLevel: "low" | "medium" | "high";
  projectedBalance: number;
  monthsToZero: number | null;
  recommendations: string[];
}

export function DebtPredictor() {
  // Mock financial data e análise preditiva
  const mockUserData = {
    currentBalance: 2350,
    monthlyIncome: 3200,
    monthlyExpenses: 1200,
    expenseGrowthRate: 0.05, // 5% ao mês
    incomeGrowthRate: 0.02, // 2% ao mês
  };

  // Simulação de previsão de endividamento
  const calculateDebtPrediction = (): DebtPrediction => {
    const monthlySurplus = mockUserData.monthlyIncome - mockUserData.monthlyExpenses;
    let balance = mockUserData.currentBalance;
    let monthsToZero = null;
    let riskLevel: "low" | "medium" | "high" = "low";

    // Simular crescimento de despesas vs receitas
    for (let month = 1; month <= 12; month++) {
      const projectedIncome = mockUserData.monthlyIncome * (1 + mockUserData.incomeGrowthRate * month);
      const projectedExpenses = mockUserData.monthlyExpenses * (1 + mockUserData.expenseGrowthRate * month);
      balance += projectedIncome - projectedExpenses;

      if (balance <= 0 && monthsToZero === null) {
        monthsToZero = month;
        break;
      }
    }

    // Determinar nível de risco
    if (monthsToZero && monthsToZero <= 3) {
      riskLevel = "high";
    } else if (monthsToZero && monthsToZero <= 6) {
      riskLevel = "medium";
    } else if (monthlySurplus < 500) {
      riskLevel = "medium";
    }

    const recommendations = [];
    if (riskLevel === "high") {
      recommendations.push("Reduza gastos imediatamente em categorias não essenciais");
      recommendations.push("Considere uma fonte de renda extra");
      recommendations.push("Evite compras parceladas ou financiamentos");
    } else if (riskLevel === "medium") {
      recommendations.push("Monitore seus gastos mais de perto");
      recommendations.push("Crie uma reserva de emergência");
      recommendations.push("Revise seu orçamento mensalmente");
    } else {
      recommendations.push("Continue mantendo o controle dos gastos");
      recommendations.push("Considere aumentar sua meta de poupança");
      recommendations.push("Explore opções de investimento");
    }

    return {
      riskLevel,
      projectedBalance: balance,
      monthsToZero,
      recommendations,
    };
  };

  const prediction = calculateDebtPrediction();

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return styles.highRisk;
      case "medium":
        return styles.mediumRisk;
      case "low":
        return styles.lowRisk;
      default:
        return styles.defaultRisk;
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case "high":
        return "Alto Risco";
      case "medium":
        return "Risco Moderado";
      case "low":
        return "Baixo Risco";
      default:
        return "Indefinido";
    }
  };

  const getBalanceColor = (balance: number) => {
    return balance > 0 ? styles.positiveBalance : styles.negativeBalance;
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
    });
  };

  // Calcular progresso para a barra
  const progressValue = Math.max(0, Math.min(100, (prediction.projectedBalance / mockUserData.currentBalance) * 100));

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Previsão de Endividamento</Text>
        <Text style={styles.cardDescription}>
          Análise preditiva baseada no seu padrão de gastos
        </Text>
      </View>
      
      <ScrollView style={styles.cardContent} showsVerticalScrollIndicator={false}>
        {/* Nível de Risco */}
        <View style={styles.riskContainer}>
          <Text style={styles.riskLabel}>Nível de Risco</Text>
          <View style={[styles.riskBadge, getRiskColor(prediction.riskLevel)]}>
            <Text style={styles.riskBadgeText}>
              {getRiskLabel(prediction.riskLevel)}
            </Text>
          </View>
        </View>

        {/* Alerta */}
        {prediction.monthsToZero && (
          <View style={styles.alert}>
            <Text style={styles.alertText}>
              ⚠️ Atenção: Com o padrão atual de gastos, seu saldo pode chegar a zero em aproximadamente{' '}
              <Text style={styles.alertBold}>{prediction.monthsToZero} meses</Text>.
            </Text>
          </View>
        )}

        {/* Saldo Projetado */}
        <View style={styles.balanceSection}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Saldo projetado (12 meses)</Text>
            <Text style={[styles.balanceValue, getBalanceColor(prediction.projectedBalance)]}>
              R$ {formatCurrency(prediction.projectedBalance)}
            </Text>
          </View>
          
          {/* Barra de Progresso */}
          <View style={styles.progressTrack}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${progressValue}%` },
                getRiskColor(prediction.riskLevel)
              ]} 
            />
          </View>
        </View>

        {/* Recomendações */}
        <View style={styles.recommendationsSection}>
          <Text style={styles.recommendationsTitle}>Recomendações:</Text>
          <View style={styles.recommendationsList}>
            {prediction.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </View>
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
    paddingTop: 16,
  },
  riskContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  riskLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  highRisk: {
    backgroundColor: '#dc2626', // destructive
  },
  mediumRisk: {
    backgroundColor: '#f59e0b', // chart-4 (amber)
  },
  lowRisk: {
    backgroundColor: '#16a34a', // chart-3 (green)
  },
  defaultRisk: {
    backgroundColor: '#f5f5f5', // muted
  },
  alert: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  alertText: {
    fontSize: 14,
    color: '#dc2626',
    lineHeight: 20,
  },
  alertBold: {
    fontWeight: 'bold',
  },
  balanceSection: {
    marginBottom: 20,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666666',
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  positiveBalance: {
    color: '#16a34a', // chart-3
  },
  negativeBalance: {
    color: '#dc2626', // destructive
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
  recommendationsSection: {
    gap: 12,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  recommendationsList: {
    gap: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    lineHeight: 20,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});