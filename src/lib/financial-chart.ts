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
  investmentYield: number;
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

const toMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

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
    .filter(
      (transaction): transaction is NonNullable<typeof transaction> =>
        transaction !== null,
    );

  if (parsedTransactions.length === 0) {
    return [];
  }

  const explicitStart = options.startDate
    ? createStartOfDay(options.startDate)
    : null;

  const explicitEnd = options.endDate
  ? new Date(
      options.endDate.getFullYear(),
      options.endDate.getMonth(),
      options.endDate.getDate(),
      23,
      59,
      59,
      999
    )
  : null;

  const minDate = parsedTransactions.reduce(
    (currentMin, transaction) =>
      transaction.parsedDate.getTime() < currentMin.getTime()
        ? transaction.parsedDate
        : currentMin,
    parsedTransactions[0].parsedDate,
  );

  const maxDate = parsedTransactions.reduce(
    (currentMax, transaction) =>
      transaction.parsedDate.getTime() > currentMax.getTime()
        ? transaction.parsedDate
        : currentMax,
    parsedTransactions[0].parsedDate,
  );

 const startDateRaw = explicitStart ?? minDate;
const endDateRaw = explicitEnd ?? maxDate;
const monthDifference =
  (endDateRaw.getFullYear() - startDateRaw.getFullYear()) * 12 +
  (endDateRaw.getMonth() - startDateRaw.getMonth());

const useMonthlyView = monthDifference >= 1;

const startDate = useMonthlyView
  ? new Date(startDateRaw.getFullYear(), startDateRaw.getMonth(), 1)
  : startDateRaw;

const endDate = useMonthlyView
  ? new Date(endDateRaw.getFullYear(), endDateRaw.getMonth() + 1, 0)
  : endDateRaw;

if (startDate.getTime() > endDate.getTime()) {
  return [];
}

 

  const groupedTotals = parsedTransactions.reduce((acc, transaction) => {
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

    const key = useMonthlyView
      ? toMonthKey(transaction.parsedDate)
      : toDateKey(transaction.parsedDate);

    const entry = acc.get(key) ?? {
      income: 0,
      expense: 0,
      investment: 0,
      investmentYield: 0,
    };

    entry[bucket] += transaction.amount;

    acc.set(key, entry);

    return acc;
  }, new Map<string, DailyFinancialTotals>());

  const result: CumulativeFinanceChartPoint[] = [];

  let income = 0;
  let expense = 0;
  let investment = 0;
  let investmentYield = 0;

 if (useMonthlyView) {
  const startMonth =
    startDate.getFullYear() * 12 + startDate.getMonth();

  const endMonth =
    endDate.getFullYear() * 12 + endDate.getMonth();

  for (let monthIndex = startMonth; monthIndex <= endMonth; monthIndex++) {
    const year = Math.floor(monthIndex / 12);
    const month = monthIndex % 12;

    const currentDate = new Date(year, month, 1);

    const currentKey = toMonthKey(currentDate);

    const entry = groupedTotals.get(currentKey);

    if (entry) {
      income += entry.income;
      expense += entry.expense;
      investment += entry.investment;
      investmentYield += entry.investmentYield;
    }

  result.push({
  date: currentKey,
  income,
  expense,
  investment,
  investmentYield,
  balance: income + investmentYield - expense - investment,
});
  }
} else {
  let currentDate = new Date(startDate);

  while (currentDate.getTime() <= endDate.getTime()) {
    const currentPointDate = new Date(currentDate);

    const currentKey = toDateKey(currentPointDate);

    const entry = groupedTotals.get(currentKey);

    if (entry) {
      income += entry.income;
      expense += entry.expense;
      investment += entry.investment;
      investmentYield += entry.investmentYield;
    }

    result.push({
      date: currentKey,
      income,
      expense,
      investment,
      investmentYield,
      balance: income + investmentYield - expense - investment,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }
}

  return result;
};
