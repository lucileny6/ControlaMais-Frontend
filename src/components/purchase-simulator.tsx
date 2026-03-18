import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { toast } from '@/hooks/use-toast';
import { useDashboard } from '@/hooks/useDashboard';
import { apiService } from '@/services/api';
import { normalizeFinancialTransaction } from '@/services/financialEngine';

const WEBHOOK_URL =
  process.env.EXPO_PUBLIC_PURCHASE_SIMULATOR_WEBHOOK_URL ??
  process.env.EXPO_PUBLIC_N8N_WEBHOOK_URL ??
  'http://localhost:5678/webhook/c4e4305b-1390-4c54-99de-71bc6c3b73b3';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export function PurchaseSimulator() {
  const { saldo, loading: isDashboardLoading } = useDashboard();
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [purchaseDescription, setPurchaseDescription] = useState('');
  const [installments, setInstallments] = useState('1');
  const [result, setResult] = useState<JsonValue | null>(null);
  const [showResultDetails, setShowResultDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const parsedPurchaseAmount = useMemo(() => parseCurrencyInput(purchaseAmount), [purchaseAmount]);
  const parsedInstallments = useMemo(() => parseMonthsInput(installments), [installments]);
  const newBalance = parsedPurchaseAmount > 0 ? saldo - parsedPurchaseAmount : saldo;
  const canSimulate =
    parsedPurchaseAmount > 0 &&
    parsedInstallments > 0 &&
    !isLoading &&
    !isDashboardLoading;

  const simulatePurchase = async () => {
    if (parsedPurchaseAmount <= 0) {
      toast({
        title: 'Valor invalido',
        description: 'Informe um valor de compra maior que zero.',
        variant: 'destructive',
      });
      return;
    }

    if (parsedInstallments <= 0) {
      toast({
        title: 'Parcelas invalidas',
        description: 'Informe uma quantidade de parcelas maior que zero.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      setResult(null);
      setShowResultDetails(false);
      const projecaoMensal = await buildProjectionPayload(parsedInstallments);

      const payload = {
        descricao_compra: purchaseDescription.trim() || 'Compra simulada',
        valor_compra: parsedPurchaseAmount,
        parcelas: parsedInstallments,
        meses_simulacao: parsedInstallments,
        saldo,
        Saldo: saldo,
        saldo_atual: saldo,
        saldo_apos_compra: newBalance,
        projecao_mensal: projecaoMensal,
        saldos_mensais: projecaoMensal.map((mes) => mes.saldo_base),
      };

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      const parsedResponse = responseText ? safeParseJson(responseText) : null;

      if (!response.ok) {
        throw new Error(extractErrorMessage(parsedResponse, response.status));
      }

      setResult(parsedResponse ?? { mensagem: 'Webhook respondeu sem corpo.' });
    } catch (error: any) {
      toast({
        title: 'Erro ao simular compra',
        description: error?.message ?? 'Nao foi possivel consultar o workflow do n8n.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetSimulation = () => {
    setPurchaseAmount('');
    setPurchaseDescription('');
    setInstallments('1');
    setResult(null);
    setShowResultDetails(false);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Simulador de Compras</Text>
        <Text style={styles.cardDescription}>
          Envie os dados da compra para o workflow do n8n e veja a simulacao retornada
        </Text>
      </View>

      <ScrollView style={styles.cardContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Descricao da compra</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Notebook, Geladeira, Viagem..."
              value={purchaseDescription}
              onChangeText={setPurchaseDescription}
              returnKeyType="done"
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
              returnKeyType="done"
              placeholderTextColor="#999999"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Parcelas</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              value={installments}
              onChangeText={(value) => setInstallments(value.replace(/\D/g, ''))}
              keyboardType="numeric"
              returnKeyType="done"
              placeholderTextColor="#999999"
            />
          </View>

        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[
              styles.simulateButton,
              !canSimulate && styles.simulateButtonDisabled,
            ]}
            onPress={simulatePurchase}
            disabled={!canSimulate}
          >
            <Text style={styles.simulateButtonText}>
              {isLoading ? 'Simulando...' : 'Simular Compra'}
            </Text>
          </TouchableOpacity>

          {result && (
            <TouchableOpacity style={styles.resetButton} onPress={resetSimulation}>
              <Text style={styles.resetButtonText}>Nova Simulacao</Text>
            </TouchableOpacity>
          )}
        </View>

        {result && (
          <View style={styles.resultContainer}>
            <View style={[styles.alert, styles.positiveAlert]}>
              <Text style={styles.alertTitle}>Resultado do workflow</Text>
              <Text style={styles.alertText}>Resumo da resposta retornada pelo n8n.</Text>
            </View>

            <View style={styles.responseContainer}>
              {renderWorkflowResult(result)}
            </View>

            {hasWorkflowSimulation(result) && (
              <>
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => setShowResultDetails((current) => !current)}
                >
                  <Text style={styles.detailsButtonText}>
                    {showResultDetails ? 'Ocultar detalhes do calculo' : 'Ver detalhes do calculo'}
                  </Text>
                </TouchableOpacity>

                {showResultDetails ? renderWorkflowSimulationDetails(result) : null}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function parseCurrencyInput(value: string) {
  const normalized = value.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function buildProjectionPayload(months: number) {
  const transactionsResponse = await apiService.getTransactions().catch(() => []);
  const recurringTransactions = (transactionsResponse ?? [])
    .map((transaction: any, index: number) =>
      normalizeFinancialTransaction(
        {
          id: transaction?.id ?? transaction?._id ?? transaction?.transactionId ?? index,
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
    )
    .filter((transaction) => transaction.recorrente);

  const firstMonth = startOfMonth(addMonths(new Date(), 1));

  return Array.from({ length: months }, (_, index) => {
    const monthDate = addMonths(firstMonth, index);
    const monthTransactions = recurringTransactions.filter((transaction) => {
      const transactionDate = getTransactionMonth(transaction);
      return transactionDate ? isSameMonth(transactionDate, monthDate) : false;
    });

    const receitas = monthTransactions
      .filter((transaction) => transaction.tipo === 'receita')
      .reduce((total, transaction) => total + transaction.valor, 0);
    const despesas = monthTransactions
      .filter((transaction) => transaction.tipo === 'despesa')
      .reduce((total, transaction) => total + transaction.valor, 0);

    return {
      mes: index + 1,
      referencia: formatMonthReference(monthDate),
      receitas: roundCurrency(receitas),
      despesas: roundCurrency(despesas),
      saldo_base: roundCurrency(receitas - despesas),
    };
  });
}

function parseMonthsInput(value: string) {
  const normalized = value.replace(/\D/g, '');
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeParseJson(value: string): JsonValue {
  try {
    return JSON.parse(value) as JsonValue;
  } catch {
    return value;
  }
}

function isJsonPrimitive(value: JsonValue): value is JsonPrimitive {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

function extractErrorMessage(payload: JsonValue, status: number) {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const candidate = payload.message ?? payload.error ?? payload.mensagem;
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }

  return `O webhook respondeu com erro ${status}.`;
}

function renderJsonValue(value: JsonValue, label?: string): React.ReactNode {
  if (Array.isArray(value)) {
    return (
      <View style={styles.jsonSection}>
        {label ? <Text style={styles.jsonLabel}>{formatJsonKey(label)}</Text> : null}
        {value.length === 0 ? (
          <Text style={styles.jsonPrimitive}>[]</Text>
        ) : (
          value.map((item, index) => (
            <View key={`${label ?? 'item'}-${index}`} style={styles.jsonNestedBlock}>
              {renderJsonValue(item, `Item ${index + 1}`)}
            </View>
          ))
        )}
      </View>
    );
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value);

    return (
      <View style={styles.jsonSection}>
        {label ? <Text style={styles.jsonLabel}>{formatJsonKey(label)}</Text> : null}
        {entries.map(([entryKey, entryValue]) => {
          if (isJsonPrimitive(entryValue)) {
            return (
              <View key={entryKey} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{formatJsonKey(entryKey)}</Text>
                <Text style={styles.detailValue}>{formatPrimitive(entryValue)}</Text>
              </View>
            );
          }

          return (
            <View key={entryKey} style={styles.jsonNestedBlock}>
              {renderJsonValue(entryValue, entryKey)}
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.jsonSection}>
      {label ? <Text style={styles.jsonLabel}>{formatJsonKey(label)}</Text> : null}
      <Text style={styles.jsonPrimitive}>{formatPrimitive(value)}</Text>
    </View>
  );
}

function renderWorkflowResult(value: JsonValue): React.ReactNode {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return renderJsonValue(value);
  }

  const record = value as Record<string, JsonValue>;
  const preferredFields = [
    'valor_compra',
    'meses',
    'valor_parcela',
    'saldo_inicial',
    'status_final',
    'impacto',
    'recomendacao',
    'mensagem',
  ];

  const summaryEntries: [string, JsonPrimitive][] = [];

  preferredFields.forEach((field) => {
    const entryValue = record[field];
    if (isJsonPrimitive(entryValue)) {
      summaryEntries.push([field, entryValue] as const);
    }
  });

  if (summaryEntries.length === 0) {
    return renderJsonValue(value);
  }

  return (
    <View style={styles.jsonSection}>
      {summaryEntries.map(([entryKey, entryValue]) => (
        <View key={entryKey} style={styles.detailRow}>
          <Text style={styles.detailLabel}>{formatJsonKey(entryKey)}</Text>
          <Text style={styles.detailValue}>{formatPrimitive(entryValue)}</Text>
        </View>
      ))}
    </View>
  );
}

function hasWorkflowSimulation(value: JsonValue) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const simulation = (value as Record<string, JsonValue>).simulacao;
  return Array.isArray(simulation) && simulation.length > 0;
}

function renderWorkflowSimulationDetails(value: JsonValue): React.ReactNode {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const simulation = (value as Record<string, JsonValue>).simulacao;
  if (!Array.isArray(simulation) || simulation.length === 0) {
    return null;
  }

  return (
    <View style={styles.detailsContainer}>
      <Text style={styles.detailsTitle}>Detalhes do calculo</Text>
      {simulation.map((item, index) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return null;
        }

        const record = item as Record<string, JsonValue>;
        const fields = [
          ['mes', record.mes],
          ['referencia', record.referencia],
          ['receitas', record.receitas],
          ['despesas', record.despesas],
          ['saldo_base', record.saldo_base],
          ['parcela', record.parcela],
          ['saldo_final', record.saldo_final],
          ['status', record.status],
        ].filter((entry): entry is [string, JsonPrimitive] => isJsonPrimitive(entry[1]));

        return (
          <View key={`simulation-${index}`} style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Mes {index + 1}</Text>
            {fields.map(([entryKey, entryValue]) => (
              <View key={entryKey} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{formatJsonKey(entryKey)}</Text>
                <Text style={styles.detailValue}>{formatPrimitive(entryValue)}</Text>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

function formatPrimitive(value: JsonPrimitive) {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  return value;
}

function formatJsonKey(key: string) {
  return key.replace(/_/g, ' ');
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

function getTransactionMonth(transaction: ReturnType<typeof normalizeFinancialTransaction>) {
  const rawDate = transaction.date ?? transaction.data;
  if (!rawDate) return null;

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return null;

  return startOfMonth(parsed);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function isSameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function formatMonthReference(date: Date) {
  return date.toLocaleDateString('pt-BR', {
    month: 'short',
    year: 'numeric',
  }).replace('.', '');
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
    paddingBottom: 16,
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
  formContainer: {
    gap: 14,
    marginBottom: 18,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#24364d',
  },
  input: {
    backgroundColor: '#f8fbfd',
    borderWidth: 1,
    borderColor: '#d7e2ea',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#10233f',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  simulateButton: {
    flex: 1,
    backgroundColor: '#10233f',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10233f',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 3,
  },
  simulateButtonDisabled: {
    backgroundColor: '#c7d2dd',
  },
  simulateButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d7e2ea',
  },
  resetButtonText: {
    color: '#5f7086',
    fontSize: 15,
    fontWeight: '600',
  },
  resultContainer: {
    gap: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#dbe5ec',
  },
  alert: {
    backgroundColor: '#f7fafc',
    padding: 14,
    borderRadius: 16,
    borderLeftWidth: 4,
  },
  positiveAlert: {
    borderLeftColor: '#16a34a',
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10233f',
    marginBottom: 4,
  },
  alertText: {
    fontSize: 13,
    color: '#5f7086',
    lineHeight: 19,
  },
  responseContainer: {
    gap: 10,
    padding: 14,
    backgroundColor: '#f8fbfd',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dde7ee',
  },
  jsonSection: {
    gap: 8,
  },
  jsonLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10233f',
    textTransform: 'capitalize',
  },
  jsonNestedBlock: {
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#d7e2ea',
  },
  jsonPrimitive: {
    fontSize: 13,
    color: '#516275',
    lineHeight: 19,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 2,
  },
  detailLabel: {
    flex: 1,
    fontSize: 13,
    color: '#506174',
    textTransform: 'capitalize',
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: '#10233f',
    fontWeight: '700',
    textAlign: 'right',
  },
  detailsButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#d7e2ea',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  detailsButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10233f',
  },
  detailsContainer: {
    gap: 10,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10233f',
  },
  detailCard: {
    gap: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dde7ee',
  },
  detailCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10233f',
  },
});
