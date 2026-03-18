import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useDashboard } from '@/hooks/useDashboard';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import {
  calcularFluxoMensal,
  gerarProjecaoMensal,
  normalizeFinancialTransaction,
  projetarSaldo,
} from '@/services/financialEngine';

type RiskLevel = 'low' | 'medium' | 'high';

interface RecurringProjectionData {
  receitas: number;
  despesas: number;
  fluxoMensal: number;
  saldoProjetado6Meses: number;
  saldoProjetado12Meses: number;
  mesesAteSaldoNegativo: number | null;
  projecaoMensal: { mes: number; saldo: number }[];
  quantidadeRecorrentes: number;
}

export function DebtPredictor() {
  const { saldo, loading: isDashboardLoading } = useDashboard();
  const [projection, setProjection] = useState<RecurringProjectionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTimelineDetails, setShowTimelineDetails] = useState(false);

  const loadProjection = useCallback(async () => {
    try {
      setIsLoading(true);

      const transactionsResponse = await apiService.getTransactions().catch(() => []);
      const normalized = (transactionsResponse ?? []).map((transaction: any, index: number) =>
        normalizeFinancialTransaction(
          {
            id: transaction?.id ?? transaction?._id ?? index,
            descricao: transaction?.descricao ?? transaction?.description,
            valor: transaction?.valor ?? transaction?.amount ?? transaction?.value,
            tipo: transaction?.tipo ?? transaction?.type,
            recorrente:
              transaction?.recorrente ??
              transaction?.recurring ??
              transaction?.isRecurring ??
              transaction?.recorrencia,
            data: transaction?.data ?? transaction?.date,
            date: transaction?.date ?? transaction?.data,
          },
          index,
        ),
      );

      const fluxo = calcularFluxoMensal(normalized);
      const projecaoMensal = gerarProjecaoMensal(saldo, fluxo.fluxoMensal, 12);
      const saldoProjetado6Meses = projetarSaldo(saldo, fluxo.fluxoMensal, 6);
      const saldoProjetado12Meses = projetarSaldo(saldo, fluxo.fluxoMensal, 12);
      const mesesAteSaldoNegativo =
        projecaoMensal.find((item) => item.saldo < 0)?.mes ?? null;

      setProjection({
        receitas: fluxo.receitas,
        despesas: fluxo.despesas,
        fluxoMensal: fluxo.fluxoMensal,
        saldoProjetado6Meses,
        saldoProjetado12Meses,
        mesesAteSaldoNegativo,
        projecaoMensal,
        quantidadeRecorrentes: normalized.filter((transaction) => transaction.recorrente).length,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao calcular previsao',
        description: error?.message ?? 'Nao foi possivel gerar o fluxo de caixa projetado.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [saldo]);

  useEffect(() => {
    loadProjection();
  }, [loadProjection]);

  useFocusEffect(
    useCallback(() => {
      loadProjection();
    }, [loadProjection]),
  );

  const riskLevel = useMemo<RiskLevel>(() => {
    if (!projection) return 'low';
    if (projection.mesesAteSaldoNegativo !== null && projection.mesesAteSaldoNegativo <= 3) return 'high';
    if (projection.mesesAteSaldoNegativo !== null && projection.mesesAteSaldoNegativo <= 6) return 'medium';
    if (projection.fluxoMensal < 0) return 'high';
    if (projection.fluxoMensal < 500) return 'medium';
    return 'low';
  }, [projection]);

  const recommendations = useMemo(() => {
    if (!projection) return [];

    if (projection.quantidadeRecorrentes === 0) {
      return [
        'Marque receitas e despesas fixas como recorrentes para ativar a projecao futura.',
        'Exemplos ideais: salario, aluguel, assinatura e contas mensais.',
      ];
    }

    if (riskLevel === 'high') {
      return [
        'Suas despesas recorrentes estao pressionando o saldo futuro.',
        'Revise custos fixos e evite assumir novas parcelas antes de equilibrar o fluxo mensal.',
      ];
    }

    if (riskLevel === 'medium') {
      return [
        'O fluxo mensal esta positivo, mas ainda merece acompanhamento.',
        'Aumentar receitas recorrentes ou reduzir despesas fixas melhora a projecao rapidamente.',
      ];
    }

    return [
      'Seu fluxo recorrente esta saudavel no horizonte projetado.',
      'Voce pode usar esse saldo previsto como base para metas e simulacoes de compra.',
    ];
  }, [projection, riskLevel]);

  const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
      case 'high':
        return styles.highRisk;
      case 'medium':
        return styles.mediumRisk;
      case 'low':
        return styles.lowRisk;
      default:
        return styles.defaultRisk;
    }
  };

  const getRiskLabel = (risk: RiskLevel) => {
    switch (risk) {
      case 'high':
        return 'Alto risco';
      case 'medium':
        return 'Risco moderado';
      case 'low':
        return 'Baixo risco';
      default:
        return 'Indefinido';
    }
  };

  const getBalanceColor = (amount: number) => {
    return amount >= 0 ? styles.positiveBalance : styles.negativeBalance;
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const latestProjectedBalance = projection?.saldoProjetado12Meses ?? saldo;
  const progressBase = Math.max(Math.abs(saldo), 1);
  const progressValue = Math.max(0, Math.min(100, (Math.abs(latestProjectedBalance) / progressBase) * 100));

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Previsao de Endividamento</Text>
        <Text style={styles.cardDescription}>
          Fluxo de caixa projetado com base nas transacoes recorrentes do sistema
        </Text>
      </View>

      <ScrollView style={styles.cardContent} showsVerticalScrollIndicator={false}>
        <View style={styles.riskContainer}>
          <Text style={styles.riskLabel}>Nivel de risco</Text>
          <View style={[styles.riskBadge, getRiskColor(riskLevel)]}>
            <Text style={styles.riskBadgeText}>{getRiskLabel(riskLevel)}</Text>
          </View>
        </View>

        {projection?.mesesAteSaldoNegativo && (
          <View style={styles.alert}>
            <Text style={styles.alertText}>
              Com o fluxo recorrente atual, seu saldo pode ficar negativo em cerca de{' '}
              <Text style={styles.alertBold}>{projection.mesesAteSaldoNegativo} meses</Text>.
            </Text>
          </View>
        )}

        {projection?.quantidadeRecorrentes === 0 && !isLoading && !isDashboardLoading && (
          <View style={styles.infoAlert}>
            <Text style={styles.infoAlertText}>
              Nenhuma transacao recorrente foi encontrada. Os lancamentos atuais continuam no historico,
              mas so entram na projecao futura quando estiverem marcados como recorrentes.
            </Text>
          </View>
        )}

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Receitas recorrentes</Text>
            <Text style={[styles.metricValue, styles.positiveBalance]}>
              R$ {formatCurrency(projection?.receitas ?? 0)}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Despesas recorrentes</Text>
            <Text style={[styles.metricValue, styles.negativeBalance]}>
              R$ {formatCurrency(projection?.despesas ?? 0)}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Fluxo mensal</Text>
            <Text style={[styles.metricValue, getBalanceColor(projection?.fluxoMensal ?? 0)]}>
              R$ {formatCurrency(projection?.fluxoMensal ?? 0)}
            </Text>
          </View>
        </View>

        <View style={styles.balanceSection}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Saldo projetado 6 meses</Text>
            <Text style={[styles.balanceValue, getBalanceColor(projection?.saldoProjetado6Meses ?? saldo)]}>
              R$ {formatCurrency(projection?.saldoProjetado6Meses ?? saldo)}
            </Text>
          </View>

          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Saldo projetado 12 meses</Text>
            <Text style={[styles.balanceValue, getBalanceColor(projection?.saldoProjetado12Meses ?? saldo)]}>
              R$ {formatCurrency(projection?.saldoProjetado12Meses ?? saldo)}
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${progressValue}%` },
                getRiskColor(riskLevel),
              ]}
            />
          </View>
        </View>

        <View style={styles.timelineSection}>
          <Text style={styles.timelineTitle}>Linha do tempo futura</Text>
          <Pressable
            style={styles.timelineToggleButton}
            onPress={() => setShowTimelineDetails((current) => !current)}
          >
            <Text style={styles.timelineToggleButtonText}>
              {showTimelineDetails ? 'Ocultar detalhes da linha do tempo' : 'Ver detalhes da linha do tempo'}
            </Text>
          </Pressable>

          {showTimelineDetails ? (
            <View style={styles.timelineList}>
              {(projection?.projecaoMensal ?? []).slice(0, 6).map((item) => (
                <View key={item.mes} style={styles.timelineRow}>
                  <Text style={styles.timelineMonth}>Mes {item.mes}</Text>
                  <Text style={[styles.timelineValue, getBalanceColor(item.saldo)]}>
                    R$ {formatCurrency(item.saldo)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.recommendationsSection}>
          <Text style={styles.recommendationsTitle}>Resumo</Text>
          <View style={styles.recommendationsList}>
            {(isLoading || isDashboardLoading
              ? ['Calculando previsao financeira...']
              : recommendations
            ).map((rec, index) => (
              <View key={`${rec}-${index}`} style={styles.recommendationItem}>
                <Text style={styles.bullet}>-</Text>
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
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 24,
    margin: 8,
    borderWidth: 1,
    borderColor: 'rgba(186, 201, 213, 0.6)',
    shadowColor: '#10233f',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  cardHeader: {
    padding: 24,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#dbe5ec',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10233f',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7a90',
    lineHeight: 20,
  },
  cardContent: {
    padding: 24,
    paddingTop: 18,
  },
  riskContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  riskLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#24364d',
  },
  riskBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  riskBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  highRisk: {
    backgroundColor: '#dc2626',
  },
  mediumRisk: {
    backgroundColor: '#f59e0b',
  },
  lowRisk: {
    backgroundColor: '#16a34a',
  },
  defaultRisk: {
    backgroundColor: '#f5f5f5',
  },
  alert: {
    backgroundColor: '#fff4f2',
    borderWidth: 1,
    borderColor: '#ffd8d2',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  alertText: {
    fontSize: 14,
    color: '#b42318',
    lineHeight: 20,
  },
  alertBold: {
    fontWeight: 'bold',
  },
  infoAlert: {
    backgroundColor: '#f2f8fc',
    borderWidth: 1,
    borderColor: '#d7e7f1',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
  },
  infoAlertText: {
    fontSize: 14,
    color: '#35506b',
    lineHeight: 20,
  },
  metricsGrid: {
    gap: 12,
    marginBottom: 22,
  },
  metricCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#f8fbfd',
    borderWidth: 1,
    borderColor: '#dbe5ec',
    gap: 6,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6b7a90',
  },
  metricValue: {
    fontSize: 19,
    fontWeight: '700',
  },
  balanceSection: {
    marginBottom: 22,
    gap: 12,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#5f7086',
    flex: 1,
  },
  balanceValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  positiveBalance: {
    color: '#16a34a',
  },
  negativeBalance: {
    color: '#dc2626',
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#e8eef3',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 999,
  },
  timelineSection: {
    gap: 12,
    marginBottom: 22,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10233f',
  },
  timelineToggleButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#d7e2ea',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  timelineToggleButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10233f',
  },
  timelineList: {
    gap: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#fbfdfe',
    borderWidth: 1,
    borderColor: '#dbe5ec',
  },
  timelineMonth: {
    fontSize: 14,
    color: '#41566f',
  },
  timelineValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  recommendationsSection: {
    gap: 12,
  },
  recommendationsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10233f',
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
    color: '#10233f',
    lineHeight: 20,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#5f7086',
    lineHeight: 20,
  },
});
