import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { apiService } from "../services/api";

interface FinancialData {
  balance: number;
  income: number;
  expenses: number;
}

export function FinancialOverview() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const dashboard = await apiService.getDashboard();
        console.log("Dashboard recebido:", dashboard);


        setData({
          balance: dashboard.saldo ?? 0,

          income: dashboard.totalReceitas ?? 0,
          expenses: dashboard.totalDespesas ?? 0,
        });
      } catch (error) {
        console.error("Erro ao carregar dashboard", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // 🔹 Skeleton enquanto carrega
  if (loading) {
    return (
      <View style={styles.grid}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} style={styles.card}>
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

  // 🔹 Proteção extra (nunca renderiza se não houver dados)
  if (!data) {
    return null;
  }

  const income = data.income ?? 0;
  const expenses = data.expenses ?? 0;
  const balance = data.balance ?? 0;

  const expensePercentage =
    income > 0 ? (expenses / income) * 100 : 0;

  return (
    <View style={styles.grid}>
      <Card style={styles.card} maxWidth={600}>
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

      <Card style={styles.card} maxWidth={600}>
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

          <Text style={styles.subtitle}>Este mês</Text>
        </CardContent>
      </Card>

      <Card style={styles.card} maxWidth={600}>
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

          <Text style={styles.progressText}>
            {expensePercentage.toFixed(1)}% da receita
          </Text>
        </CardContent>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 24,
    padding: 16,
  },
  card: {
    flex: 1,
    minWidth: 160,
    minHeight: 140,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  cardTitleStyle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  amountPrimary: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  amountIncome: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10b981',
  },
  amountExpense: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  progressText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  skeleton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    height: 16,
  },
});
