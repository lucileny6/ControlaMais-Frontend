import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardTransaction } from "@/lib/types";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface RecentTransactionsProps {
  transactions: DashboardTransaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card maxWidth={0} style={styles.card}>
      <CardHeader>
        <CardTitle style={styles.title}>Transacoes Recentes</CardTitle>
      </CardHeader>

      <CardContent>
        {!transactions || transactions.length === 0 ? (
          <Text style={styles.empty}>Nenhuma transacao recente</Text>
        ) : (
          <View style={styles.list}>
            {transactions.slice(0, 5).map((transaction) => (
              <View key={transaction.id} style={styles.row}>
                <View style={styles.leftBlock}>
                  <Text style={styles.description}>{transaction.description}</Text>
                  <Text style={styles.category}>{transaction.category}</Text>
                </View>

                <Text style={transaction.type === "income" ? styles.income : styles.expense}>
                  {Number(transaction.amount || 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </Text>
              </View>
            ))}
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
    shadowOffset: { width: 0, height: 10 },
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
  leftBlock: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  description: {
    fontSize: 14,
    fontWeight: "700",
    color: "#11243f",
    flexShrink: 1,
  },
  category: {
    fontSize: 12,
    color: "#718198",
    fontWeight: "500",
  },
  income: {
    color: "#0d8a67",
    fontWeight: "800",
    fontSize: 14,
    flexShrink: 0,
    textAlign: "right",
  },
  expense: {
    color: "#c44747",
    fontWeight: "800",
    fontSize: 14,
    flexShrink: 0,
    textAlign: "right",
  },
  empty: {
    textAlign: "center",
    color: "#8da0b6",
    paddingVertical: 24,
    fontSize: 13,
  },
});
