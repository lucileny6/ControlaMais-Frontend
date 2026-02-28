import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

interface FinancialOverviewProps {
  saldo: number | string;
  totalReceitas: number | string;
  totalDespesas: number | string;
  loading?: boolean;
}

export function FinancialOverview({
  saldo,
  totalReceitas,
  totalDespesas,
  loading = false,
}: FinancialOverviewProps) {
  const toMoneyNumber = (value: number | string | null | undefined) => {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value !== "string") return 0;

    const cleaned = value.trim().replace(/[^\d,.-]/g, "");
    if (!cleaned) return 0;

    const commas = (cleaned.match(/,/g) || []).length;
    const dots = (cleaned.match(/\./g) || []).length;

    if (commas > 1 && dots === 0) {
      const normalized = cleaned.replace(/,/g, "");
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
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

    if (cleaned.includes(",")) {
      const normalized = cleaned.replace(",", ".");
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const { width } = useWindowDimensions();
  const stacked = width < 1180;

  if (loading) {
    return (
      <View style={styles.grid}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} style={[styles.card, stacked ? styles.cardStacked : styles.cardDesktop]}>
            <CardHeader>
              <View style={[styles.skeleton, { width: 80 }]} />
            </CardHeader>
            <CardContent>
              <View style={[styles.skeleton, { width: 96, height: 32, marginBottom: 8 }]} />
              <View style={[styles.skeleton, { width: 128 }]} />
            </CardContent>
          </Card>
        ))}
      </View>
    );
  }

  const income = toMoneyNumber(totalReceitas);
  const expenses = toMoneyNumber(totalDespesas);
  const balance = toMoneyNumber(saldo);
  const expensePercentage = income > 0 ? (expenses / income) * 100 : 0;

  return (
    <View style={styles.grid}>
      <Card style={[styles.card, stacked ? styles.cardStacked : styles.cardDesktop]}>
        <CardHeader>
          <CardTitle style={styles.cardTitleStyle}>Saldo Total</CardTitle>
        </CardHeader>
        <CardContent>
          <Text style={styles.amountPrimary}>
            {balance.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </Text>
        </CardContent>
      </Card>

      <Card style={[styles.card, stacked ? styles.cardStacked : styles.cardDesktop]}>
        <CardHeader>
          <CardTitle style={styles.cardTitleStyle}>Receitas</CardTitle>
        </CardHeader>
        <CardContent>
          <Text style={styles.amountIncome}>
            {income.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </Text>
          <Text style={styles.subtitle}>Este mes</Text>
        </CardContent>
      </Card>

      <Card style={[styles.card, stacked ? styles.cardStacked : styles.cardDesktop]}>
        <CardHeader>
          <CardTitle style={styles.cardTitleStyle}>Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <Text style={styles.amountExpense}>
            {expenses.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </Text>
          <Text style={styles.progressText}>{expensePercentage.toFixed(1).replace(".", ",")}% da receita</Text>
        </CardContent>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    marginBottom: 18,
  },
  card: {
    minHeight: 180,
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#dfe3e8",
    elevation: 0,
    shadowOpacity: 0,
    backgroundColor: "#ffffff",
    maxWidth: "100%",
  },
  cardDesktop: {
    flexBasis: "32%",
    flexGrow: 1,
    minWidth: 260,
  },
  cardStacked: {
    flexBasis: "100%",
    minWidth: 0,
  },
  cardTitleStyle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#151A24",
    marginBottom: 6,
  },
  amountPrimary: {
    fontSize: 46,
    fontWeight: "700",
    color: "#2E67C1",
  },
  amountIncome: {
    fontSize: 46,
    fontWeight: "700",
    color: "#198C68",
  },
  amountExpense: {
    fontSize: 46,
    fontWeight: "700",
    color: "#D73B43",
  },
  subtitle: {
    fontSize: 14,
    color: "#4f5561",
    marginTop: 8,
  },
  progressText: {
    fontSize: 14,
    color: "#4f5561",
    marginTop: 8,
  },
  skeleton: {
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    height: 16,
  },
});
