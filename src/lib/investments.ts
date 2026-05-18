const normalizeInvestmentCategory = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const isInvestmentCategory = (value: unknown) =>
  normalizeInvestmentCategory(value) === "investimento";

export const isInvestmentYieldCategory = (value: unknown) => {
  const normalized = normalizeInvestmentCategory(value)
    .replace(/\./g, "")
    .replace(/\s+/g, " ");

  return (
    normalized === "rendimento de investimento" ||
    normalized === "rendimentos de investimento" ||
    normalized === "rendimento de investimentos" ||
    normalized === "rendimentos de investimentos" ||
    normalized === "rendimento investimento" ||
    normalized === "rendimentos investimento" ||
    normalized === "rendimento invest" ||
    normalized === "rendimentos invest"
  );
};

type InvestmentLikeTransaction = {
  type?: string;
  category?: unknown;
  amount?: number | string;
};

export type MonthlyFinancialTotals = {
  totalIncome: number;
  totalExpense: number;
  totalInvestment: number;
  totalInvestmentYield: number;
  balance: number;
};

export const isInvestmentTransaction = (transaction: InvestmentLikeTransaction) =>
  transaction.type === "expense" && isInvestmentCategory(transaction.category);

export const isInvestmentYieldTransaction = (transaction: InvestmentLikeTransaction) =>
  transaction.type === "income" && isInvestmentYieldCategory(transaction.category);

export type FinancialBucket = "income" | "expense" | "investment" | "investmentYield" | null;

export const getFinancialBucket = (
  transaction: InvestmentLikeTransaction,
): FinancialBucket => {
  if (transaction.type === "income") {
    return isInvestmentYieldTransaction(transaction) ? "investmentYield" : "income";
  }

  if (transaction.type !== "expense") {
    return null;
  }

  return isInvestmentTransaction(transaction) ? "investment" : "expense";
};

export const calculateMonthlyFinancialTotals = (
  transactions: InvestmentLikeTransaction[],
) => {
  const totals = transactions.reduce<MonthlyFinancialTotals>(
    (acc, transaction) => {
      const amount = Number(transaction.amount ?? 0);
      const safeAmount = Number.isFinite(amount) ? amount : 0;

      const bucket = getFinancialBucket(transaction);

      if (bucket === "income") {
        acc.totalIncome += safeAmount;
        return acc;
      }

      if (bucket === "expense") {
        acc.totalExpense += safeAmount;
        return acc;
      }

      if (bucket === "investment") {
        acc.totalInvestment += safeAmount;
        return acc;
      }

      if (bucket === "investmentYield") {
        acc.totalInvestmentYield += safeAmount;
      }

      return acc;
    },
    {
      totalIncome: 0,
      totalExpense: 0,
      totalInvestment: 0,
      totalInvestmentYield: 0,
      balance: 0,
    },
  );

  totals.balance =
    totals.totalIncome + totals.totalInvestmentYield - totals.totalExpense - totals.totalInvestment;
  return totals;
};

export const calculateMonthlyInvestmentsTotal = (
  transactions: InvestmentLikeTransaction[],
) =>
  calculateMonthlyFinancialTotals(transactions).totalInvestment;

export const calculateMonthlyExpensesTotal = (
  transactions: InvestmentLikeTransaction[],
) =>
  calculateMonthlyFinancialTotals(transactions).totalExpense;
