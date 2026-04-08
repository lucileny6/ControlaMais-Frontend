import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Polygon, Polyline, Rect, Text as SvgText } from 'react-native-svg';

import { toast } from '@/hooks/use-toast';
import { useDashboard } from '@/hooks/useDashboard';
import { apiService } from '@/services/api';
import { calculateMonthlyCashFlow, normalizeFinancialTransaction } from '@/services/financialEngine';

const WEBHOOK_URL =
  process.env.EXPO_PUBLIC_PURCHASE_SIMULATOR_WEBHOOK_URL ??
  process.env.EXPO_PUBLIC_N8N_WEBHOOK_URL ??
  'http://localhost:5678/webhook/c4e4305b-1390-4c54-99de-71bc6c3b73b3';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export function PurchaseSimulator() {
  const router = useRouter();
  const { saldo, loading: isDashboardLoading } = useDashboard();
  const { width } = useWindowDimensions();
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [purchaseDescription, setPurchaseDescription] = useState('');
  const [installments, setInstallments] = useState('1');
  const [result, setResult] = useState<JsonValue | null>(null);
  const [showResultDetails, setShowResultDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const parsedPurchaseAmount = useMemo(() => parseCurrencyInput(purchaseAmount), [purchaseAmount]);
  const parsedInstallments = useMemo(() => parseMonthsInput(installments), [installments]);
  const newBalance = parsedPurchaseAmount > 0 ? saldo - parsedPurchaseAmount : saldo;
  const chartWidth = Math.max(280, Math.min(width - 96, 720));
  const canSimulate =
    parsedPurchaseAmount > 0 &&
    parsedInstallments > 0 &&
    !isLoading &&
    !isDashboardLoading;
  const recommendationText = useMemo(() => extractWorkflowTextField(result, ['recomendacao', 'mensagem', 'status_final']), [result]);
  const impactText = useMemo(() => extractWorkflowTextField(result, ['impacto']), [result]);
  const isHighImpact = useMemo(() => detectHighImpact(result), [result]);
  const isPurchaseViable = useMemo(() => detectViablePurchase(result), [result]);
  const plannedInstallmentAmount = useMemo(() => extractWorkflowNumberField(result, ['valor_parcela', 'parcela']), [result]);

  const handleCreateGoal = () => {
    const amountToUse = parsedPurchaseAmount > 0 ? parsedPurchaseAmount : plannedInstallmentAmount ?? 0;

    router.push({
      pathname: '/(tabs)/transactions',
      params: {
        new: '1',
        type: 'expense',
        source: 'goal',
        category: 'Investimento',
        description: 'Meta criada após simulação',
        ...(amountToUse > 0 ? { amount: amountToUse.toFixed(2) } : {}),
      },
    } as any);
  };

  const handleCreatePurchase = () => {
    const amountToUse = plannedInstallmentAmount ?? parsedPurchaseAmount;

    router.push({
      pathname: '/(tabs)/transactions',
      params: {
        new: '1',
        type: 'expense',
        description: 'Compra planejada',
        ...(amountToUse > 0 ? { amount: amountToUse.toFixed(2) } : {}),
      },
    } as any);
  };

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
      const projecaoMensal = await buildProjectedCashFlowPayload(parsedInstallments, saldo);

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
      console.log('[PurchaseSimulator] webhook payload:', payload);

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      const parsedResponse = responseText ? safeParseJson(responseText) : null;
      console.log('[PurchaseSimulator] webhook response:', {
        status: response.status,
        ok: response.ok,
        body: parsedResponse ?? responseText,
      });

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

            {recommendationText ? (
              <View style={styles.recommendationContainer}>
                <Text style={styles.recommendationLabel}>Recomendação</Text>
                <Text style={styles.recommendationValue}>{recommendationText}</Text>
                {impactText ? <Text style={styles.recommendationHint}>{`Impacto: ${impactText}`}</Text> : null}

                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity style={styles.secondaryActionButton} onPress={handleCreateGoal}>
                    <Text style={styles.secondaryActionButtonText}>🎯 Criar Meta</Text>
                  </TouchableOpacity>

                  {isPurchaseViable && !isHighImpact ? (
                    <TouchableOpacity style={styles.primaryActionButton} onPress={handleCreatePurchase}>
                      <Text style={styles.primaryActionButtonText}>Comprar</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ) : null}

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

                {showResultDetails ? renderWorkflowSimulationDetails(result, chartWidth) : null}
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

// Legacy helper kept temporarily while the simulator migrates to the current-month payload.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function buildProjectionPayload(months: number) {
  const transactionsResponse = await apiService.getTransactions().catch(() => []);

  const transactions = (transactionsResponse ?? []).map((transaction: any, index: number) =>
    normalizeFinancialTransaction(
      {
        id: transaction?.id ?? transaction?._id ?? index,
        descricao: transaction?.descricao ?? transaction?.description,
        valor: transaction?.valor ?? transaction?.amount ?? transaction?.value ?? 0,
        tipo: transaction?.tipo ?? transaction?.type,
        data: transaction?.data ?? transaction?.date,
        date: transaction?.date ?? transaction?.data,
      },
      index,
    )
  );
  // 🔥 COLOCA AQUI
console.log("TODAS TRANSAÇÕES:", transactions);

transactions.forEach(t => {
  if (t.tipo === "despesa") {
    console.log("DESPESA:", t.descricao, t.valor, t.date || t.data);
  }
});

  //  pega data atual
  const hoje = new Date();

  //  função para verificar se é do mês atual
  const isMesmoMes = (data: any) => {
    const d = new Date(data);
    return (
      d.getMonth() === hoje.getMonth() &&
      d.getFullYear() === hoje.getFullYear()
    );
  };

  // RECEITAS DO MÊS ATUAL
  const receitasMes = transactions
    .filter((t) => t.tipo === "receita" && t.recorrente === true)
    .reduce((total, t) => total + Number(t.valor || 0), 0);

  //  DESPESAS DO MÊS ATUAL
  const despesasMes = transactions
    .filter((t) => t.tipo === "despesa" && t.recorrente === true)
    .reduce((total, t) => total + Number(t.valor || 0), 0);

  //  MONTA A PROJEÇÃO (repete o mês atual para os próximos)
  return Array.from({ length: months }, (_, index) => ({
    mes: index + 1,
    referencia: `Mes ${index + 1}`,
    receitas: roundCurrency(receitasMes),
    despesas: roundCurrency(despesasMes),
    saldo_base: roundCurrency(receitasMes - despesasMes),
  }));
}

function parseMonthsInput(value: string) {
  const normalized = value.replace(/\D/g, '');
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function buildProjectedCashFlowPayload(months: number, saldoAtual: number) {
  const transactionsResponse = await apiService.getTransactions().catch(() => []);
  const nextMonthReference = new Date();
  nextMonthReference.setDate(1);
  nextMonthReference.setMonth(nextMonthReference.getMonth() + 1);

  const fluxoMensal = calculateMonthlyCashFlow((transactionsResponse ?? []) as any[], {
    saldoInicial: saldoAtual,
    mesesProjetados: months,
    dataReferencia: nextMonthReference,
  });

  console.log(
    '[PurchaseSimulator] projected monthly cash flow:',
    fluxoMensal.map((mes, index) => ({
      mes: index + 1,
      referencia: mes.label,
      receitas: mes.receitas,
      despesas: mes.despesas,
      saldoLiquido: mes.saldoLiquido,
      saldoProjetado: mes.saldoProjetado,
      transacoes: mes.transacoes.map((transaction) => ({
        descricao: transaction.descricao,
        tipo: transaction.tipo,
        valor: transaction.valor,
        data: transaction.date ?? transaction.data,
        recorrente: transaction.recorrente,
      })),
    })),
  );

  return fluxoMensal.map((mes, index) => ({
    mes: index + 1,
    referencia: mes.label,
    receitas: roundCurrency(mes.receitas),
    despesas: roundCurrency(mes.despesas),
    saldo_base: roundCurrency(mes.saldoLiquido),
    saldo_final: roundCurrency(mes.saldoProjetado),
  }));
}

async function buildProjectionPayloadCurrentMonth(months: number) {
  const transactionsResponse = await apiService.getTransactions().catch(() => []);

  const transactions = (transactionsResponse ?? []).map((transaction: any, index: number) =>
    normalizeFinancialTransaction(
      {
        id: transaction?.id ?? transaction?._id ?? index,
        descricao: transaction?.descricao ?? transaction?.description,
        valor: transaction?.valor ?? transaction?.amount ?? transaction?.value ?? 0,
        tipo: transaction?.tipo ?? transaction?.type,
        data: transaction?.data ?? transaction?.date,
        date: transaction?.date ?? transaction?.data,
      },
      index,
    ),
  );

  const hoje = new Date();

  const isMesmoMes = (data: unknown) => {
    const parsedDate = new Date(String(data ?? ''));
    if (Number.isNaN(parsedDate.getTime())) {
      return false;
    }

    return parsedDate.getMonth() === hoje.getMonth() && parsedDate.getFullYear() === hoje.getFullYear();
  };

  const recurringTransactions = transactions.filter(
    (transaction) => transaction.recorrente === true && isMesmoMes(transaction.date ?? transaction.data),
  );

  const receitasMes = recurringTransactions
    .filter((transaction) => transaction.tipo === 'receita')
    .reduce((total, transaction) => total + Number(transaction.valor || 0), 0);

  const despesasMes = recurringTransactions
    .filter((transaction) => transaction.tipo === 'despesa')
    .reduce((total, transaction) => total + Number(transaction.valor || 0), 0);

  console.log('[PurchaseSimulator] recurring month base:', {
    referenceMonth: `${String(hoje.getMonth() + 1).padStart(2, '0')}-${hoje.getFullYear()}`,
    receitasMes,
    despesasMes,
    recurringTransactions: recurringTransactions.map((transaction) => ({
      descricao: transaction.descricao,
      tipo: transaction.tipo,
      valor: transaction.valor,
      data: transaction.date ?? transaction.data,
    })),
  });

  return Array.from({ length: months }, (_, index) => ({
    mes: index + 1,
    referencia: `Mes ${index + 1}`,
    receitas: roundCurrency(receitasMes),
    despesas: roundCurrency(despesasMes),
    saldo_base: roundCurrency(receitasMes - despesasMes),
  }));
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

function extractWorkflowTextField(value: JsonValue | null, keys: string[]) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return '';
  }

  const record = value as Record<string, JsonValue>;
  for (const key of keys) {
    const candidate = record[key];
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return '';
}

function extractWorkflowNumberField(value: JsonValue | null, keys: string[]) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, JsonValue>;
  for (const key of keys) {
    const parsed = parseNumberLike(record[key]);
    if (parsed !== undefined) {
      return parsed;
    }
  }

  return undefined;
}

function detectHighImpact(value: JsonValue | null) {
  const impact = extractWorkflowTextField(value, ['impacto', 'recomendacao', 'mensagem', 'status_final'])
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  return impact.includes('impacto alto') || impact.includes('alto impacto') || impact.includes('impacto: alto') || impact === 'alto';
}

function detectViablePurchase(value: JsonValue | null) {
  const content = [
    extractWorkflowTextField(value, ['recomendacao']),
    extractWorkflowTextField(value, ['mensagem']),
    extractWorkflowTextField(value, ['status_final']),
  ]
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (!content.trim()) {
    return false;
  }

  if (content.includes('nao e viavel') || content.includes('nao viavel') || content.includes('inviavel')) {
    return false;
  }

  return (
    content.includes('compra e viavel') ||
    content.includes('a compra e viavel') ||
    content.includes('viavel') ||
    content.includes('aprovada')
  );
}

function hasWorkflowSimulation(value: JsonValue) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const simulation = (value as Record<string, JsonValue>).simulacao;
  return Array.isArray(simulation) && simulation.length > 0;
}

type SimulationPoint = {
  label: string;
  saldoBase?: number;
  parcela?: number;
  saldoFinal?: number;
};

function renderWorkflowSimulationDetails(value: JsonValue, chartWidth: number): React.ReactNode {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const simulation = (value as Record<string, JsonValue>).simulacao;
  if (!Array.isArray(simulation) || simulation.length === 0) {
    return null;
  }

  const series = extractSimulationSeries(simulation);

  return (
    <View style={styles.detailsContainer}>
      <Text style={styles.detailsTitle}>Detalhes do calculo</Text>
      {series.length > 1 ? <SimulationLineChart data={series} width={chartWidth} /> : null}
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

function extractSimulationSeries(simulation: JsonValue[]) {
  return simulation
    .map((item, index): SimulationPoint | null => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null;
      }

      const record = item as Record<string, JsonValue>;
      const label = String(record.referencia ?? record.mes ?? `M${index + 1}`).trim() || `M${index + 1}`;
      const saldoBase = parseNumberLike(record.saldo_base);
      const parcela = parseNumberLike(record.parcela);
      const saldoFinal = parseNumberLike(record.saldo_final);

      if (saldoBase === undefined && parcela === undefined && saldoFinal === undefined) {
        return null;
      }

      return {
        label,
        ...(saldoBase !== undefined ? { saldoBase } : {}),
        ...(parcela !== undefined ? { parcela } : {}),
        ...(saldoFinal !== undefined ? { saldoFinal } : {}),
      };
    })
    .filter((item): item is SimulationPoint => item !== null);
}

function parseNumberLike(value: JsonValue | undefined) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const cleaned = value.trim().replace(/[^\d,.-]/g, '');
  if (!cleaned) return undefined;

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  if (hasComma && hasDot) {
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    const normalized =
      lastComma > lastDot
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.replace(/,/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  if (hasComma) {
    const parsed = Number(cleaned.replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function SimulationLineChart({ data, width }: { data: SimulationPoint[]; width: number }) {
  const [activeIndex, setActiveIndex] = useState(Math.max(0, data.length - 1));
  const chartHeight = 280;
  const paddingTop = 30;
  const paddingRight = 26;
  const paddingBottom = 54;
  const paddingLeft = 54;
  const plotWidth = Math.max(width - paddingLeft - paddingRight, 140);
  const plotHeight = Math.max(chartHeight - paddingTop - paddingBottom, 140);

  const values = data.flatMap((point) =>
    [point.saldoBase, point.parcela, point.saldoFinal].filter((value): value is number => value !== undefined),
  );

  if (values.length === 0) {
    return null;
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const span = maxValue - minValue || 1;
  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0;
  const safeActiveIndex = Math.min(activeIndex, data.length - 1);
  const activePoint = data[safeActiveIndex];

  const getY = (value: number) => paddingTop + ((maxValue - value) / span) * plotHeight;
  const getX = (index: number) => paddingLeft + stepX * index;

  const series = [
    { key: 'saldoBase', label: 'Saldo Base', color: '#3b82f6', strokeWidth: 2, opacity: 0.95 },
    { key: 'parcela', label: 'Parcela', color: '#f97316', strokeWidth: 2, opacity: 0.6, dash: '5 5' },
    { key: 'saldoFinal', label: 'Saldo Final', color: '#16a34a', strokeWidth: 3, opacity: 1 },
  ] as const;

  const saldoFinalAreaPoints = data
    .map((point, index) => {
      if (point.saldoFinal === undefined) return null;
      return `${getX(index)},${getY(point.saldoFinal)}`;
    })
    .filter((item): item is string => Boolean(item));

  const areaBaseY = paddingTop + plotHeight;
  const saldoFinalArea = saldoFinalAreaPoints.length > 1
    ? `${paddingLeft},${areaBaseY} ${saldoFinalAreaPoints.join(' ')} ${paddingLeft + plotWidth},${areaBaseY}`
    : null;

  const activePointX = getX(safeActiveIndex);
  const tooltipWidth = 168;
  const tooltipHeight = 88;
  const tooltipX = Math.min(
    Math.max(activePointX - tooltipWidth / 2, paddingLeft),
    paddingLeft + plotWidth - tooltipWidth,
  );
  const tooltipY = paddingTop - 10;

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Evolucao da simulacao</Text>
      <Text style={styles.chartSubtitle}>Comparativo mensal entre saldo base, parcela e saldo final.</Text>

      <Svg width={width} height={chartHeight}>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = paddingTop + plotHeight * ratio;
          const value = maxValue - span * ratio;
          return (
            <React.Fragment key={`grid-${ratio}`}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={paddingLeft + plotWidth}
                y2={y}
                stroke="#d8e2eb"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <SvgText x={paddingLeft - 8} y={y + 4} fontSize="11" fill="#6b7a90" textAnchor="end">
                {formatCompactCurrency(value)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {data.map((point, index) => (
          <Line
            key={`vertical-${point.label}-${index}`}
            x1={getX(index)}
            y1={paddingTop}
            x2={getX(index)}
            y2={paddingTop + plotHeight}
            stroke="#eef3f7"
            strokeWidth="1"
          />
        ))}

        {saldoFinalArea ? (
          <Polygon
            points={saldoFinalArea}
            fill="#16a34a"
            fillOpacity="0.12"
          />
        ) : null}

        {data.map((point, index) => (
          <SvgText
            key={`label-${point.label}-${index}`}
            x={getX(index)}
            y={chartHeight - 12}
            fontSize="11"
            fill="#6b7a90"
            textAnchor="middle"
          >
            {point.label}
          </SvgText>
        ))}

        {series.map((serie) => {
          const points = data
            .map((point, index) => {
              const value = point[serie.key];
              if (value === undefined) return null;
              return `${getX(index)},${getY(value)}`;
            })
            .filter((item): item is string => Boolean(item));

          if (points.length < 2) {
            return null;
          }

          return (
            <React.Fragment key={serie.key}>
              <Polyline
                points={points.join(' ')}
                fill="none"
                stroke={serie.color}
                strokeWidth={String(serie.strokeWidth)}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={serie.opacity}
                strokeDasharray={serie.dash}
              />
              {data.map((point, index) => {
                const value = point[serie.key];
                if (value === undefined) return null;
                return (
                  <Circle
                    key={`${serie.key}-${point.label}-${index}`}
                    cx={getX(index)}
                    cy={getY(value)}
                    r={serie.key === 'saldoFinal' ? '4.5' : '3.5'}
                    fill={serie.color}
                    stroke="#ffffff"
                    strokeWidth="2"
                    opacity={serie.opacity}
                  />
                );
              })}
            </React.Fragment>
          );
        })}

        {activePoint ? (
          <>
            <Line
              x1={activePointX}
              y1={paddingTop}
              x2={activePointX}
              y2={paddingTop + plotHeight}
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <Rect
              x={tooltipX}
              y={tooltipY}
              rx={14}
              ry={14}
              width={tooltipWidth}
              height={tooltipHeight}
              fill="#0f172a"
              fillOpacity="0.92"
            />
            <SvgText x={tooltipX + 14} y={tooltipY + 22} fontSize="12" fill="#f8fafc" fontWeight="700">
              {`Mês ${safeActiveIndex + 1}`}
            </SvgText>
            <SvgText x={tooltipX + 14} y={tooltipY + 42} fontSize="11" fill="#bfdbfe">
              {`Saldo Base: ${formatCurrencyBRL(activePoint.saldoBase ?? 0)}`}
            </SvgText>
            <SvgText x={tooltipX + 14} y={tooltipY + 58} fontSize="11" fill="#fdba74">
              {`Parcela: ${formatCurrencyBRL(activePoint.parcela ?? 0)}`}
            </SvgText>
            <SvgText x={tooltipX + 14} y={tooltipY + 74} fontSize="11" fill="#86efac">
              {`Saldo Final: ${formatCurrencyBRL(activePoint.saldoFinal ?? 0)}`}
            </SvgText>
          </>
        ) : null}

        {data.map((point, index) => (
          <Circle
            key={`hit-area-${point.label}-${index}`}
            cx={getX(index)}
            cy={paddingTop + plotHeight / 2}
            r="18"
            fill="#ffffff"
            fillOpacity="0.01"
            onPress={() => setActiveIndex(index)}
          />
        ))}
      </Svg>

      <View style={styles.chartLegend}>
        {series.map((serie) => (
          <View key={serie.key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: serie.color }]} />
            <Text style={styles.legendText}>{serie.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.chartHint}>Clique em um mês no gráfico para ver os valores detalhados.</Text>
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

function formatCompactCurrency(value: number) {
  const rounded = Math.round(value);
  return `R$ ${rounded.toLocaleString('pt-BR')}`;
}

function formatCurrencyBRL(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
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
  recommendationContainer: {
    gap: 10,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d7e2ea',
  },
  recommendationLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7a90',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  recommendationValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10233f',
    lineHeight: 22,
  },
  recommendationHint: {
    fontSize: 13,
    color: '#5f7086',
    lineHeight: 19,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2,
  },
  secondaryActionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#c8d6e2',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  primaryActionButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#10233f',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10233f',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 3,
  },
  primaryActionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
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
  chartCard: {
    gap: 8,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#f8fbfd',
    borderWidth: 1,
    borderColor: '#dde7ee',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10233f',
  },
  chartSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: '#5f7086',
  },
  chartLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  legendText: {
    fontSize: 12,
    color: '#506174',
    fontWeight: '600',
  },
  chartHint: {
    fontSize: 12,
    color: '#6b7a90',
    lineHeight: 18,
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
