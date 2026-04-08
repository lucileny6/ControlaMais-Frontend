import { getFinancialBucket } from "@/lib/investments";
import { parseTransactionDate } from "@/lib/monthly-finance";

type ChartLikeTransaction = {
  date?: string;
  type?: string;
  category?: unknown;
  amount?: number | string;
};

export type CumulativeFinanceChartPoint = {
  date: string;
  income: number;
  expense: number;
  investment: number;
  balance: number;
};

type BuildCumulativeFinanceChartDataOptions = {
  startDate?: Date;
  endDate?: Date;
};

type DailyFinancialTotals = Omit<CumulativeFinanceChartPoint, "date" | "balance">;

const createStartOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const buildCumulativeFinanceChartData = (
  transactions: ChartLikeTransaction[],
  options: BuildCumulativeFinanceChartDataOptions = {},
): CumulativeFinanceChartPoint[] => {
  const parsedTransactions = transactions
    .map((transaction) => {
      const parsedDate = parseTransactionDate(transaction.date);
      if (!parsedDate) return null;

      const amount = Number(transaction.amount ?? 0);
      const safeAmount = Number.isFinite(amount) ? amount : 0;

      return {
        ...transaction,
        amount: safeAmount,
        parsedDate: createStartOfDay(parsedDate),
      };
    })
    .filter((transaction): transaction is NonNullable<typeof transaction> => transaction !== null);

  if (parsedTransactions.length === 0) {
    return [];
  }

  const explicitStart = options.startDate ? createStartOfDay(options.startDate) : null;
  const explicitEnd = options.endDate ? createStartOfDay(options.endDate) : null;

  const minDate = parsedTransactions.reduce(
    (currentMin, transaction) =>
      transaction.parsedDate.getTime() < currentMin.getTime() ? transaction.parsedDate : currentMin,
    parsedTransactions[0].parsedDate,
  );
  const maxDate = parsedTransactions.reduce(
    (currentMax, transaction) =>
      transaction.parsedDate.getTime() > currentMax.getTime() ? transaction.parsedDate : currentMax,
    parsedTransactions[0].parsedDate,
  );

  const startDate = explicitStart ?? minDate;
  const endDate = explicitEnd ?? maxDate;

  if (startDate.getTime() > endDate.getTime()) {
    return [];
  }

  const dailyTotals = parsedTransactions.reduce((acc, transaction) => {
    if (
      transaction.parsedDate.getTime() < startDate.getTime() ||
      transaction.parsedDate.getTime() > endDate.getTime()
    ) {
      return acc;
    }

    const bucket = getFinancialBucket(transaction);
    if (!bucket) {
      return acc;
    }

    const key = toDateKey(transaction.parsedDate);
    const entry = acc.get(key) ?? { income: 0, expense: 0, investment: 0 };
    entry[bucket] += transaction.amount;
    acc.set(key, entry);
    return acc;
  }, new Map<string, DailyFinancialTotals>());

  const result: CumulativeFinanceChartPoint[] = [];
  let income = 0;
  let expense = 0;
  let investment = 0;

  for (
    let currentDate = new Date(startDate);
    currentDate.getTime() <= endDate.getTime();
    currentDate.setDate(currentDate.getDate() + 1)
  ) {
    const currentDay = new Date(currentDate);
    const entry = dailyTotals.get(toDateKey(currentDay));

    if (entry) {
      income += entry.income;
      expense += entry.expense;
      investment += entry.investment;
    }

    result.push({
      date: toDateKey(currentDay),
      income,
      expense,
      investment,
      balance: income - expense - investment,
    });
  }

  return result;
};
