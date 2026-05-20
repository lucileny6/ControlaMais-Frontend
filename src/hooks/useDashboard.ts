import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { toast } from "@/hooks/use-toast";
import {
  calculateMonthlyFinancialTotals,
} from "@/lib/investments";
import {
  buildMonthlyFinanceSnapshot,
  normalizeDashboardTransaction,
  parseTransactionDate,

} from "@/lib/monthly-finance";
import { DashboardTransaction } from "@/lib/types";
import { apiService } from "@/services/api";

type DashboardData = {
  saldo: number;
  totalReceitas: number;
  totalDespesas: number;
  totalInvestimentos: number;
  transacoesRecentes: DashboardTransaction[];
};

export function useDashboard() {
  const [data, setData] = useState<DashboardData>({
    saldo: 0,
    totalReceitas: 0,
    totalDespesas: 0,
    totalInvestimentos: 0,
    transacoesRecentes: [],
  });

  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);

      const [dashboardResponse, transactionsResponse] = await Promise.all([
        apiService.getDashboard(),
        apiService
          .getTransactions({
            preserveSessionOnAuthError: true,
          })
          .catch(() => []),
      ]);

      const transactionsPayload = transactionsResponse.length
        ? transactionsResponse
        : dashboardResponse.transacoesRecentes ?? [];

      const normalizedAll = (transactionsPayload ?? []).map(
        (transaction: any, index: number) =>
          normalizeDashboardTransaction(transaction, index),
      );

      const snapshot = buildMonthlyFinanceSnapshot(normalizedAll);
      const { totalExpense, totalInvestment, balance } =
        calculateMonthlyFinancialTotals(snapshot.transactions);

      setData({
        saldo: balance,
        totalReceitas: snapshot.totalIncome,
        totalDespesas: totalExpense,
        totalInvestimentos: totalInvestment,
        transacoesRecentes: normalizedAll
  .filter((t) => {
    const parsed =
      parseTransactionDate(t.date);

    if (!parsed) {
      return false;
    }

    const now = new Date();

    return (
      parsed.getMonth() === now.getMonth() &&
      parsed.getFullYear() === now.getFullYear()
    );
  })

  .sort((a, b) => {
    const aTime =
      parseTransactionDate(a.date)?.getTime() ?? 0;

    const bTime =
      parseTransactionDate(b.date)?.getTime() ?? 0;

    return bTime - aTime;
  })

  .slice(0, 5),
      });
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dashboard",
        description:
          error?.message ?? "Nao foi possivel buscar os dados do servidor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  return {
    saldo: data.saldo,
    totalReceitas: data.totalReceitas,
    totalDespesas: data.totalDespesas,
    totalInvestimentos: data.totalInvestimentos,
    transacoesRecentes: data.transacoesRecentes,
    loading,
    reload: loadDashboard,
  };
}
