import {
  calculateMonthlyFinancialTotals,
  isInvestmentTransaction,
  isInvestmentYieldCategory,
} from "@/lib/investments";
import { DashboardTransaction, TransactionType } from "@/lib/types";

export type MonthlyFinanceSnapshot = {
  monthDate: Date;
  transactions: DashboardTransaction[];
  totalIncome: number;
  totalExpenses: number;
  totalInvestments: number;
  totalInvestmentYield: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
  topExpenseCategory: { category: string; amount: number } | null;
  recentTransactions: DashboardTransaction[];
};

export type CurrentMonthFinanceIntent =
  | "balance"
  | "income"
  | "expenses"
  | "top_expense"
  | "summary";

export const parseTransactionDate = (value: unknown): Date | null => {
  const raw = String(value ?? "").trim();

  if (!raw) return null;

  const isoPattern = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/;
  const brSlashPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const brDashPattern = /^(\d{2})-(\d{2})-(\d{4})$/;
  const monthYearPattern = /^(\d{2})-(\d{4})$/;
  const isoMonthPattern = /^(\d{4})-(\d{2})$/;

  let parsed: Date;

  if (isoPattern.test(raw)) {
    const [, year, month, day] = raw.match(isoPattern)!;

    parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );
  } else if (brSlashPattern.test(raw)) {
    const [, day, month, year] = raw.match(brSlashPattern)!;

    parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );
  } else if (brDashPattern.test(raw)) {
    const [, day, month, year] = raw.match(brDashPattern)!;

    parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );
  } else if (monthYearPattern.test(raw)) {
    const [, month, year] = raw.match(monthYearPattern)!;

    parsed = new Date(
      Number(year),
      Number(month) - 1,
      1
    );
  } else if (isoMonthPattern.test(raw)) {
    const [, year, month] = raw.match(isoMonthPattern)!;

    parsed = new Date(
      Number(year),
      Number(month) - 1,
      1
    );
  } else {
    // IMPORTANTE:
    // removido o new Date(raw)
    // porque ele interpretava datas brasileiras errado
    return null;
  }

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const parseTransactionCreatedAt = (value: unknown): Date | null => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return parseTransactionDate(raw);
  }

  return parsed;
};

export const normalizeDashboardTransaction = (transaction: any, index: number): DashboardTransaction => {
  const rawType = String(
    transaction?.type ??
      transaction?.tipo ??
      transaction?.tipoTransacao ??
      transaction?.tipoLancamento ??
      transaction?.transactionType ??
      transaction?.natureza ??
      "expense",
  ).toLowerCase().trim();
  const normalizedType: TransactionType =
    rawType === "income" ||
    rawType === "icome" ||
    rawType === "receita" ||
    rawType === "entrada" ||
    isInvestmentYieldCategory(rawType)
      ? "income"
      : "expense";
  const rawAmount = parseMonetaryValue(
    transaction?.amount ??
      transaction?.valor ??
      transaction?.value ??
      transaction?.preco ??
      transaction?.valorTransacao ??
      transaction?.valorLancamento ??
      transaction?.valorEstimado ??
      0,
  );
  const amount = Number.isFinite(rawAmount) ? rawAmount : 0;
  const baseId = String(
    transaction?.id ??
      transaction?._id ??
      transaction?.transactionId ??
      transaction?.transacaoId ??
      transaction?.acaoFinanceiraId ??
      transaction?.idAcaoFinanceira ??
      index,
  );

  const category = String(
    transaction?.category ??
      transaction?.categoria ??
      transaction?.grupo ??
      transaction?.classificacao ??
      (isInvestmentYieldCategory(rawType) ? "Rendimento de Investimento" : "Sem categoria"),
  );
  const createdAt = String(
    transaction?.createdAt ??
      transaction?.created_at ??
      transaction?.criadoEm ??
      transaction?.dataCriacao ??
      "",
  );

  return {
    id: `${normalizedType}-${baseId}-${index}`,
    description: String(
      transaction?.description ??
        transaction?.descricao ??
        transaction?.titulo ??
        transaction?.nome ??
        transaction?.mensagem ??
        transaction?.texto ??
        "",
    ),
    category,
    type: normalizedType,
    amount,
    date: String(
  transaction?.data ??
    transaction?.date ??
    transaction?.dataTransacao ??
    transaction?.dataLancamento ??
    transaction?.dataDespesa ??
    transaction?.dataReceita ??
    "",
),
    createdAt,
  };
};

function parseMonetaryValue(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== "string") {
    return 0;
  }

  const cleaned = value.trim().replace(/[^\d,.-]/g, "");
  if (!cleaned) {
    return 0;
  }

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

  const parsed = Number(cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export const buildMonthlyFinanceSnapshot = (
  transactions: DashboardTransaction[],
  referenceDate: Date = new Date(),
): MonthlyFinanceSnapshot => {
  
  const month = referenceDate.getMonth();
  const year = referenceDate.getFullYear();

  const monthTransactions = transactions.filter((transaction) => {
    const parsedDate = parseTransactionDate(transaction.date);
    if (!parsedDate) return false;
    return parsedDate.getMonth() === month && parsedDate.getFullYear() === year;
  });

  const totals = calculateMonthlyFinancialTotals(monthTransactions);
  const totalIncome = totals.totalIncome;
  const totalExpenses = totals.totalExpense;
  const totalInvestments = totals.totalInvestment;
  const totalInvestmentYield = totals.totalInvestmentYield;
  const balance = totals.balance;

  const gastoPercentual =
  totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

  console.log("Income:", totalIncome);
  console.log("Expenses:", totalExpenses);
  console.log("Percentual:", gastoPercentual);

  const expenseTotalsByCategory = monthTransactions
    .filter((transaction) => transaction.type === "expense" && !isInvestmentTransaction(transaction))
    .reduce((acc, transaction) => {
      const category = transaction.category || "Sem categoria";
      acc.set(category, (acc.get(category) ?? 0) + transaction.amount);
      return acc;
    }, new Map<string, number>());

  const topExpenseCategory = [...expenseTotalsByCategory.entries()]
    .sort((a, b) => b[1] - a[1])[0];

  const recentTransactions = [...transactions]
    .sort((a, b) => {
      const aTime = (parseTransactionCreatedAt(a.createdAt) ?? parseTransactionDate(a.date))?.getTime() ?? 0;
      const bTime = (parseTransactionCreatedAt(b.createdAt) ?? parseTransactionDate(b.date))?.getTime() ?? 0;
      return bTime - aTime;
    })
    .slice(0, 10);

  return {
    monthDate: new Date(year, month, 1),
    transactions: monthTransactions,
    totalIncome,
    totalExpenses,
    totalInvestments,
    totalInvestmentYield,
    balance,
    incomeCount: monthTransactions.filter(
      (transaction) => transaction.type === "income" && !isInvestmentYieldCategory(transaction.category),
    ).length,
    expenseCount: monthTransactions.filter(
      (transaction) => transaction.type === "expense" && !isInvestmentTransaction(transaction),
    ).length,
    topExpenseCategory: topExpenseCategory
      ? { category: topExpenseCategory[0], amount: topExpenseCategory[1] }
      : null,
    recentTransactions,
  };
};

const normalizeFinanceMessage = (message: string) =>
  message
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const hasCurrentPeriodReference = (normalized: string) =>
  ["mes", "mes atual", "esse mes", "este mes", "atual", "agora", "hoje"].some((keyword) =>
    normalized.includes(keyword),
  );

const hasNonCurrentPeriodReference = (normalized: string) =>
  [
    "ontem",
    "amanha",
    "semana passada",
    "mes passado",
    "mes anterior",
    "ultimo mes",
    "ano passado",
    "ano anterior",
    "proximo mes",
    "proxima semana",
  ].some((keyword) => normalized.includes(keyword));

export const detectCurrentMonthFinanceIntent = (
  message: string,
): CurrentMonthFinanceIntent | null => {
  const normalized = message
    ? normalizeFinanceMessage(message)
    : "";
  const mentionsCurrentPeriod = hasCurrentPeriodReference(normalized);
  const mentionsOtherPeriod = hasNonCurrentPeriodReference(normalized);

  const asksSummary = ["resumo", "fechamento", "analise", "analisa", "analisar", "visao geral"].some((keyword) =>
    normalized.includes(keyword),
  );

  const asksTopExpense = [
    "o que mais pesou",
    "qual categoria mais pesou",
    "qual foi a categoria que mais pesou",
    "onde gastei mais",
    "qual gasto pesou mais",
    "maior gasto",
    "categoria dominante",
  ].some((keyword) => normalized.includes(keyword));

  const asksBalance = ["saldo", "sobrou", "restou", "fechei", "fechamento"].some((keyword) =>
    normalized.includes(keyword),
  );

  const asksIncome = [
    "receita",
    "receitas",
    "recebi",
    "receber",
    "ganhei",
    "entrou",
    "entrada",
    "entradas",
  ].some((keyword) => normalized.includes(keyword));

  const asksExpenses = [
    "despesa",
    "despesas",
    "gasto",
    "gastos",
    "gastei",
    "gastamos",
    "paguei",
    "pagar",
    "saida",
    "saidas",
    "saiu",
    "desembolsei",
  ].some((keyword) => normalized.includes(keyword));

  const hasCurrentMonthIntent = asksSummary || asksTopExpense || asksBalance || asksIncome || asksExpenses;
  if (!hasCurrentMonthIntent) return null;
  if (mentionsOtherPeriod && !mentionsCurrentPeriod) return null;

  if (asksSummary) return "summary";
  if (asksTopExpense) return "top_expense";
  if (asksBalance) return "balance";
  if (asksIncome) return "income";
  if (asksExpenses) return "expenses";

  return null;
};

export const isCurrentMonthFinanceQuestion = (message: string) =>
  detectCurrentMonthFinanceIntent(message) !== null;
