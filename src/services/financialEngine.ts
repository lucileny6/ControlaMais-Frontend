export type FinancialTransactionType = "receita" | "despesa";

export interface FinancialEngineTransaction {
  id: string;
  descricao: string;
  valor: number;
  tipo: FinancialTransactionType;
  recorrente?: boolean;
  date?: string;
  data?: string;
}

export interface FinancialProjectionMonth {
  monthKey: string;
  label: string;
  receitas: number;
  despesas: number;
  saldoLiquido: number;
  saldoProjetado: number;
  somenteRecorrentes: boolean;
  transacoes: FinancialEngineTransaction[];
}

export interface FinancialProjectionResult {
  saldoInicial: number;
  saldoFinalProjetado: number;
  mediaReceitasRecorrentes: number;
  mediaDespesasRecorrentes: number;
  fluxoMensal: FinancialProjectionMonth[];
}

export interface FinancialMonthlyFlowSummary {
  receitas: number;
  despesas: number;
  fluxoMensal: number;
}

export interface MonthlyBalanceProjectionPoint {
  mes: number;
  saldo: number;
}

export interface FinancialProjectionOptions {
  saldoInicial?: number;
  mesesProjetados?: number;
  dataReferencia?: Date;
}

type SupportedTransaction = Partial<FinancialEngineTransaction> & {
  id?: string | number;
  descricao?: string;
  description?: string;
  valor?: number | string;
  amount?: number | string;
  tipo?: FinancialTransactionType | "income" | "expense";
  type?: "income" | "expense" | FinancialTransactionType;
  recorrente?: boolean;
  recurring?: boolean;
  isRecurring?: boolean;
  recorrencia?: boolean;
  date?: string;
  data?: string;
};

const DEFAULT_PROJECTION_MONTHS = 6;
const MONTH_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  year: "numeric",
});

export function normalizeFinancialTransaction(
  transaction: SupportedTransaction,
  index = 0,
): FinancialEngineTransaction {
  const rawType = String(transaction.tipo ?? transaction.type ?? "despesa").trim().toLowerCase();
  const tipo: FinancialTransactionType =
    rawType === "receita" || rawType === "income" ? "receita" : "despesa";

  return {
    id: String(transaction.id ?? `tx-${index}`),
    descricao: String(transaction.descricao ?? transaction.description ?? "").trim(),
    valor: toNumber(transaction.valor ?? transaction.amount ?? 0),
    tipo,
    recorrente: Boolean(
      transaction.recorrente ?? transaction.recurring ?? transaction.isRecurring ?? transaction.recorrencia,
    ),
    date: transaction.date,
    data: transaction.data,
  };
}

export function calculateMonthlyCashFlow(
  transactions: SupportedTransaction[],
  options: FinancialProjectionOptions = {},
): FinancialProjectionMonth[] {
  const saldoInicial = options.saldoInicial ?? 0;
  const mesesProjetados = Math.max(1, options.mesesProjetados ?? DEFAULT_PROJECTION_MONTHS);
  const dataReferencia = stripTime(options.dataReferencia ?? new Date());
  const normalizedTransactions = transactions.map((transaction, index) =>
    normalizeFinancialTransaction(transaction, index),
  );

  const monthMap = new Map<string, FinancialProjectionMonth>();
  let saldoProjetado = saldoInicial;

  for (let offset = 0; offset < mesesProjetados; offset += 1) {
    const currentMonthDate = startOfMonth(addMonths(dataReferencia, offset));
    const monthKey = getMonthKey(currentMonthDate);
    const isReferenceMonth = offset === 0;

    const monthTransactions = normalizedTransactions.filter((transaction) =>
      shouldIncludeTransactionInMonth(transaction, currentMonthDate, isReferenceMonth),
    );

    const receitas = sumByType(monthTransactions, "receita");
    const despesas = sumByType(monthTransactions, "despesa");
    const saldoLiquido = receitas - despesas;
    saldoProjetado += saldoLiquido;

    monthMap.set(monthKey, {
      monthKey,
      label: formatMonthLabel(currentMonthDate),
      receitas,
      despesas,
      saldoLiquido,
      saldoProjetado,
      somenteRecorrentes: !isReferenceMonth,
      transacoes: monthTransactions,
    });
  }

  return Array.from(monthMap.values());
}

export function projectCashFlow(
  transactions: SupportedTransaction[],
  options: FinancialProjectionOptions = {},
): FinancialProjectionResult {
  const fluxoMensal = calculateMonthlyCashFlow(transactions, options);
  const monthBase = fluxoMensal[0];

  return {
    saldoInicial: options.saldoInicial ?? 0,
    saldoFinalProjetado: fluxoMensal.at(-1)?.saldoProjetado ?? options.saldoInicial ?? 0,
    mediaReceitasRecorrentes: monthBase?.receitas ?? 0,
    mediaDespesasRecorrentes: monthBase?.despesas ?? 0,
    fluxoMensal,
  };
}

export function calcularFluxoMensal(
  transacoes: SupportedTransaction[],
): FinancialMonthlyFlowSummary {
  const [monthBase] = calculateMonthlyCashFlow(transacoes, { saldoInicial: 0, mesesProjetados: 1 });
  const receitas = monthBase?.receitas ?? 0;
  const despesas = monthBase?.despesas ?? 0;

  return {
    receitas,
    despesas,
    fluxoMensal: receitas - despesas,
  };
}

export function projetarSaldo(
  saldoAtual: number,
  fluxoMensal: number,
  meses: number,
) {
  return saldoAtual + fluxoMensal * meses;
}

export function gerarProjecaoMensal(
  saldoAtual: number,
  fluxoMensal: number,
  meses: number,
): MonthlyBalanceProjectionPoint[] {
  const projecao: MonthlyBalanceProjectionPoint[] = [];
  let saldo = saldoAtual;

  for (let i = 1; i <= meses; i += 1) {
    saldo += fluxoMensal;

    projecao.push({
      mes: i,
      saldo,
    });
  }

  return projecao;
}

function shouldIncludeTransactionInMonth(
  transaction: FinancialEngineTransaction,
  monthDate: Date,
  isReferenceMonth: boolean,
) {
  const transactionDate = getTransactionDate(transaction);

  if (transaction.recorrente) {
    if (!transactionDate) return isReferenceMonth;
    return isSameMonth(transactionDate, monthDate);
  }

  if (!isReferenceMonth) return false;

  if (!transactionDate) return true;

  return isSameMonth(transactionDate, monthDate);
}

function getTransactionDate(transaction: FinancialEngineTransaction) {
  const rawDate = transaction.date ?? transaction.data;
  if (!rawDate) return null;

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return stripTime(parsed);
}

function sumByType(
  transactions: FinancialEngineTransaction[],
  tipo: FinancialTransactionType,
) {
  return transactions
    .filter((transaction) => transaction.tipo === tipo)
    .reduce((total, transaction) => total + transaction.valor, 0);
}

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== "string") return 0;

  const cleaned = value.trim().replace(/[^\d,.-]/g, "");
  if (!cleaned) return 0;

  if (cleaned.includes(",") && cleaned.includes(".")) {
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    const normalized =
      lastComma > lastDot
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned.replace(/,/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function stripTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function getMonthKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

function formatMonthLabel(date: Date) {
  const formatted = MONTH_FORMATTER.format(date).replace(".", "");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
