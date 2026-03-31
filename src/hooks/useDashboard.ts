import { useCallback, useState } from "react";
import { apiService } from "@/services/api";
import { DashboardTransaction } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { useFocusEffect } from "@react-navigation/native";
import {
  buildMonthlyFinanceSnapshot,
  normalizeDashboardTransaction,
} from "@/lib/monthly-finance";

type DashboardData = {
  saldo: number;
  totalReceitas: number;
  totalDespesas: number;
  transacoesRecentes: DashboardTransaction[];
};

export function useDashboard() {
  const [data, setData] = useState<DashboardData>({
    saldo: 0,
    totalReceitas: 0,
    totalDespesas: 0,
    transacoesRecentes: [],
  });

  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);

      const [dashboardResponse, transactionsResponse] = await Promise.all([
        apiService.getDashboard(),
        apiService.getTransactions().catch(() => []),
      ]);

      const normalizedAll = (transactionsResponse ?? []).map((transaction: any, index: number) =>
        normalizeDashboardTransaction(transaction, index),
      );
      const normalizedRecent = (dashboardResponse.transacoesRecentes ?? []).map((transaction: any, index: number) =>
        normalizeDashboardTransaction(transaction, index),
      );

      const sourceForMonth = normalizedAll.length > 0 ? normalizedAll : normalizedRecent;
      const snapshot = buildMonthlyFinanceSnapshot(sourceForMonth);

      setData({
        saldo: snapshot.balance,
        totalReceitas: snapshot.totalIncome,
        totalDespesas: snapshot.totalExpenses,
        transacoesRecentes: snapshot.recentTransactions,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dashboard",
        description: error?.message ?? "Nao foi possivel buscar os dados do servidor",
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
    transacoesRecentes: data.transacoesRecentes,
    loading,
    reload: loadDashboard,
  };
}
