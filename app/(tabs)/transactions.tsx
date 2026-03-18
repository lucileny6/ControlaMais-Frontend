import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardNav } from "@/components/dashboard-nav";
import TransactionForm, { TransactionFormData } from "@/components/transaction-form";
import { TransactionList } from "@/components/transaction-list";
import { apiService } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Transaction {
  id: string;
  backendId?: string;
  deleteCandidates?: string[];
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  notes?: string;
  recorrente?: boolean;
}

interface ExportRow {
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  notes?: string;
}

interface ExportContext {
  filtered: ExportRow[];
  filterType: "all" | "income" | "expense";
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

const DASHBOARD_GRADIENT = ["#F4F7FB", "#EAF1F8", "#E2ECF6", "#DCE7F4"] as const;
const RECURRING_OCCURRENCES_TOTAL = 12;

export default function TransactionsPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ new?: string | string[]; type?: string | string[]; source?: string | string[] }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [exportContext, setExportContext] = useState<ExportContext>({
    filtered: [],
    filterType: "all",
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [quickActionType, setQuickActionType] = useState<"income" | "expense" | null>(null);
  const [openedFromDashboard, setOpenedFromDashboard] = useState(false);
  const [periodPromptOpen, setPeriodPromptOpen] = useState(false);
  const [monthDraft, setMonthDraft] = useState(`${String(new Date().getMonth() + 1).padStart(2, "0")}-${new Date().getFullYear()}`);
  const [initialPeriod, setInitialPeriod] = useState({ startDate: "", endDate: "" });
  const [periodSyncToken, setPeriodSyncToken] = useState(0);
  const [selectedMonthLabel, setSelectedMonthLabel] = useState("");
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Marco",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const getPeriodFromMonth = (value: string) => {
    const normalized = String(value ?? "").trim();
    const isoMatch = normalized.match(/^(\d{4})-(\d{2})$/);
    const brMatch = normalized.match(/^(\d{2})-(\d{4})$/);
    const match = isoMatch ?? brMatch;
    if (!match) return null;

    const year = isoMatch ? Number(match[1]) : Number(match[2]);
    const month = isoMatch ? Number(match[2]) : Number(match[1]);
    if (month < 1 || month > 12) return null;

    const monthString = String(month).padStart(2, "0");
    const lastDay = new Date(year, month, 0).getDate();

    return {
      startDate: `${year}-${monthString}-01`,
      endDate: `${year}-${monthString}-${String(lastDay).padStart(2, "0")}`,
      label: `${monthNames[month - 1]} ${year}`,
    };
  };

  const resetModalState = () => {
    setModalOpen(false);
    setEditingTransaction(null);
    setQuickActionType(null);
    setOpenedFromDashboard(false);
  };

  const closeModal = () => {
    const shouldReturnDashboard = openedFromDashboard;
    resetModalState();
    if (shouldReturnDashboard) {
      router.replace("/(tabs)/dashboard");
    }
  };

  const modalTitle = editingTransaction
    ? "Editar Transacao"
    : quickActionType === "income"
      ? "Nova Receita"
      : quickActionType === "expense"
        ? "Nova Despesa"
        : "Nova Transacao";
  const pageTitle = selectedMonthLabel ? `Transacoes - ${selectedMonthLabel}` : "Transacoes";

  const openPeriodPrompt = () => {
    const currentMonth = initialPeriod.startDate
      ? `${initialPeriod.startDate.slice(5, 7)}-${initialPeriod.startDate.slice(0, 4)}`
      : `${String(new Date().getMonth() + 1).padStart(2, "0")}-${new Date().getFullYear()}`;
    setMonthDraft(currentMonth);
    setPeriodPromptOpen(true);
  };

  useEffect(() => {
    checkAuthentication();
    loadTransactions();
  }, []);

  useEffect(() => {
    const pickParam = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value) ?? "";
    const shouldOpen = pickParam(params.new) === "1";
    if (!shouldOpen) return;

    const rawType = pickParam(params.type).toLowerCase().trim();
    const normalizedType: "income" | "expense" =
      rawType === "income" || rawType === "receita" ? "income" : "expense";
    const source = pickParam(params.source).toLowerCase().trim();

    setEditingTransaction(null);
    setQuickActionType(normalizedType);
    setOpenedFromDashboard(source === "dashboard");
    setModalOpen(true);
    router.replace("/(tabs)/transactions");
  }, [params.new, params.type, params.source, router]);

  useEffect(() => {
    const pickParam = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value) ?? "";
    const shouldOpenTransactionModal = pickParam(params.new) === "1";
    if (!shouldOpenTransactionModal) {
      setPeriodPromptOpen(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showMessage = (title: string, message: string) => {
  Alert.alert(title, message);
};
  const checkAuthentication = async () => {
    try {
      const [authToken, legacyAuthToken] = await Promise.all([
        AsyncStorage.getItem("authToken"),
        AsyncStorage.getItem("@authToken"),
      ]);
      const token = authToken || legacyAuthToken;

      if (!token) {
        router.replace("/login");
        return;
      }
    } catch (error) {
      console.error("Erro ao verificar autenticacao:", error);
      router.replace("/login");
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await apiService.getTransactions();
      const getMonthKey = (value: unknown) => {
        const raw = String(value ?? "").trim();
        if (!raw) return "sem-data";

        const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
        const brSlashPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const brDashPattern = /^(\d{2})-(\d{2})-(\d{4})$/;

        if (isoPattern.test(raw)) {
          const [, year, month] = raw.match(isoPattern)!;
          return `${year}-${month}`;
        }

        if (brSlashPattern.test(raw) || brDashPattern.test(raw)) {
          const match = raw.match(brSlashPattern) ?? raw.match(brDashPattern);
          return `${match![3]}-${match![2]}`;
        }

        const parsed = new Date(raw);
        if (Number.isNaN(parsed.getTime())) return "data-invalida";
        return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
      };

      const resolveTransactionIds = (item: any, index: number) => {
        const candidates: string[] = [];
        const pushCandidate = (value: unknown) => {
          if (value === null || value === undefined) return;
          const normalized = String(value).trim();
          if (!normalized) return;
          if (!candidates.includes(normalized)) candidates.push(normalized);
        };

        const preferredKeys = [
          "id",
          "_id",
          "Id",
          "ID",
          "transactionId",
          "transacaoId",
          "idTransacao",
          "receitaId",
          "despesaId",
          "id_receita",
          "id_despesa",
          "uuid",
        ];

        for (const key of preferredKeys) {
          pushCandidate(item?.[key]);
        }

        for (const [key, value] of Object.entries(item ?? {})) {
          const normalizedKey = key.toLowerCase();
          const isLikelyId = normalizedKey.includes("id");
          const isForeignId = normalizedKey.includes("user") || normalizedKey.includes("usuario");
          if (!isLikelyId || isForeignId) continue;
          pushCandidate(value);
        }

        pushCandidate(item?.receita?.id);
        pushCandidate(item?.despesa?.id);
        pushCandidate(item?.transacao?.id);

        const fallback = `tx-${index}`;
        if (candidates.length === 0) {
          candidates.push(fallback);
        }

        return {
          primaryId: candidates[0] ?? fallback,
          candidates,
        };
      };

      const normalized = (data ?? []).map((t: any, index: number): Transaction => {
        const ids = resolveTransactionIds(t, index);
        return {
        backendId: ids.primaryId,
        id: "",
        deleteCandidates: ids.candidates,
        description: String(
          t?.description ??
            t?.descricao ??
            t?.nome ??
            t?.titulo ??
            t?.historico ??
            "Sem descricao",
        ),
        amount: Number(t?.amount ?? t?.valor ?? t?.value ?? t?.preco ?? 0),
        type: (() => {
          const rawType = String(t?.type ?? t?.tipo ?? "").toLowerCase().trim();
          if (
            rawType === "income" ||
            rawType === "icome" ||
            rawType === "receita" ||
            rawType === "entrada"
          ) return "income";
          return "expense";
        })(),
        category: String(t?.category ?? t?.categoria ?? "Sem categoria"),
        date: String(
          t?.date ??
            t?.data ??
            t?.dataTransacao ??
            t?.dataDespesa ??
            t?.dataReceita ??
            t?.createdAt ??
            new Date().toISOString(),
        ),
        notes: t?.notes ?? t?.observacao ?? undefined,
        recorrente: Boolean(t?.recorrente ?? t?.recurring ?? t?.isRecurring ?? t?.recorrencia),
      };
    }).map((transaction, index) => ({
        ...transaction,
        id: `${transaction.type}-${transaction.backendId}-${index}`,
      }));

      const monthCounts = normalized.reduce<Record<string, number>>((acc, transaction) => {
        const monthKey = getMonthKey(transaction.date);
        acc[monthKey] = (acc[monthKey] ?? 0) + 1;
        return acc;
      }, {});
      console.log("[Transactions] normalized month counts:", monthCounts);

      setTransactions(normalized);
      return normalized;
    } catch (error: any) {
      setTransactions([]);
      const message = String(error?.message ?? "Nao foi possivel carregar transacoes");
      showMessage("Erro", `Nao foi possivel carregar transacoes: ${message}`);
      return [];
    }
  };

  const handleSubmit = async (data: TransactionFormData) => {
    try {
      setLoading(true);
      let successMessage = "";

      const normalizeDateToIso = (value: string) => {
        const raw = String(value ?? "").trim();
        if (!raw) return new Date().toISOString().split("T")[0];

        const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
        const brSlashPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const brDashPattern = /^(\d{2})-(\d{2})-(\d{4})$/;

        if (isoPattern.test(raw)) return raw;
        if (brSlashPattern.test(raw)) {
          const [, day, month, year] = raw.match(brSlashPattern)!;
          return `${year}-${month}-${day}`;
        }
        if (brDashPattern.test(raw)) {
          const [, day, month, year] = raw.match(brDashPattern)!;
          return `${year}-${month}-${day}`;
        }
        return raw;
      };

      const payload = {
        descricao: data.description,
        valor: data.amount,
        categoria: data.category,
        data: normalizeDateToIso(data.date),
        observacao: data.notes,
        recorrente: data.recorrente,
        recurring: data.recorrente,
      };

      const parseIsoDateParts = (value: string) => {
        const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return null;
        return {
          year: Number(match[1]),
          month: Number(match[2]),
          day: Number(match[3]),
        };
      };

      const addMonthsToIsoDate = (value: string, monthsToAdd: number) => {
        const parts = parseIsoDateParts(value);
        if (!parts) return value;

        const target = new Date(parts.year, parts.month - 1 + monthsToAdd, 1);
        const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
        const safeDay = Math.min(parts.day, lastDay);
        const month = String(target.getMonth() + 1).padStart(2, "0");
        const day = String(safeDay).padStart(2, "0");

        return `${target.getFullYear()}-${month}-${day}`;
      };

      const buildRecurringPayloads = () => {
        const baseDate = payload.data;
        const generated = Array.from({ length: RECURRING_OCCURRENCES_TOTAL }, (_, index) => ({
          ...payload,
          data: addMonthsToIsoDate(baseDate, index),
        }));
        console.log(
          "[Transactions] recurring payload dates:",
          generated.map((item) => item.data),
        );
        return generated;
      };

      const normalizeComparableDate = (value: string) => {
        const raw = String(value ?? "").trim();
        if (!raw) return "";
        const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/;
        const brSlash = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const brDash = /^(\d{2})-(\d{2})-(\d{4})$/;

        if (isoDate.test(raw)) return raw;
        if (brSlash.test(raw)) {
          const [, day, month, year] = raw.match(brSlash)!;
          return `${year}-${month}-${day}`;
        }
        if (brDash.test(raw)) {
          const [, day, month, year] = raw.match(brDash)!;
          return `${year}-${month}-${day}`;
        }

        const parsed = new Date(raw);
        if (Number.isNaN(parsed.getTime())) return "";
        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, "0");
        const day = String(parsed.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const normalizeText = (value: string) => String(value ?? "").trim().toLowerCase();
      const matchesRecurringSeries = (transaction: Transaction) => {
        return (
          transaction.type === data.type &&
          Math.abs(Number(transaction.amount ?? 0) - Number(data.amount ?? 0)) < 0.001 &&
          normalizeText(transaction.description) === normalizeText(data.description) &&
          normalizeText(transaction.category) === normalizeText(data.category)
        );
      };
      const justSavedMatches = (transaction: Transaction) => {
        return (
          matchesRecurringSeries(transaction) &&
          normalizeComparableDate(transaction.date) === payload.data
        );
      };

      if (editingTransaction) {
        let updated = false;
        let lastError: unknown = null;

        for (const candidateId of editingTransaction.deleteCandidates ?? []) {
          try {
            await apiService.updateTransaction(candidateId, {
              ...payload,
              type: data.type,
              tipo: data.type,
            }, editingTransaction.type);
            updated = true;
            break;
          } catch (error) {
            lastError = error;
          }
        }

        if (!updated) {
          throw lastError ?? new Error("Nao foi possivel atualizar a transacao");
        }
        successMessage = "Transacao atualizada com sucesso!";
      } else {
        const payloadsToCreate = data.recorrente ? buildRecurringPayloads() : [payload];
        const createTransaction = (dto: typeof payload) =>
          data.type === "expense"
            ? apiService.createDespesa(dto)
            : apiService.createReceita({
                ...dto,
                categoria: data.category,
              });

        const creationResults = await Promise.allSettled(
          payloadsToCreate.map((item) => createTransaction(item)),
        );

        const failedCreations = creationResults.filter((result) => result.status === "rejected");
        if (failedCreations.length === creationResults.length) {
          const firstError = failedCreations[0] as PromiseRejectedResult;
          throw firstError.reason ?? new Error("Nao foi possivel salvar a transacao recorrente");
        }

        if (failedCreations.length > 0) {
          successMessage = `Foram salvas ${creationResults.length - failedCreations.length} de ${creationResults.length} recorrencias. Verifique os meses restantes.`;
        } else {
          successMessage = data.recorrente
            ? `Transacao recorrente cadastrada para ${RECURRING_OCCURRENCES_TOTAL} meses.`
            : "Transacao cadastrada com sucesso!";
        }
      }

      let latestTransactions = await loadTransactions();

      if (editingTransaction && data.recorrente) {
        const expectedDates = buildRecurringPayloads().map((item) => item.data);
        const matchedDates = latestTransactions
          .filter(matchesRecurringSeries)
          .map((transaction) => normalizeComparableDate(transaction.date))
          .filter(Boolean);

        const missingDates = expectedDates.filter((date) => !matchedDates.includes(date));

        if (missingDates.length > 0) {
          const missingPayloads = buildRecurringPayloads().filter((item) =>
            missingDates.includes(item.data),
          );
          const createTransaction = (dto: typeof payload) =>
            data.type === "expense"
              ? apiService.createDespesa(dto)
              : apiService.createReceita({
                  ...dto,
                  categoria: data.category,
                });

          const creationResults = await Promise.allSettled(
            missingPayloads.map((item) => createTransaction(item)),
          );
          const createdCount = creationResults.filter((result) => result.status === "fulfilled").length;
          const failedCount = creationResults.length - createdCount;

          latestTransactions = await loadTransactions();

          if (createdCount > 0) {
            successMessage = `${successMessage} ${createdCount} recorrencias futuras foram criadas.`;
          }

          if (failedCount > 0) {
            successMessage = `${successMessage} ${failedCount} recorrencias futuras nao puderam ser criadas.`;
          }

          console.log("[Transactions] edit recurring backfill:", {
            expectedDates,
            matchedDates,
            missingDates,
            createdCount,
            failedCount,
          });
        }
      }

      if (!editingTransaction) {
        if (data.recorrente) {
          const expectedDates = buildRecurringPayloads().map((item) => item.data);
          const matchedDates = latestTransactions
            .filter(matchesRecurringSeries)
            .map((transaction) => normalizeComparableDate(transaction.date))
            .filter(Boolean);

          const missingDates = expectedDates.filter((date) => !matchedDates.includes(date));
          console.log("[Transactions] recurring verification:", {
            expectedDates,
            matchedDates,
            missingDates,
          });

          if (missingDates.length > 0) {
            successMessage = `${successMessage} Meses nao retornados pela API apos salvar: ${missingDates.join(", ")}.`;
          }
        }

        let foundSavedTransaction = latestTransactions.some(justSavedMatches);

        // Some backends delay expense aggregation; retry quickly before requiring manual refresh.
        if (!foundSavedTransaction && data.type === "expense") {
          for (let attempt = 0; attempt < 3; attempt += 1) {
            await new Promise((resolve) => setTimeout(resolve, 450));
            latestTransactions = await loadTransactions();
            foundSavedTransaction = latestTransactions.some(justSavedMatches);
            if (foundSavedTransaction) break;
          }
        }

        if (!foundSavedTransaction) {
          const fallbackId = `tx-local-${Date.now()}`;
          setTransactions((previous) => [
            {
              id: fallbackId,
              backendId: fallbackId,
              deleteCandidates: [fallbackId],
              description: data.description,
              amount: data.amount,
              type: data.type,
              category: data.category,
              date: payload.data,
              notes: data.notes,
              recorrente: data.recorrente,
            },
            ...previous,
          ]);
        }
      }

      showMessage("Sucesso", successMessage);
      resetModalState();
    } catch (error: any) {
      const message = String(error?.message ?? "Erro ao salvar transacao");
      showMessage("Erro", editingTransaction ? `Erro ao atualizar transacao: ${message}` : `Erro ao salvar transacao: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async (transaction: Transaction) => {
    try {
      let deleted = false;
      let lastError: unknown = null;

      for (const candidateId of transaction.deleteCandidates ?? []) {
        try {
          await apiService.deleteTransaction(candidateId, transaction.type);
          deleted = true;
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (!deleted) {
        throw lastError ?? new Error("Nao foi possivel excluir a transacao");
      }

      await loadTransactions();
      showMessage("Sucesso", "Transacao excluida com sucesso!");
    } catch (error: any) {
      const message = String(error?.message ?? "Nao foi possivel excluir a transacao");
      if (message.includes("403")) {
        showMessage("Erro 403", "Sem permissao para excluir esta transacao. Verifique se o token pertence ao mesmo usuario da transacao.");
        return;
      }
      showMessage("Erro", message);
    }
  };

  const executeDeleteSeries = async (transaction: Transaction) => {
    try {
      const normalizeText = (value: string) => String(value ?? "").trim().toLowerCase();
      const normalizeComparableDate = (value: string) => {
        const raw = String(value ?? "").trim();
        if (!raw) return "";

        const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/;
        const brSlash = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const brDash = /^(\d{2})-(\d{2})-(\d{4})$/;

        if (isoDate.test(raw)) return raw;
        if (brSlash.test(raw)) {
          const [, day, month, year] = raw.match(brSlash)!;
          return `${year}-${month}-${day}`;
        }
        if (brDash.test(raw)) {
          const [, day, month, year] = raw.match(brDash)!;
          return `${year}-${month}-${day}`;
        }

        const parsed = new Date(raw);
        if (Number.isNaN(parsed.getTime())) return "";
        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, "0");
        const day = String(parsed.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const seriesTransactions = transactions.filter((item) => {
        const validDeleteCandidates = (item.deleteCandidates ?? []).filter((candidate) => {
          const normalized = String(candidate ?? "").trim();
          return (
            normalized.length > 0 &&
            !normalized.startsWith("tx-local-") &&
            !/^tx-\d+$/.test(normalized)
          );
        });

        return (
          item.type === transaction.type &&
          Math.abs(Number(item.amount ?? 0) - Number(transaction.amount ?? 0)) < 0.001 &&
          normalizeText(item.description) === normalizeText(transaction.description) &&
          normalizeText(item.category) === normalizeText(transaction.category) &&
          normalizeComparableDate(item.date) >= normalizeComparableDate(transaction.date) &&
          validDeleteCandidates.length > 0
        );
      });

      const uniqueSeriesTransactions = Array.from(
        new Map(seriesTransactions.map((item) => [item.backendId ?? item.id, item])).values(),
      );

      let deletedCount = 0;
      let failedCount = 0;

      for (const item of uniqueSeriesTransactions) {
        let deleted = false;
        for (const candidateId of item.deleteCandidates ?? []) {
          try {
            await apiService.deleteTransaction(candidateId, item.type);
            deleted = true;
            deletedCount += 1;
            break;
          } catch {
            // Continue trying other candidate IDs for the same transaction.
          }
        }

        if (!deleted) {
          failedCount += 1;
        }
      }

      if (deletedCount === 0) {
        throw new Error("Nao foi possivel excluir a serie recorrente");
      }

      await loadTransactions();

      if (failedCount > 0) {
        showMessage(
          "Sucesso parcial",
          `${deletedCount} transacoes recorrentes foram excluidas e ${failedCount} nao puderam ser removidas.`,
        );
        return;
      }

      showMessage("Sucesso", `${deletedCount} transacoes recorrentes foram excluidas com sucesso!`);
    } catch (error: any) {
      const message = String(error?.message ?? "Nao foi possivel excluir a serie recorrente");
      if (message.includes("403")) {
        showMessage("Erro 403", "Sem permissao para excluir esta serie de transacoes.");
        return;
      }
      showMessage("Erro", message);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setQuickActionType(null);
    setOpenedFromDashboard(false);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const transaction = transactions.find((item) => item.id === id);
    if (!transaction) return;

    const validDeleteCandidates = (transaction.deleteCandidates ?? []).filter(
      (candidate) => {
        const normalized = String(candidate ?? "").trim();
        return (
          normalized.length > 0 &&
          !normalized.startsWith("tx-local-") &&
          !/^tx-\d+$/.test(normalized)
        );
      },
    );

    if (validDeleteCandidates.length === 0) {
      console.log("[Transactions] delete blocked, no valid candidate:", {
        id: transaction.id,
        backendId: transaction.backendId,
        deleteCandidates: transaction.deleteCandidates,
      });
      showMessage("Erro", "Esta transacao nao possui um ID valido para exclusao.");
      return;
    }

    const transactionForDelete = {
      ...transaction,
      deleteCandidates: validDeleteCandidates,
    };

    if (Platform.OS === "web") {
      const webEnv = globalThis as {
        confirm?: (message?: string) => boolean;
      };
      const isRecurring = Boolean(transaction.recorrente);
      const confirmed = webEnv.confirm?.(
        isRecurring
          ? "Tem certeza que deseja excluir esta transacao recorrente e os meses seguintes?"
          : "Tem certeza que deseja excluir esta transacao?",
      );
      if (confirmed) {
        if (isRecurring) {
          void executeDeleteSeries(transactionForDelete);
        } else {
          void executeDelete(transactionForDelete);
        }
      }
      return;
    }

    Alert.alert(
      "Excluir transacao",
      transaction.recorrente
        ? "Tem certeza que deseja excluir esta transacao recorrente e os meses seguintes?"
        : "Tem certeza que deseja excluir esta transacao?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            if (transaction.recorrente) {
              void executeDeleteSeries(transactionForDelete);
              return;
            }
            void executeDelete(transactionForDelete);
          },
        },
      ],
    );
  };

  const handleExportPdf = () => {
    if (Platform.OS !== "web") {
      showMessage("Exportar PDF", "No app mobile, use a versao web para exportar PDF.");
      return;
    }

    const exportRows = exportContext.filtered;
    if (exportRows.length === 0) {
      showMessage("Exportar PDF", "Nao ha transacoes nos filtros atuais para exportar.");
      return;
    }

    const webEnv = globalThis as {
      document?: {
        body?: { appendChild: (node: any) => void; removeChild: (node: any) => void };
        createElement?: (tag: string) => any;
      };
      URL?: { createObjectURL?: (obj: any) => string; revokeObjectURL?: (url: string) => void };
      Blob?: any;
      TextEncoder?: any;
    };

    if (
      !webEnv.document?.createElement ||
      !webEnv.document?.body ||
      !webEnv.URL?.createObjectURL ||
      !webEnv.Blob ||
      !webEnv.TextEncoder
    ) {
      showMessage("Exportar PDF", "Exportacao PDF indisponivel neste ambiente.");
      return;
    }

    const removeAccents = (value: string) =>
      value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const escapePdfText = (value: string) =>
      removeAccents(value)
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)")
        .replace(/[^\x20-\x7E]/g, " ");

    const fitCell = (value: string, width: number) => {
      const base = removeAccents(value).replace(/[^\x20-\x7E]/g, " ").trim();
      if (base.length >= width) return `${base.slice(0, Math.max(0, width - 1))} `;
      return base.padEnd(width, " ");
    };

    const formatCurrency = (amount: number) =>
      Number(amount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

    const headerLines = [
      "RELATORIO DE TRANSACOES",
      `Gerado em ${new Date().toLocaleDateString("pt-BR")}`,
      " ",
      `${fitCell("Data", 12)}${fitCell("Descricao", 30)}${fitCell("Categoria", 22)}${fitCell("Tipo", 12)}${fitCell("Valor", 16)}`,
      "-".repeat(92),
    ];

    const detailLines = exportRows.map((item) => {
      const date = new Date(item.date).toLocaleDateString("pt-BR");
      const type = item.type === "income" ? "Receita" : "Despesa";
      const value = `${item.type === "income" ? "+" : "-"} R$ ${formatCurrency(item.amount)}`;
      return (
        `${fitCell(date, 12)}` +
        `${fitCell(item.description, 30)}` +
        `${fitCell(item.category, 22)}` +
        `${fitCell(type, 12)}` +
        `${fitCell(value, 16)}`
      );
    });

    const totalsLines = (() => {
      if (exportContext.filterType === "income") {
        return [
          " ",
          "-".repeat(92),
          `TOTAL DE RECEITAS: R$ ${formatCurrency(exportContext.totalIncome)}`,
        ];
      }
      if (exportContext.filterType === "expense") {
        return [
          " ",
          "-".repeat(92),
          `TOTAL DE DESPESAS: R$ ${formatCurrency(exportContext.totalExpense)}`,
        ];
      }
      return [
        " ",
        "-".repeat(92),
        `TOTAL DE RECEITAS: R$ ${formatCurrency(exportContext.totalIncome)}`,
        `TOTAL DE DESPESAS: R$ ${formatCurrency(exportContext.totalExpense)}`,
        `SALDO: R$ ${formatCurrency(exportContext.balance)}`,
      ];
    })();

    const lines = [...headerLines, ...detailLines, ...totalsLines].slice(0, 46);

    const textStream = [
      "BT",
      "/F1 10 Tf",
      "45 800 Td",
      ...lines.flatMap((line, index) => {
        const escaped = escapePdfText(line);
        if (index === 0) return [`(${escaped}) Tj`];
        return ["0 -15 Td", `(${escaped}) Tj`];
      }),
      "ET",
    ].join("\n");

    const objects: string[] = [];
    objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
    objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
    objects.push(
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    );
    objects.push("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n");
    objects.push(`5 0 obj\n<< /Length ${textStream.length} >>\nstream\n${textStream}\nendstream\nendobj\n`);

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    for (const obj of objects) {
      offsets.push(pdf.length);
      pdf += obj;
    }
    const xrefStart = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    for (let i = 1; i < offsets.length; i += 1) {
      pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    const encoder = new webEnv.TextEncoder();
    const bytes = encoder.encode(pdf);
    const blob = new webEnv.Blob([bytes], { type: "application/pdf" });
    const url = webEnv.URL.createObjectURL(blob);

    const link = webEnv.document.createElement("a");
    link.href = url;
    link.download = `relatorio-transacoes-${new Date().toISOString().slice(0, 10)}.pdf`;
    webEnv.document.body.appendChild(link);
    link.click();
    webEnv.document.body.removeChild(link);

    setTimeout(() => {
      webEnv.URL?.revokeObjectURL?.(url);
    }, 3000);
  };

  if (isLoadingAuth) {
    return (
      <LinearGradient colors={DASHBOARD_GRADIENT} locations={[0, 0.3, 0.57, 1]} style={styles.gradient}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={DASHBOARD_GRADIENT} locations={[0, 0.3, 0.57, 1]} style={styles.gradient}>
      <View style={[styles.layoutContainer, { paddingTop: insets.top }]}>
        <DashboardHeader />

        <View style={styles.content}>
          {isLargeScreen && (
            <View style={styles.sidebar}>
              <View style={styles.sidebarContent}>
                <DashboardNav />
              </View>
            </View>
          )}

          <View style={styles.main}>
            <View style={styles.scrollContent}>
              <View style={styles.pageContent}>
                <View style={styles.header}>
                  <View style={styles.titleBlock}>
                    <Text style={styles.title}>{pageTitle}</Text>
                    <TouchableOpacity style={styles.periodSwitchButton} onPress={openPeriodPrompt}>
                      <Text style={styles.periodSwitchButtonText}>Trocar Periodo</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.exportButton} onPress={handleExportPdf}>
                    <Text style={styles.exportButtonText}>Exportar PDF</Text>
                  </TouchableOpacity>
                </View>

                <TransactionList
                  transactions={transactions}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  initialStartDate={initialPeriod.startDate}
                  initialEndDate={initialPeriod.endDate}
                  periodSyncToken={periodSyncToken}
                  onExportContextChange={setExportContext}
                />
              </View>
            </View>
          </View>
        </View>

        <Modal
          visible={modalOpen}
          animationType="fade"
          transparent
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={closeModal} />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{modalTitle}</Text>
                <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
                  <Text style={styles.modalCloseButtonText}>Voltar</Text>
                </TouchableOpacity>
              </View>
              <TransactionForm
                onSubmit={handleSubmit}
                initialData={editingTransaction ?? (quickActionType ? { type: quickActionType } : undefined)}
                isLoading={loading}
                onCancel={closeModal}
              />
            </View>
          </View>
        </Modal>

        <TouchableOpacity
          style={[styles.floatingButton, { bottom: Math.max(insets.bottom + 16, 20) }]}
          onPress={() => {
            setEditingTransaction(null);
            setQuickActionType(null);
            setOpenedFromDashboard(false);
            setModalOpen(true);
          }}
        >
          <Text style={styles.floatingButtonText}>+ Nova Transação</Text>
        </TouchableOpacity>

        <Modal visible={periodPromptOpen} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} />
            <View style={styles.periodPromptContent}>
              <Text style={styles.periodPromptTitle}>Filtrar por mes</Text>
              <Text style={styles.periodPromptText}>
                Informe o mes para abrir a lista ja filtrada.
              </Text>

              <TextInput
                style={styles.periodInput}
                placeholder="Mes (MM-AAAA)"
                value={monthDraft}
                onChangeText={setMonthDraft}
              />

              <View style={styles.periodPromptActions}>
                <TouchableOpacity
                  style={[styles.periodPromptButton, styles.periodPromptApplyButton]}
                  onPress={() => {
                    const monthPeriod = getPeriodFromMonth(monthDraft);
                    if (!monthPeriod) {
                      showMessage("Mes invalido", "Use o formato MM-AAAA. Exemplo: 02-2026");
                      return;
                    }
                    setInitialPeriod({
                      startDate: monthPeriod.startDate,
                      endDate: monthPeriod.endDate,
                    });
                    setPeriodSyncToken((current) => current + 1);
                    setSelectedMonthLabel(monthPeriod.label);
                    setPeriodPromptOpen(false);
                  }}
                >
                  <Text style={styles.periodPromptApplyText}>Aplicar mes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  layoutContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: 246,
    borderRightWidth: 1,
    borderRightColor: "rgba(148, 163, 184, 0.24)",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
  },
  sidebarContent: {
    paddingVertical: 24,
  },
  main: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 24,
    width: "100%",
    maxWidth: 1330,
    alignSelf: "center",
  },
  pageContent: {
    flex: 1,
    gap: 16,
    backgroundColor: "rgba(255, 255, 255, 0.52)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#64748b",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.18)",
  },
  title: {
    fontSize: 38,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -1.1,
  },
  titleBlock: {
    gap: 10,
  },
  periodSwitchButton: {
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.28)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  periodSwitchButtonText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
  },
  exportButton: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
    shadowColor: "#0f172a",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  exportButtonText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "700",
  },
  floatingButton: {
    position: "absolute",
    right: 18,
    backgroundColor: "#0f172a",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    shadowColor: "#0f172a",
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
    zIndex: 20,
  },
  floatingButtonText: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  modalContent: {
    width: "100%",
    maxWidth: 650,
    maxHeight: "88%",
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.22)",
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  modalCloseButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
  },
  modalCloseButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  periodPromptContent: {
    width: "100%",
    maxWidth: 760,
    borderRadius: 24,
    backgroundColor: "#f8fafc",
    padding: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
  },
  periodPromptTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },
  periodPromptText: {
    fontSize: 14,
    color: "#64748b",
  },
  periodInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0f172a",
  },
  periodPromptActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  periodPromptButton: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  periodPromptApplyButton: {
    backgroundColor: "#0f172a",
  },
  periodPromptApplyText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#f8fafc",
  },
});
