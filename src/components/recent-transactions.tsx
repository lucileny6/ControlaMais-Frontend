import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardTransaction } from "@/lib/types";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface RecentTransactionsProps {
  transactions: DashboardTransaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card style={styles.card}>
      <CardHeader>
        <CardTitle style={styles.title}>Transacoes Recentes</CardTitle>
      </CardHeader>

      <CardContent>
        {!transactions || transactions.length === 0 ? (
          <Text style={styles.empty}>Nenhuma transacao recente</Text>
        ) : (
          <View style={styles.list}>
            {transactions.map((transaction) => (
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#dfe3e8",
    backgroundColor: "#ffffff",
    maxWidth: "100%",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#141820",
  },
  list: {
    gap: 0,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#eceff3",
  },
  leftBlock: {
    gap: 4,
    paddingRight: 14,
  },
  description: {
    fontSize: 16,
    fontWeight: "600",
    color: "#101722",
  },
  category: {
    fontSize: 12,
    color: "#676f7d",
  },
  income: {
    color: "#198C68",
    fontWeight: "700",
    fontSize: 16,
  },
  expense: {
    color: "#D73B43",
    fontWeight: "700",
    fontSize: 16,
  },
  empty: {
    textAlign: "center",
    color: "#9ca3af",
    paddingVertical: 16,
    fontSize: 14,
  },
});
