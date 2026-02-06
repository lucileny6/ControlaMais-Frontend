import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardTransaction } from "@/lib/types";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface RecentTransactionsProps {
  transactions: DashboardTransaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card>
      {/* 🔹 TÍTULO FIXO (como Ações Rápidas) */}
      <CardHeader>
        <CardTitle>Transações Recentes</CardTitle>
      </CardHeader>

      <CardContent>
        {/* 🔹 ESTADO VAZIO */}
        {!transactions || transactions.length === 0 ? (
          <Text style={styles.empty}>Nenhuma transação recente</Text>
        ) : (
          <View style={styles.list}>
            {transactions.map((transaction) => (
              <View key={transaction.id} style={styles.row}>
                <View>
                  <Text style={styles.description}>
                    {transaction.description}
                  </Text>
                  <Text style={styles.category}>
                    {transaction.category}
                  </Text>
                </View>

                <Text
                  style={
                    transaction.type === "income"
                      ? styles.income
                      : styles.expense
                  }
                >
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
  list: {
    gap: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  description: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  category: {
    fontSize: 12,
    color: "#6b7280",
  },
  income: {
    color: "#10b981",
    fontWeight: "bold",
  },
  expense: {
    color: "#ef4444",
    fontWeight: "bold",
  },
  empty: {
    textAlign: "center",
    color: "#9ca3af",
    paddingVertical: 16,
  },
});
