import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";

interface FinancialOverviewProps {
  saldo: number | string;
  totalReceitas: number | string;
  totalDespesas: number | string;
  totalInvestimentos: number | string;
  loading?: boolean;
}

export function FinancialOverview({
  saldo,
  totalReceitas,
  totalDespesas,
  totalInvestimentos,
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
  const gridStyle = stacked ? styles.gridStacked : styles.gridDesktop;
  const cardStyle = stacked ? styles.cardStacked : styles.cardDesktop;

  if (loading) {
    return (
      <View style={[styles.grid, gridStyle]}>
        {[...Array(4)].map((_, i) => (
          <Card key={i} maxWidth={0} style={[styles.card, cardStyle]}>
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
  const investments = toMoneyNumber(totalInvestimentos);
  const balance = toMoneyNumber(saldo);
  const expensePercentage = income > 0 ? (expenses / income) * 100 : 0;

  return (
    <View style={[styles.grid, gridStyle]}>
      <Card maxWidth={0} style={[styles.card, cardStyle]}>
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

      <Card maxWidth={0} style={[styles.card, cardStyle]}>
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

      <Card maxWidth={0} style={[styles.card, cardStyle]}>
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

      <Card maxWidth={0} style={[styles.card, cardStyle]}>
        <CardHeader>
          <CardTitle style={styles.cardTitleStyle}>Investimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Text style={styles.amountInvestment}>
            {investments.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </Text>
          <Text style={styles.subtitle}>Aportes no mes</Text>
        </CardContent>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  gridDesktop: {
    flexWrap: "nowrap",
  },
  gridStacked: {
    flexWrap: "wrap",
  },
  card: {
    minHeight: 148,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(197, 210, 223, 0.42)",
    elevation: 0,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    backgroundColor: "rgba(255,255,255,0.96)",
    maxWidth: "100%",
  },
  cardDesktop: {
    flex: 1,
    minWidth: 0,
  },
  cardStacked: {
    flexBasis: "100%",
    minWidth: 0,
  },
  cardTitleStyle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7a90",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  amountPrimary: {
    fontSize: 30,
    fontWeight: "800",
    color: "#10233f",
    letterSpacing: -0.6,
  },
  amountIncome: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0d8a67",
    letterSpacing: -0.6,
  },
  amountExpense: {
    fontSize: 30,
    fontWeight: "800",
    color: "#c44747",
    letterSpacing: -0.6,
  },
  amountInvestment: {
    fontSize: 30,
    fontWeight: "800",
    color: "#2563eb",
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 12,
    color: "#748398",
    marginTop: 10,
    fontWeight: "600",
  },
  progressText: {
    fontSize: 12,
    color: "#748398",
    marginTop: 10,
    fontWeight: "600",
  },
  skeleton: {
    backgroundColor: "#e2e8f0",
    borderRadius: 8,
    height: 16,
  },
});
