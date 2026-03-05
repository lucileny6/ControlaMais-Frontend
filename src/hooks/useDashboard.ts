import { useEffect, useState } from "react";
import { apiService } from "@/services/api";
import { DashboardTransaction } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

type DashboardData = {
  saldo: number;
  totalReceitas: number;
  totalDespesas: number;
  transacoesRecentes: DashboardTransaction[];
};

const parseTransactionDate = (value: unknown): Date | null => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
  const brSlashPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const brDashPattern = /^(\d{2})-(\d{2})-(\d{4})$/;
  const monthYearPattern = /^(\d{2})-(\d{4})$/;
  const isoMonthPattern = /^(\d{4})-(\d{2})$/;

  let parsed: Date;
  if (isoPattern.test(raw)) {
    const [, year, month, day] = raw.match(isoPattern)!;
    parsed = new Date(Number(year), Number(month) - 1, Number(day));
  } else if (brSlashPattern.test(raw)) {
    const [, day, month, year] = raw.match(brSlashPattern)!;
    parsed = new Date(Number(year), Number(month) - 1, Number(day));
  } else if (brDashPattern.test(raw)) {
    const [, day, month, year] = raw.match(brDashPattern)!;
    parsed = new Date(Number(year), Number(month) - 1, Number(day));
  } else if (monthYearPattern.test(raw)) {
    const [, month, year] = raw.match(monthYearPattern)!;
    parsed = new Date(Number(year), Number(month) - 1, 1);
  } else if (isoMonthPattern.test(raw)) {
    const [, year, month] = raw.match(isoMonthPattern)!;
    parsed = new Date(Number(year), Number(month) - 1, 1);
  } else {
    parsed = new Date(raw);
  }

  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const normalizeTransaction = (t: any, index: number): DashboardTransaction => {
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

      const [dashboardResponse, transactionsResponse] = await Promise.all([
        apiService.getDashboard(),
        apiService.getTransactions().catch(() => []),
      ]);

      const normalizedAll = (transactionsResponse ?? []).map((t: any, index: number) =>
        normalizeTransaction(t, index),
      );
      const normalizedRecent = (dashboardResponse.transacoesRecentes ?? []).map((t: any, index: number) =>
        normalizeTransaction(t, index),
      );

      const sourceForMonth = normalizedAll.length > 0 ? normalizedAll : normalizedRecent;
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthTransactions = sourceForMonth.filter((transaction) => {
        const parsedDate = parseTransactionDate(transaction.date);
        if (!parsedDate) return false;
        return parsedDate.getMonth() === currentMonth && parsedDate.getFullYear() === currentYear;
      });

      const totalReceitas = monthTransactions
        .filter((transaction) => transaction.type === "income")
        .reduce((acc, transaction) => acc + Number(transaction.amount || 0), 0);
      const totalDespesas = monthTransactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((acc, transaction) => acc + Number(transaction.amount || 0), 0);
      const saldo = totalReceitas - totalDespesas;

      const transacoesRecentes = [...monthTransactions]
        .sort((a, b) => {
          const aTime = parseTransactionDate(a.date)?.getTime() ?? 0;
          const bTime = parseTransactionDate(b.date)?.getTime() ?? 0;
          return bTime - aTime;
        })
        .slice(0, 10);

      setData({
        saldo,
        totalReceitas,
        totalDespesas,
        transacoesRecentes,
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
