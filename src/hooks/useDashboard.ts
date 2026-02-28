import { useEffect, useState } from "react";
import { apiService } from "@/services/api";
import { DashboardTransaction } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

// ================================
// TIPAGEM DO DASHBOARD
// ================================

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

  async function loadDashboard() {
    try {
      setLoading(true);

      const response = await apiService.getDashboard();

      console.log("📦 DASHBOARD RAW DO BACK:", response);

      setData({
        saldo: response.saldo ?? 0,
        totalReceitas: response.totalReceitas ?? 0,
        totalDespesas: response.totalDespesas ?? 0,

        // 🔹 NORMALIZAÇÃO DEFINITIVA
        transacoesRecentes: (response.transacoesRecentes ?? []).map(
          (t: any, index: number): DashboardTransaction => {
            const rawType = String(t?.type ?? t?.tipo ?? "expense").toLowerCase().trim();
            const normalizedType = rawType === "income" || rawType === "icome" || rawType === "receita"
              ? "income"
              : "expense";
            const baseId = String(t?.id ?? t?._id ?? t?.transactionId ?? index);

            return {
              id: `${normalizedType}-${baseId}-${index}`,
              description: t.description ?? t.descricao ?? "",
              category: t.category ?? t.categoria ?? "",
              type: normalizedType,
              amount: Number(t.amount ?? t.valor ?? t.value ?? 0),
              date: t.date ?? t.data ?? "",
            };
          }
        ),
      });
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dashboard",
        description:
          error?.message ?? "Não foi possível buscar os dados do servidor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return {
    saldo: data.saldo,
    totalReceitas: data.totalReceitas,
    totalDespesas: data.totalDespesas,
    transacoesRecentes: data.transacoesRecentes,
    loading,
    reload: loadDashboard,
  };
}
