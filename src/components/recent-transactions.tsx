import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFinancialBucket } from "@/lib/investments";
import { parseTransactionDate } from "@/lib/monthly-finance";
import { DashboardTransaction } from "@/lib/types";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

interface RecentTransactionsProps {
  transactions: DashboardTransaction[];
}

const RECENT_LIMIT = 5;

type DisplayVariant = "income" | "expense" | "investment";

type TransactionDisplay = {
  variant: DisplayVariant;
  prefix: "+" | "-";
};

const getTransactionDisplay = (
  transaction: DashboardTransaction,
): TransactionDisplay => {
  const bucket = getFinancialBucket(transaction);

  if (bucket === "investment") {
    return {
      variant: "investment",
      prefix: "-",
    };
  }

  if (bucket === "income" || bucket === "investmentYield") {
    return {
      variant: "income",
      prefix: "+",
    };
  }

  return {
    variant: "expense",
    prefix: "-",
  };
};

const getSortTimestamp = (transaction: DashboardTransaction) =>
  parseTransactionDate(transaction.date)?.getTime() ?? 0;

const formatTransactionDate = (dateString: string) => {
  const parsedDate = parseTransactionDate(dateString);

  if (!parsedDate) {
    return "-";
  }

  return parsedDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getAmountStyle = (variant: DisplayVariant) => {
  switch (variant) {
    case "income":
      return styles.amountIncome;

    case "investment":
      return styles.amountInvestment;

    default:
      return styles.amountExpense;
  }
};

export function RecentTransactions({
  transactions,
}: RecentTransactionsProps) {
  const recentItems = useMemo(() => {
    if (!transactions?.length) {
      return [];
    }

    return [...transactions]
      .sort((a, b) => getSortTimestamp(b) - getSortTimestamp(a))
      .slice(0, RECENT_LIMIT);
  }, [transactions]);

  return (
    <Card maxWidth={0} style={styles.card}>
      <CardHeader>
        <CardTitle style={styles.title}>
          Transacoes Recentes
        </CardTitle>
      </CardHeader>

      <CardContent>
        {recentItems.length === 0 ? (
          <Text style={styles.empty}>
            Nenhuma transacao recente
          </Text>
        ) : (
          <View style={styles.list}>
            {recentItems.map((transaction) => {
              const display = getTransactionDisplay(transaction);

              const description =
                String(transaction.description ?? "").trim() ||
                String(transaction.category ?? "").trim() ||
                "Sem descricao";

              return (
                <View key={transaction.id} style={styles.row}>
                  <View style={styles.mainBlock}>
                    <Text
                      style={styles.description}
                      numberOfLines={2}
                    >
                      {description}
                    </Text>

                    <View style={styles.metaRow}>
                      <Text
                        style={styles.metaText}
                        numberOfLines={1}
                      >
                        {transaction.category || "Sem categoria"}
                      </Text>

                      <Text style={styles.metaText}>
                        {formatTransactionDate(transaction.date)}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.amount,
                      getAmountStyle(display.variant),
                    ]}
                  >
                    {display.prefix} R${" "}
                    {Number(transaction.amount || 0).toLocaleString(
                      "pt-BR",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      },
                    )}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(197, 210, 223, 0.42)",
    backgroundColor: "rgba(255,255,255,0.96)",
    maxWidth: "100%",
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 10,
    },
  },

  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#10233f",
  },

  list: {
    gap: 0,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(203, 213, 225, 0.38)",
  },

  mainBlock: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },

  description: {
    fontSize: 14,
    fontWeight: "700",
    color: "#11243f",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },

  metaText: {
    fontSize: 12,
    color: "#718198",
    fontWeight: "500",
    flexShrink: 1,
  },

  amount: {
    fontWeight: "800",
    fontSize: 14,
    flexShrink: 0,
    textAlign: "right",
  },

  amountIncome: {
    color: "#0d8a67",
  },

  amountExpense: {
    color: "#c44747",
  },

  amountInvestment: {
    color: "#2563eb",
  },

  empty: {
    textAlign: "center",
    color: "#8da0b6",
    paddingVertical: 24,
    fontSize: 13,
  },
});
