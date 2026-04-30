import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardNav } from "@/components/dashboard-nav";
import TransactionForm, { TransactionFormData } from "@/components/transaction-form";
import { TransactionList } from "@/components/transaction-list";
import { apiService } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Transaction {
  id: string;
  backendId?: string;
  deleteCandidates?: string[];
  description: string;
  amount: number;
  type: "income" | "expense" | "ia";
  category: string;
  date: string;
  notes?: string;
  recorrente?: boolean;
  recurrenceMonths?: number;
  recurrenceCurrent?: number;
  createdViaChat?: boolean;
}

interface ExportRow {
  description: string;
  amount: number;
  type: "income" | "expense" | "ia";
  category: string;
  date: string;
  notes?: string;
}

interface ExportContext {
  filtered: ExportRow[];
  filterType: "all" | "income" | "expense";
  totalIncome: number;
  totalExpense: number;
  totalInvestment: number;
  balance: number;
}

const DASHBOARD_GRADIENT = ["#F4F7FB", "#EAF1F8", "#E2ECF6", "#DCE7F4"] as const;
const MONTH_PICKER_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;
const getCurrentMonthValue = () =>
  `${String(new Date().getMonth() + 1).padStart(2, "0")}-${new Date().getFullYear()}`;
const normalizeCategoryKey = (value: string) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
const normalizeTransactionCategory = (
  value: string,
  type: Transaction["type"] | TransactionFormData["type"],
) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "Sem categoria";
  if (type === "income" || type === "ia") return raw;

  const normalized = normalizeCategoryKey(raw);

  if (["investimento", "investimentos", "aplicacao", "aporte"].includes(normalized)) {
    return "Investimento";
  }
  if (["moradia", "aluguel", "condominio", "agua", "luz", "energia", "internet", "gas", "iptu"].includes(normalized)) {
    return "Moradia";
  }
  if (["alimentacao", "mercado", "supermercado", "feira", "padaria", "acougue", "sacolao", "hortifruti"].includes(normalized)) {
    return "Alimentacao";
  }
  if (["restaurante", "delivery", "ifood", "lanche", "pizza", "hamburguer"].includes(normalized)) {
    return "Restaurante";
  }
  if (["transporte", "uber", "99", "combustivel", "gasolina", "transporte publico", "onibus", "metro", "estacionamento"].includes(normalized)) {
    return "Transporte";
  }
  if (["saude", "medicamentos", "medicamento", "farmacia", "consulta", "plano de saude", "academia"].includes(normalized)) {
    return "Saude";
  }
  if (["lazer", "streaming", "cinema", "viagens", "viagem", "show", "bar", "festa"].includes(normalized)) {
    return "Lazer";
  }
  if (["compras", "shopping", "roupa", "presente"].includes(normalized)) {
    return "Compras";
  }
  if (["educacao", "curso", "faculdade", "escola", "livro", "livros"].includes(normalized)) {
    return "Educacao";
  }
  if (["pet", "pets", "racao", "veterinario"].includes(normalized)) {
    return "Pets";
  }
  if (["assinatura", "assinaturas", "software", "app"].includes(normalized)) {
    return "Assinaturas";
  }
  if (["tecnologia", "celular", "computador", "eletronico", "eletronicos"].includes(normalized)) {
    return "Tecnologia";
  }
  if (["outros", "outras", "diversos", "diversas"].includes(normalized)) {
    return "Outros";
  }

  return raw;
};

export default function TransactionsPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    new?: string | string[];
    type?: string | string[];
    source?: string | string[];
    category?: string | string[];
    description?: string | string[];
    amount?: string | string[];
    date?: string | string[];
    notes?: string | string[];
  }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const isCompactScreen = width < 430;
  const floatingButtonBottom = isLargeScreen
    ? Math.max(insets.bottom + 16, 20)
    : Math.max(insets.bottom + 84, 88);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [exportContext, setExportContext] = useState<ExportContext>({
    filtered: [],
    filterType: "all",
    totalIncome: 0,
    totalExpense: 0,
    totalInvestment: 0,
    balance: 0,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [quickActionType, setQuickActionType] = useState<"income" | "expense" | null>(null);
  const [prefilledTransaction, setPrefilledTransaction] = useState<Partial<TransactionFormData> | null>(null);
  const [openedFromDashboard, setOpenedFromDashboard] = useState(false);
  const [periodPromptOpen, setPeriodPromptOpen] = useState(false);
  const [deleteMonthPromptOpen, setDeleteMonthPromptOpen] = useState(false);
  const [monthDraft, setMonthDraft] = useState(getCurrentMonthValue());
  const [yearDraft, setYearDraft] = useState(new Date().getFullYear());
  const [yearSelectOpen, setYearSelectOpen] = useState(false);
  const [initialPeriod, setInitialPeriod] = useState({ startDate: "", endDate: "" });
  const [periodSyncToken, setPeriodSyncToken] = useState(0);
  const [selectedMonthLabel, setSelectedMonthLabel] = useState("");
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
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

  const normalizeSeriesText = (value: string) => String(value ?? "").trim().toLowerCase();
  const buildRecurringSeriesKey = (transaction: Pick<Transaction, "type" | "amount" | "description" | "category">) =>
    [
      transaction.type,
      Number(transaction.amount ?? 0).toFixed(2),
      normalizeSeriesText(transaction.description),
      normalizeSeriesText(transaction.category),
    ].join("|");
  const getMonthDifference = (startDate: string, currentDate: string) => {
    const normalizedStart = normalizeComparableDate(startDate);
    const normalizedCurrent = normalizeComparableDate(currentDate);
    if (!normalizedStart || !normalizedCurrent) return 0;

    const startYear = Number(normalizedStart.slice(0, 4));
    const startMonth = Number(normalizedStart.slice(5, 7));
    const currentYear = Number(normalizedCurrent.slice(0, 4));
    const currentMonth = Number(normalizedCurrent.slice(5, 7));

    if (
      !Number.isFinite(startYear) ||
      !Number.isFinite(startMonth) ||
      !Number.isFinite(currentYear) ||
      !Number.isFinite(currentMonth)
    ) {
      return 0;
    }

    return (currentYear - startYear) * 12 + (currentMonth - startMonth);
  };

  const hasValidDeleteCandidates = (transaction: Transaction) =>
    (transaction.deleteCandidates ?? []).some((candidate) => {
      const normalized = String(candidate ?? "").trim();
      return (
        normalized.length > 0 &&
        !normalized.startsWith("tx-local-") &&
        !/^tx-\d+$/.test(normalized)
      );
    });

  const buildSeriesMatcher = (reference: Pick<Transaction, "type" | "amount" | "description" | "category">) =>
    (transaction: Transaction) =>
      transaction.type === reference.type &&
      Math.abs(Number(transaction.amount ?? 0) - Number(reference.amount ?? 0)) < 0.001 &&
      normalizeSeriesText(transaction.description) === normalizeSeriesText(reference.description) &&
      normalizeSeriesText(transaction.category) === normalizeSeriesText(reference.category);
  const getTransactionIdentityKey = (transaction: Pick<Transaction, "type" | "id" | "backendId">) =>
    `${transaction.type}-${String(transaction.backendId ?? transaction.id).trim()}`;

  const getRecurringSeriesTransactions = (reference: Transaction) =>
    Array.from(
      new Map(
        transactions
          .filter(buildSeriesMatcher(reference))
          .sort((left, right) =>
            normalizeComparableDate(left.date).localeCompare(normalizeComparableDate(right.date)),
          )
          .map((item) => [getTransactionIdentityKey(item), item]),
      ).values(),
    );

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

  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 6 }, (_, index) => currentYear - index);
  const getMonthValueFromDate = (value: string) => {
    const normalized = normalizeComparableDate(value);
    if (!normalized) return "";
    return `${normalized.slice(5, 7)}-${normalized.slice(0, 4)}`;
  };

  const getNextMonthValue = (value: string) => {
    const period = getPeriodFromMonth(value);
    if (!period) return getCurrentMonthValue();

    const baseDate = new Date(
      Number(period.startDate.slice(0, 4)),
      Number(period.startDate.slice(5, 7)) - 1,
      1,
    );
    baseDate.setMonth(baseDate.getMonth() + 1);

    return `${String(baseDate.getMonth() + 1).padStart(2, "0")}-${baseDate.getFullYear()}`;
  };

  const moveDateToMonth = (value: string, monthValue: string) => {
    const normalized = normalizeComparableDate(value);
    const targetPeriod = getPeriodFromMonth(monthValue);
    if (!normalized || !targetPeriod) return normalized || "";

    const day = Number(normalized.slice(8, 10));
    const targetYear = Number(targetPeriod.startDate.slice(0, 4));
    const targetMonth = Number(targetPeriod.startDate.slice(5, 7));
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const safeDay = Math.min(day, lastDay);

    return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
  };

  const getTransactionsForMonth = (monthValue: string, sourceTransactions: Transaction[] = transactions) => {
    const period = getPeriodFromMonth(monthValue);
    if (!period) return [];

    const monthKey = period.startDate.slice(0, 7);
    return Array.from(
      new Map(
        sourceTransactions
          .filter((transaction) => normalizeComparableDate(transaction.date).slice(0, 7) === monthKey)
          .map((transaction) => [getTransactionIdentityKey(transaction), transaction]),
      ).values(),
    );
  };

  const applyMonthPeriod = (value?: string) => {
    if (!value) {
      setInitialPeriod({ startDate: "", endDate: "" });
      setPeriodSyncToken((current) => current + 1);
      setSelectedMonthLabel("");
      setMonthDraft(getCurrentMonthValue());
      setYearDraft(new Date().getFullYear());
      setPeriodPromptOpen(false);
      return;
    }

    const monthPeriod = getPeriodFromMonth(value);
    if (!monthPeriod) {
      showMessage("Mês inválido", "Não foi possível aplicar este período.");
      return;
    }

    setInitialPeriod({
      startDate: monthPeriod.startDate,
      endDate: monthPeriod.endDate,
    });
    setPeriodSyncToken((current) => current + 1);
    setSelectedMonthLabel(monthPeriod.label);
    setMonthDraft(value);
    setYearDraft(Number(value.slice(3, 7)));
    setPeriodPromptOpen(false);
  };

  const resetModalState = () => {
    setModalOpen(false);
    setEditingTransaction(null);
    setQuickActionType(null);
    setPrefilledTransaction(null);
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
    ? "Editar Transação"
    : quickActionType === "income"
      ? "Nova Receita"
      : quickActionType === "expense"
        ? "Nova Despesa"
        : "Nova Transação";
  const pageTitle = selectedMonthLabel ? `Transações - ${selectedMonthLabel}` : "Transações";

  const effectiveModalTitle =
    !editingTransaction && prefilledTransaction?.category === "Investimento"
      ? "Nova Meta de Investimento"
      : modalTitle;

  const openNewTransaction = () => {
    setPeriodPromptOpen(false);
    setDeleteMonthPromptOpen(false);
    setYearSelectOpen(false);
    setEditingTransaction(null);
    setQuickActionType("expense");
    setPrefilledTransaction({ type: "expense" });
    setOpenedFromDashboard(false);
    setModalOpen(true);
    router.push("/(tabs)/transactions?new=1&type=expense&source=transactions" as any);
  };

  const transactionFormInitialData: Partial<TransactionFormData> | undefined =
    editingTransaction && editingTransaction.type !== "ia"
      ? {
          ...editingTransaction,
          type: editingTransaction.type,
        }
      : prefilledTransaction ?? (quickActionType ? { type: quickActionType } : undefined);

  const openPeriodPrompt = () => {
    const currentMonth = initialPeriod.startDate
      ? `${initialPeriod.startDate.slice(5, 7)}-${initialPeriod.startDate.slice(0, 4)}`
      : getCurrentMonthValue();
    setMonthDraft(currentMonth);
    setYearDraft(Number(currentMonth.slice(3, 7)));
    setYearSelectOpen(false);
    setPeriodPromptOpen(true);
  };

  const executeCopyCurrentMonthToNext = async () => {
    const sourceMonthValue = initialPeriod.startDate
      ? `${initialPeriod.startDate.slice(5, 7)}-${initialPeriod.startDate.slice(0, 4)}`
      : getCurrentMonthValue();
    const targetMonthValue = getNextMonthValue(sourceMonthValue);
    const sourcePeriod = getPeriodFromMonth(sourceMonthValue);
    const targetPeriod = getPeriodFromMonth(targetMonthValue);
    const activeCopyFilter = exportContext.filterType;

    if (!sourcePeriod || !targetPeriod) {
      showMessage("Erro", "Não foi possível identificar o mês para copiar.");
      return;
    }

    try {
      setLoading(true);

      const currentTransactions = await loadTransactions();
      const monthTransactions = getTransactionsForMonth(sourceMonthValue, currentTransactions).filter(
        (transaction) => activeCopyFilter === "all" || transaction.type === activeCopyFilter,
      );
      const skippedIaTransactions = monthTransactions.filter((transaction) => transaction.type === "ia");
      const skippedIaCount = skippedIaTransactions.length;
      const skippedRecurringTransactions = monthTransactions.filter((transaction) => transaction.recorrente);
      const skippedRecurringCount = skippedRecurringTransactions.length;
      const sourceTransactions = monthTransactions.filter(
        (transaction) =>
          !transaction.recorrente && transaction.type !== "ia",
      );

      if (sourceTransactions.length === 0) {
        const filterLabel =
          activeCopyFilter === "income"
            ? "receitas normais"
            : activeCopyFilter === "expense"
              ? "despesas normais"
              : "lançamentos normais";
        const recurringHint =
          skippedRecurringCount > 0
            ? ` ${skippedRecurringCount} lançamentos recorrentes foram ignorados.`
            : "";
        const iaHint =
          skippedIaCount > 0
            ? ` ${skippedIaCount} ações financeiras IA foram ignoradas.`
            : "";
        showMessage("Sem dados", `Não há ${filterLabel} em ${sourcePeriod.label} para copiar.${recurringHint}${iaHint}`);
        return;
      }

      let createdCount = 0;
      let failedCount = 0;
      const failedTransactionLabels: string[] = [];

      for (const transaction of sourceTransactions) {
        const targetDate = moveDateToMonth(transaction.date, targetMonthValue);
        const payload = {
          descricao: transaction.description,
          valor: transaction.amount,
          categoria: transaction.category,
          data: targetDate,
          observacao: transaction.notes,
          recorrente: false,
          recurring: false,
        };

        try {
          if (transaction.type === "expense") {
            await apiService.createDespesa(payload);
          } else {
            await apiService.createReceita(payload);
          }

          createdCount += 1;
        } catch {
          failedCount += 1;
          failedTransactionLabels.push(`${transaction.description} (${transaction.category})`);
        }
      }

      await loadTransactions();

      const resultLabel =
        activeCopyFilter === "income"
          ? "receitas"
          : activeCopyFilter === "expense"
            ? "despesas"
            : "lançamentos";
      let resultMessage = `${createdCount} ${resultLabel} foram copiados de ${sourcePeriod.label} para ${targetPeriod.label}. Você continua visualizando ${sourcePeriod.label}.`;
      if (skippedRecurringCount > 0) {
        const recurringPreview = skippedRecurringTransactions
          .slice(0, 3)
          .map((transaction) => `${transaction.description} (${transaction.category})`)
          .join(", ");
        resultMessage = `${resultMessage} ${skippedRecurringCount} lançamentos recorrentes foram ignorados.${recurringPreview ? ` Ex.: ${recurringPreview}.` : ""}`;
      }
      if (skippedIaCount > 0) {
        const iaPreview = skippedIaTransactions
          .slice(0, 3)
          .map((transaction) => `${transaction.description} (${transaction.category})`)
          .join(", ");
        resultMessage = `${resultMessage} ${skippedIaCount} ações financeiras IA foram ignoradas.${iaPreview ? ` Ex.: ${iaPreview}.` : ""}`;
      }
      if (failedCount > 0) {
        const failedPreview = failedTransactionLabels.slice(0, 3).join(", ");
        resultMessage = `${resultMessage} ${failedCount} não puderam ser copiados.${failedPreview ? ` Ex.: ${failedPreview}.` : ""}`;
      }

      showMessage("Sucesso", resultMessage);
    } catch (error: any) {
      const message = String(error?.message ?? "Não foi possível copiar o mês.");
      showMessage("Erro", message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCurrentMonth = () => {
    const sourceMonthValue = initialPeriod.startDate
      ? getMonthValueFromDate(initialPeriod.startDate)
      : getCurrentMonthValue();
    const sourcePeriod = getPeriodFromMonth(sourceMonthValue);
    const targetPeriod = getPeriodFromMonth(getNextMonthValue(sourceMonthValue));
    const activeCopyFilter = exportContext.filterType;
    const monthTransactions = getTransactionsForMonth(sourceMonthValue).filter(
        (transaction) =>
        (activeCopyFilter === "all" || transaction.type === activeCopyFilter),
    );
    const skippedIaCount = monthTransactions.filter((transaction) => transaction.type === "ia").length;
    const skippedRecurringTransactions = monthTransactions.filter((transaction) => transaction.recorrente);
    const skippedRecurringCount = skippedRecurringTransactions.length;
    const sourceTransactions = monthTransactions.filter(
      (transaction) => !transaction.recorrente && transaction.type !== "ia",
    );

    if (!sourcePeriod || !targetPeriod) {
      showMessage("Erro", "Não foi possível identificar o mês atual.");
      return;
    }

    if (sourceTransactions.length === 0) {
      const filterLabel =
        activeCopyFilter === "income"
          ? "receitas normais"
          : activeCopyFilter === "expense"
            ? "despesas normais"
            : "lançamentos normais";
      const recurringHint =
        skippedRecurringCount > 0
          ? ` ${skippedRecurringCount} lançamentos recorrentes serão ignorados.`
          : "";
      const iaHint =
        skippedIaCount > 0
          ? ` ${skippedIaCount} ações financeiras IA serão ignoradas.`
          : "";
      showMessage("Sem dados", `Não há ${filterLabel} em ${sourcePeriod.label} para copiar.${recurringHint}${iaHint}`);
      return;
    }

    const confirmLabel =
      activeCopyFilter === "income"
        ? "receitas"
        : activeCopyFilter === "expense"
          ? "despesas"
          : "lançamentos";
    const recurringHint =
      skippedRecurringCount > 0
        ? ` ${skippedRecurringCount} recorrentes serão ignorados.`
        : "";
    const iaHint =
      skippedIaCount > 0
        ? ` ${skippedIaCount} ações IA serão ignoradas.`
        : "";
    const confirmMessage = `Copiar ${sourceTransactions.length} ${confirmLabel} de ${sourcePeriod.label} para ${targetPeriod.label}?${recurringHint}${iaHint}`;

    if (Platform.OS === "web") {
      const webEnv = globalThis as { confirm?: (message?: string) => boolean };
      const confirmed = webEnv.confirm?.(confirmMessage);
      if (confirmed) {
        void executeCopyCurrentMonthToNext();
      }
      return;
    }

    Alert.alert(
      "Copiar mês",
      confirmMessage,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Copiar",
          onPress: () => {
            void executeCopyCurrentMonthToNext();
          },
        },
      ],
    );
  };

  useEffect(() => {
    checkAuthentication();
    loadTransactions();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadTransactions();
    }, []),
  );

  useEffect(() => {
    const pickParam = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value) ?? "";
    const shouldOpen = pickParam(params.new) === "1";
    if (!shouldOpen) return;

    const rawType = pickParam(params.type).toLowerCase().trim();
    const normalizedType: "income" | "expense" =
      rawType === "income" || rawType === "receita" ? "income" : "expense";
    const source = pickParam(params.source).toLowerCase().trim();
    const category = pickParam(params.category).trim();
    const description = pickParam(params.description).trim();
    const amount = pickParam(params.amount).trim();
    const date = pickParam(params.date).trim();
    const notes = pickParam(params.notes).trim();
    const normalizedParamCategory = category
      ? normalizeTransactionCategory(category, normalizedType)
      : "";

    setEditingTransaction(null);
    setQuickActionType(normalizedType);
    setPrefilledTransaction({
      type: normalizedType,
      ...(normalizedParamCategory ? { category: normalizedParamCategory } : {}),
      ...(description ? { description } : {}),
      ...(amount ? { amount: Number(amount.replace(",", ".")) } : {}),
      ...(date ? { date } : {}),
      ...(notes ? { notes } : {}),
    });
    setOpenedFromDashboard(source === "dashboard");
    setModalOpen(true);
    router.replace("/(tabs)/transactions");
  }, [params.new, params.type, params.source, params.category, params.description, params.amount, params.date, params.notes, router]);

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

      const resolveTransactionType = (value: any): Transaction["type"] => {
        const rawType = String(
          value?.type ??
            value?.tipo ??
            value?.sourceType ??
            value?.entityType ??
            value?.recordType ??
            value?.resourceType ??
            value?.origemTipo ??
            value?.tipoRegistro ??
            value?.transactionType ??
            value?.natureza ??
            value?.acaoFinanceira?.type ??
            value?.acaoFinanceira?.tipo ??
            value?.receita?.type ??
            value?.receita?.tipo ??
            value?.despesa?.type ??
            value?.despesa?.tipo ??
            "",
        )
          .toLowerCase()
          .trim();

        if (
          rawType === "income" ||
          rawType === "icome" ||
          rawType === "receita" ||
          rawType === "entrada" ||
          rawType === "ganho"
        ) {
          return "income";
        }

        if (
          rawType === "ia" ||
          rawType === "acaofinanceira" ||
          rawType === "acao_financeira" ||
          rawType === "ai"
        ) {
          return "ia";
        }

        if (
          rawType === "expense" ||
          rawType === "despesa" ||
          rawType === "saida" ||
          rawType === "gasto"
        ) {
          return "expense";
        }

        if (value?.receita && !value?.despesa) {
          return "income";
        }

        if (
          value?.acaoFinanceira ||
          value?.acaoFinanceiraId !== undefined ||
          value?.idAcaoFinanceira !== undefined
        ) {
          return "ia";
        }

        return "expense";
      };

      const resolveTransactionIds = (item: any, index: number) => {
        const candidates: string[] = [];
        const pushCandidate = (value: unknown) => {
          if (value === null || value === undefined) return;
          if (typeof value === "object" || typeof value === "function") return;
          const normalized = String(value).trim();
          if (!normalized) return;
          if (!candidates.includes(normalized)) candidates.push(normalized);
        };
        const collectNestedIds = (value: unknown, depth = 0, visited = new WeakSet<object>()) => {
          if (depth > 2 || !value || typeof value !== "object") return;
          if (visited.has(value as object)) return;
          visited.add(value as object);

          for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
            const normalizedKey = key.toLowerCase();
            const isForeignId = normalizedKey.includes("user") || normalizedKey.includes("usuario");
            const isLikelyId =
              normalizedKey === "id" ||
              normalizedKey.endsWith("id") ||
              normalizedKey.includes("_id");

            if (isLikelyId && !isForeignId) {
              pushCandidate(nestedValue);
            }

            if (nestedValue && typeof nestedValue === "object") {
              collectNestedIds(nestedValue, depth + 1, visited);
            }
          }
        };

        const preferredKeys = [
          "acaoFinanceiraId",
          "idAcaoFinanceira",
          "acao_id",
          "receitaId",
          "despesaId",
          "id_receita",
          "id_despesa",
          "transactionId",
          "transacaoId",
          "idTransacao",
          "id",
          "_id",
          "Id",
          "ID",
          "uuid",
        ];

        pushCandidate(item?.acaoFinanceira?.id);
        pushCandidate(item?.acaoFinanceira?._id);
        pushCandidate(item?.acaoFinanceira?.acaoFinanceiraId);
        pushCandidate(item?.acao?.id);
        pushCandidate(item?.acao?._id);
        pushCandidate(item?.receita?.id);
        pushCandidate(item?.receita?._id);
        pushCandidate(item?.receita?.receitaId);
        pushCandidate(item?.receita?.transactionId);
        pushCandidate(item?.despesa?.id);
        pushCandidate(item?.despesa?._id);
        pushCandidate(item?.despesa?.despesaId);
        pushCandidate(item?.despesa?.transactionId);
        pushCandidate(item?.transacao?.id);
        pushCandidate(item?.transacao?._id);
        pushCandidate(item?.transaction?.id);
        pushCandidate(item?.transaction?._id);

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

        collectNestedIds(item);

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
        const notes = String(t?.notes ?? t?.observacao ?? "").trim();
        const description = String(
          t?.description ??
            t?.descricao ??
            t?.nome ??
            t?.titulo ??
            t?.historico ??
            "Sem descricao",
        );
        const originSignature = `${notes} ${description}`
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
        const resolvedType = resolveTransactionType(t);
        const rawCategory = String(t?.category ?? t?.categoria ?? "Sem categoria");
        const parsedRecurrenceMonths = Math.floor(
          Number(
            t?.recurrenceMonths ??
              t?.recorrenciaMeses ??
              t?.quantidadeMeses ??
              t?.quantidadeParcelas ??
              t?.numeroParcelas ??
              t?.parcelas ??
              t?.totalParcelas,
          ),
        );
        const recurrenceMonths =
          Number.isFinite(parsedRecurrenceMonths) && parsedRecurrenceMonths > 0
            ? parsedRecurrenceMonths
            : undefined;

        return {
        backendId: ids.primaryId,
        id: "",
        deleteCandidates: ids.candidates,
        description,
        amount: Number(t?.amount ?? t?.valor ?? t?.value ?? t?.preco ?? 0),
        type: resolvedType,
        category: normalizeTransactionCategory(rawCategory, resolvedType),
        date: String(
          t?.date ??
            t?.data ??
            t?.dataTransacao ??
            t?.dataDespesa ??
            t?.dataReceita ??
            t?.createdAt ??
            new Date().toISOString(),
        ),
        notes: notes || undefined,
        recorrente: Boolean(t?.recorrente ?? t?.recurring ?? t?.isRecurring ?? t?.recorrencia),
        recurrenceMonths,
        createdViaChat:
          originSignature.includes("[chat]") ||
          originSignature.includes("criado via chat") ||
          originSignature.includes("lancamento via chat"),
      };
    }).map((transaction, index) => ({
        ...transaction,
        id: `${transaction.type}-${transaction.backendId}-${index}`,
      }));

      const recurringSeriesMetadata = normalized.reduce<
        Record<string, { total: number; startDate: string }>
      >((acc, transaction) => {
        if (!transaction.recorrente) return acc;

        const seriesKey = buildRecurringSeriesKey(transaction);
        const currentStartDate = normalizeComparableDate(transaction.date);
        const existing = acc[seriesKey];

        if (!existing) {
          acc[seriesKey] = {
            total: 1,
            startDate: currentStartDate,
          };
          return acc;
        }

        acc[seriesKey] = {
          total: existing.total + 1,
          startDate:
            existing.startDate && currentStartDate
              ? (existing.startDate < currentStartDate ? existing.startDate : currentStartDate)
              : existing.startDate || currentStartDate,
        };
        return acc;
      }, {});

      const enrichedTransactions = normalized.map((transaction) => {
        if (!transaction.recorrente) {
          return transaction;
        }

        const recurringSeries = recurringSeriesMetadata[buildRecurringSeriesKey(transaction)];
        const inferredRecurrenceMonths = recurringSeries?.total ?? 0;
        const monthsElapsed = recurringSeries?.startDate
          ? Math.max(0, getMonthDifference(recurringSeries.startDate, transaction.date))
          : 0;
        const totalRecurrenceMonths =
          Math.max(transaction.recurrenceMonths ?? 0, inferredRecurrenceMonths) || undefined;

        return {
          ...transaction,
          recurrenceMonths: totalRecurrenceMonths,
          recurrenceCurrent: totalRecurrenceMonths
            ? Math.min(totalRecurrenceMonths, monthsElapsed + 1)
            : monthsElapsed + 1,
        };
      });

      const monthCounts = enrichedTransactions.reduce<Record<string, number>>((acc, transaction) => {
        const monthKey = getMonthKey(transaction.date);
        acc[monthKey] = (acc[monthKey] ?? 0) + 1;
        return acc;
      }, {});
      console.log("[Transactions] normalized month counts:", monthCounts);

      setTransactions(enrichedTransactions);
      return enrichedTransactions;
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
      const normalizedCategory = normalizeTransactionCategory(data.category, data.type);

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
        categoria: normalizedCategory,
        data: normalizeDateToIso(data.date),
        observacao: data.notes,
        recorrente: data.recorrente,
        recurring: data.recorrente,
      };
      const recurringOccurrencesTotal = data.recorrente
        ? Math.max(1, Math.floor(Number(data.recurrenceMonths ?? 12)))
        : 1;
      const formatRecurringMonthCount = (value: number) =>
        `${value} ${value === 1 ? "mes" : "meses"}`;

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
        const generated = Array.from({ length: recurringOccurrencesTotal }, (_, index) => ({
          ...payload,
          data: addMonthsToIsoDate(baseDate, index),
        }));
        console.log(
          "[Transactions] recurring payload dates:",
          generated.map((item) => item.data),
        );
        return generated;
      };
      const matchesRecurringSeries = (transaction: Transaction) => {
        return (
          transaction.type === data.type &&
          Math.abs(Number(transaction.amount ?? 0) - Number(data.amount ?? 0)) < 0.001 &&
          normalizeSeriesText(transaction.description) === normalizeSeriesText(data.description) &&
          normalizeSeriesText(transaction.category) === normalizeSeriesText(normalizedCategory)
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
                categoria: normalizedCategory,
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
            ? `Transacao recorrente cadastrada para ${formatRecurringMonthCount(recurringOccurrencesTotal)}.`
            : "Transacao cadastrada com sucesso!";
        }
      }

      let latestTransactions = await loadTransactions();

      if (editingTransaction && editingTransaction.recorrente && !data.recorrente) {
        const futureSeriesTransactions = getRecurringSeriesTransactions(editingTransaction).filter(
          (transaction) =>
            normalizeComparableDate(transaction.date) > normalizeComparableDate(editingTransaction.date),
        );

        let deletedFutureCount = 0;
        let failedFutureCount = 0;

        for (const transactionToDelete of futureSeriesTransactions) {
          let deletedFuture = false;

          for (const candidateId of transactionToDelete.deleteCandidates ?? []) {
            try {
              await apiService.deleteTransaction(candidateId, transactionToDelete.type);
              deletedFuture = true;
              deletedFutureCount += 1;
              break;
            } catch {
              // Continue trying other candidate IDs for the same transaction.
            }
          }

          if (!deletedFuture) {
            failedFutureCount += 1;
          }
        }

        latestTransactions = await loadTransactions();

        if (deletedFutureCount > 0) {
          successMessage = `${successMessage} ${deletedFutureCount} recorrencias futuras foram removidas.`;
        }

        if (failedFutureCount > 0) {
          successMessage = `${successMessage} ${failedFutureCount} recorrencias futuras nao puderam ser removidas.`;
        }
      } else if (editingTransaction && data.recorrente) {
        const originalSeriesTransactions = getRecurringSeriesTransactions(editingTransaction).filter(
          (transaction) =>
            normalizeComparableDate(transaction.date) >= normalizeComparableDate(editingTransaction.date),
        );
        const expectedPayloads = buildRecurringPayloads();
        const futureExpectedPayloads = expectedPayloads.slice(1);
        const futureSeriesTransactions = originalSeriesTransactions.filter(
          (transaction) =>
            normalizeComparableDate(transaction.date) > normalizeComparableDate(editingTransaction.date),
        );
        const transactionsToUpdate = futureSeriesTransactions.slice(0, futureExpectedPayloads.length);
        const payloadsToCreate = futureExpectedPayloads.slice(transactionsToUpdate.length);
        const transactionsToDelete = futureSeriesTransactions.slice(futureExpectedPayloads.length);

        let updatedFutureCount = 0;
        let createdFutureCount = 0;
        let deletedFutureCount = 0;
        let failedFutureCount = 0;

        for (let index = 0; index < transactionsToUpdate.length; index += 1) {
          const transactionToUpdate = transactionsToUpdate[index];
          const nextPayload = futureExpectedPayloads[index];
          let updatedFuture = false;

          for (const candidateId of transactionToUpdate.deleteCandidates ?? []) {
            try {
              await apiService.updateTransaction(
                candidateId,
                {
                  ...nextPayload,
                  type: data.type,
                  tipo: data.type,
                },
                transactionToUpdate.type,
              );
              updatedFuture = true;
              updatedFutureCount += 1;
              break;
            } catch {
              // Continue trying other candidate IDs for the same transaction.
            }
          }

          if (!updatedFuture) {
            failedFutureCount += 1;
          }
        }

        if (payloadsToCreate.length > 0) {
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
          createdFutureCount = creationResults.filter((result) => result.status === "fulfilled").length;
          failedFutureCount += creationResults.length - createdFutureCount;
        }

        if (transactionsToDelete.length > 0) {
          for (const transactionToDelete of transactionsToDelete) {
            let deletedFuture = false;

            for (const candidateId of transactionToDelete.deleteCandidates ?? []) {
              try {
                await apiService.deleteTransaction(candidateId, transactionToDelete.type);
                deletedFuture = true;
                deletedFutureCount += 1;
                break;
              } catch {
                // Continue trying other candidate IDs for the same transaction.
              }
            }

            if (!deletedFuture) {
              failedFutureCount += 1;
            }
          }
        }

        latestTransactions = await loadTransactions();

        if (updatedFutureCount > 0) {
          successMessage = `${successMessage} ${updatedFutureCount} recorrencias futuras foram atualizadas.`;
        }

        if (createdFutureCount > 0) {
          successMessage = `${successMessage} ${createdFutureCount} recorrencias futuras foram criadas.`;
        }

        if (deletedFutureCount > 0) {
          successMessage = `${successMessage} ${deletedFutureCount} recorrencias futuras excedentes foram removidas.`;
        }

        if (failedFutureCount > 0) {
          successMessage = `${successMessage} ${failedFutureCount} recorrencias futuras nao puderam ser sincronizadas.`;
        }

        console.log("[Transactions] edit recurring sync:", {
          recurringOccurrencesTotal,
          originalSeriesCount: originalSeriesTransactions.length,
          updatedFutureCount,
          createdFutureCount,
          deletedFutureCount,
          failedFutureCount,
          expectedDates: expectedPayloads.map((item) => item.data),
        });
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
              category: normalizedCategory,
              date: payload.data,
              notes: data.notes,
              recorrente: data.recorrente,
              recurrenceMonths: data.recorrente ? recurringOccurrencesTotal : undefined,
              recurrenceCurrent: data.recorrente ? 1 : undefined,
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
      const seriesTransactions = transactions.filter((item) => {
        return (
          buildSeriesMatcher(transaction)(item) &&
          normalizeComparableDate(item.date) >= normalizeComparableDate(transaction.date) &&
          hasValidDeleteCandidates(item)
        );
      });

      const uniqueSeriesTransactions = Array.from(
        new Map(seriesTransactions.map((item) => [getTransactionIdentityKey(item), item])).values(),
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
    if (transaction.type === "ia") {
      showMessage("Edição indisponível", "Ações financeiras IA não podem ser editadas por este formulário.");
      return;
    }

    const currentDate = normalizeComparableDate(transaction.date);
    const recurrenceMonths = transaction.recorrente
      ? Math.max(
          1,
          getRecurringSeriesTransactions(transaction).filter(
            (item) => normalizeComparableDate(item.date) >= currentDate,
          ).length,
        )
      : undefined;

    setEditingTransaction({
      ...transaction,
      ...(recurrenceMonths ? { recurrenceMonths } : {}),
    });
    setPrefilledTransaction(null);
    setQuickActionType(null);
    setOpenedFromDashboard(false);
    setModalOpen(true);
  };

  const getValidDeleteCandidates = (transaction: Transaction) =>
    (transaction.deleteCandidates ?? []).filter((candidate) => {
      const normalized = String(candidate ?? "").trim();
      return (
        normalized.length > 0 &&
        !normalized.startsWith("tx-local-") &&
        !/^tx-\d+$/.test(normalized)
      );
    });

  const getDeletableMonthTransactions = (monthValue: string) =>
    getTransactionsForMonth(monthValue)
      .map((transaction) => ({
        ...transaction,
        deleteCandidates: getValidDeleteCandidates(transaction),
      }))
      .filter((transaction) => transaction.deleteCandidates && transaction.deleteCandidates.length > 0);

  const executeDeleteMonth = async () => {
    const selectedMonthValue = initialPeriod.startDate
      ? getMonthValueFromDate(initialPeriod.startDate)
      : "";
    const selectedPeriod = getPeriodFromMonth(selectedMonthValue);

    if (!selectedMonthValue || !selectedPeriod) {
      showMessage("Selecione um mês", "Escolha um mês específico antes de excluir.");
      return;
    }

    const monthTransactions = getDeletableMonthTransactions(selectedMonthValue);

    if (monthTransactions.length === 0) {
      showMessage("Sem lançamentos", `Não há lançamentos excluíveis em ${selectedPeriod.label}.`);
      return;
    }

    try {
      setLoading(true);
      setDeleteMonthPromptOpen(false);

      let deletedCount = 0;
      let failedCount = 0;
      let lastError: unknown = null;

      for (const transaction of monthTransactions) {
        let deleted = false;

        for (const candidateId of transaction.deleteCandidates ?? []) {
          try {
            await apiService.deleteTransaction(candidateId, transaction.type);
            deleted = true;
            deletedCount += 1;
            break;
          } catch (error) {
            lastError = error;
            console.log("[Transactions] month delete candidate failed:", {
              transactionId: transaction.id,
              backendId: transaction.backendId,
              type: transaction.type,
              candidateId,
              message: String((error as any)?.message ?? error),
            });
            // Continue trying other candidate IDs for the same transaction.
          }
        }

        if (!deleted) {
          failedCount += 1;
        }
      }

      if (deletedCount === 0) {
        throw lastError ?? new Error("Não foi possível excluir os lançamentos deste mês.");
      }

      await loadTransactions();

      if (failedCount > 0) {
        showMessage(
          "Sucesso parcial",
          `${deletedCount} lançamentos de ${selectedPeriod.label} foram excluídos e ${failedCount} não puderam ser removidos.`,
        );
        return;
      }

      showMessage("Sucesso", `${deletedCount} lançamentos de ${selectedPeriod.label} foram excluídos.`);
    } catch (error: any) {
      const message = String(error?.message ?? "Não foi possível excluir o mês selecionado.");
      showMessage("Erro", message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMonth = () => {
    const selectedMonthValue = initialPeriod.startDate
      ? getMonthValueFromDate(initialPeriod.startDate)
      : "";
    const selectedPeriod = getPeriodFromMonth(selectedMonthValue);

    if (!selectedMonthValue || !selectedPeriod) {
      showMessage("Selecione um mês", "Escolha um mês específico antes de excluir.");
      return;
    }

    const normalCount = getDeletableMonthTransactions(selectedMonthValue).length;

    if (normalCount === 0) {
      showMessage("Sem lançamentos", `Não há lançamentos excluíveis em ${selectedPeriod.label}.`);
      return;
    }

    setDeleteMonthPromptOpen(true);
  };

  const handleDelete = (id: string) => {
    const transaction = transactions.find((item) => item.id === id);
    if (!transaction) return;

    const validDeleteCandidates = getValidDeleteCandidates(transaction);

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
      const type = item.type === "income" ? "Receita" : item.type === "expense" ? "Despesa" : "Ação IA";
      const valuePrefix = item.type === "income" ? "+" : item.type === "expense" ? "-" : "";
      const value = `${valuePrefix}${valuePrefix ? " " : ""}R$ ${formatCurrency(item.amount)}`;
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

  const selectedDeleteMonthValue = initialPeriod.startDate
    ? getMonthValueFromDate(initialPeriod.startDate)
    : "";
  const selectedDeletePeriod = getPeriodFromMonth(selectedDeleteMonthValue);
  const deleteMonthDeleteCount = selectedDeleteMonthValue
    ? getDeletableMonthTransactions(selectedDeleteMonthValue).length
    : 0;

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

          <View style={[styles.main, { flex: 1, paddingHorizontal: 28, paddingVertical: 24 }]}>
            {/* Header acima da lista */}
            <View
              style={[
                styles.header,
                !isLargeScreen && styles.headerCompact,
                { marginBottom: 16 }
              ]}
            >
              <View style={styles.titleBlock}>
                <Text
                  style={[
                    styles.title,
                    !isLargeScreen && styles.titleCompact,
                  ]}
                >
                  {pageTitle}
                </Text>
              </View>
              <View
                style={[
                  styles.headerActions,
                  !isLargeScreen && styles.headerActionsCompact,
                ]}
              >
              <TouchableOpacity
                style={[styles.copyMonthButton, loading && styles.headerButtonDisabled]}
                onPress={handleCopyCurrentMonth}
                disabled={loading}
              >
                <Text style={styles.copyMonthButtonText}>Copiar mês</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deleteMonthButton,
                  (!initialPeriod.startDate || loading) && styles.headerButtonDisabled,
                ]}
                onPress={handleDeleteMonth}
                disabled={!initialPeriod.startDate || loading}
              >
                <Text style={styles.deleteMonthButtonText}>Excluir mês</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.exportButton, loading && styles.headerButtonDisabled]}
                onPress={handleExportPdf}
                disabled={loading}
              >
                <Text style={styles.exportButtonText}>Exportar PDF</Text>
              </TouchableOpacity>
            </View>
            </View>

            {/* TransactionList com wrapper de estilos */}
            <View
              style={[
                styles.pageContent,
                !isLargeScreen && styles.pageContentCompact,
                isCompactScreen && styles.pageContentPhone,
                { flex: 1 }
              ]}
            >
              <TransactionList
                transactions={transactions}
                onEdit={handleEdit}
                onDelete={handleDelete}
                initialStartDate={initialPeriod.startDate}
                initialEndDate={initialPeriod.endDate}
                periodSyncToken={periodSyncToken}
                periodLabel={selectedMonthLabel}
                onOpenPeriodPicker={openPeriodPrompt}
                onExportContextChange={setExportContext}
              />
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
                <Text style={styles.modalTitle}>{effectiveModalTitle}</Text>
                <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
                  <Text style={styles.modalCloseButtonText}>Voltar</Text>
                </TouchableOpacity>
              </View>
              <TransactionForm
                onSubmit={handleSubmit}
                initialData={transactionFormInitialData}
                isLoading={loading}
                onCancel={closeModal}
              />
            </View>
          </View>
        </Modal>

        <Pressable
          style={[
            styles.floatingButton,
            !isLargeScreen && styles.floatingButtonCompact,
            { bottom: floatingButtonBottom },
          ]}
          onPress={openNewTransaction}
          hitSlop={10}
        >
          <Text style={styles.floatingButtonText}>+ Nova Transação</Text>
        </Pressable>

        <Modal visible={periodPromptOpen} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => {
                setYearSelectOpen(false);
                setPeriodPromptOpen(false);
              }}
            />
            <View style={styles.periodPromptContent}>
              <Text style={styles.periodPromptTitle}>Selecionar período</Text>
              <Text style={styles.periodPromptText}>
                Escolha o ano e toque no mês para aplicar.
              </Text>

              <TouchableOpacity
                style={[
                  styles.periodQuickOption,
                  !initialPeriod.startDate && styles.periodQuickOptionActive,
                ]}
                onPress={() => applyMonthPeriod()}
              >
                <Text
                  style={[
                    styles.periodQuickOptionLabel,
                    !initialPeriod.startDate && styles.periodQuickOptionLabelActive,
                  ]}
                >
                  Todos os períodos
                </Text>
                <Text
                  style={[
                    styles.periodQuickOptionHint,
                    !initialPeriod.startDate && styles.periodQuickOptionHintActive,
                  ]}
                >
                  Mostrar todas as transações
                </Text>
              </TouchableOpacity>

              <View style={styles.periodYearSelector}>
                <Text style={styles.periodSectionLabel}>Ano</Text>
                <TouchableOpacity
                  style={styles.periodYearTrigger}
                  onPress={() => setYearSelectOpen((current) => !current)}
                >
                  <Text style={styles.periodYearTriggerText}>{yearDraft}</Text>
                  <Text style={styles.periodYearTriggerArrow}>{yearSelectOpen ? "▲" : "▼"}</Text>
                </TouchableOpacity>

                {yearSelectOpen && (
                  <View style={styles.periodYearDropdown}>
                    {availableYears.map((year) => {
                      const isActive = yearDraft === year;

                      return (
                        <TouchableOpacity
                          key={year}
                          style={[styles.periodYearOption, isActive && styles.periodYearOptionActive]}
                          onPress={() => {
                            setYearDraft(year);
                            setYearSelectOpen(false);
                          }}
                        >
                          <Text
                            style={[styles.periodYearOptionText, isActive && styles.periodYearOptionTextActive]}
                          >
                            {year}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              <View style={styles.periodMonthGrid}>
                {MONTH_PICKER_NAMES.map((monthLabel, index) => {
                  const monthValue = `${String(index + 1).padStart(2, "0")}-${yearDraft}`;
                  const isActive = Boolean(initialPeriod.startDate) && monthDraft === monthValue;

                  return (
                    <TouchableOpacity
                      key={monthValue}
                      style={[styles.periodMonthChip, isActive && styles.periodMonthChipActive]}
                      onPress={() => applyMonthPeriod(monthValue)}
                    >
                      <Text
                        style={[styles.periodMonthChipText, isActive && styles.periodMonthChipTextActive]}
                      >
                        {monthLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.periodPromptActions}>
                <TouchableOpacity
                  style={styles.periodPromptButton}
                  onPress={() => {
                    setYearSelectOpen(false);
                    setPeriodPromptOpen(false);
                  }}
                >
                  <Text style={styles.periodPromptButtonText}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={deleteMonthPromptOpen} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalBackdrop} onPress={() => setDeleteMonthPromptOpen(false)} />
            <View style={styles.deleteMonthPromptContent}>
              <Text style={styles.deleteMonthPromptTitle}>Excluir mês</Text>
              <Text style={styles.deleteMonthPromptText}>
                {selectedDeletePeriod
                  ? `A exclusão em lote vai percorrer todas as transações excluíveis de ${selectedDeletePeriod.label}.`
                  : "Escolha o que deseja excluir no mês selecionado."}
              </Text>

              <TouchableOpacity
                style={[
                  styles.deleteMonthOptionButton,
                  deleteMonthDeleteCount === 0 && styles.headerButtonDisabled,
                ]}
                onPress={() => {
                  void executeDeleteMonth();
                }}
                disabled={deleteMonthDeleteCount === 0 || loading}
              >
                <Text style={styles.deleteMonthOptionTitle}>Excluir transações</Text>
                <Text style={styles.deleteMonthOptionText}>
                  {deleteMonthDeleteCount} lançamentos excluíveis
                </Text>
              </TouchableOpacity>

              <View style={styles.deleteMonthPromptActions}>
                <TouchableOpacity
                  style={styles.periodPromptButton}
                  onPress={() => setDeleteMonthPromptOpen(false)}
                >
                  <Text style={styles.periodPromptButtonText}>Cancelar</Text>
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
  scrollFrame: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingVertical: 24,
    width: "100%",
    maxWidth: 1330,
    alignSelf: "center",
  },
  scrollContentCompact: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    paddingBottom: 124,
  },
  scrollContentPhone: {
    paddingHorizontal: 12,
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
  pageContentCompact: {
    padding: 16,
    borderRadius: 22,
    gap: 12,
  },
  pageContentPhone: {
    padding: 12,
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
  headerCompact: {
    flexDirection: "column",
    gap: 14,
  },
  title: {
    fontSize: 38,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -1.1,
  },
  titleCompact: {
    fontSize: 28,
    letterSpacing: -0.6,
  },
  titleBlock: {
    gap: 10,
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  headerActionsCompact: {
    width: "100%",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  headerButtonDisabled: {
    opacity: 0.6,
  },
  copyMonthButton: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.28)",
    flexGrow: 1,
    alignItems: "center",
  },
  copyMonthButtonText: {
    color: "#1d4ed8",
    fontSize: 13,
    fontWeight: "700",
  },
  deleteMonthButton: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.24)",
    flexGrow: 1,
    alignItems: "center",
  },
  deleteMonthButtonText: {
    color: "#b91c1c",
    fontSize: 13,
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
    flexGrow: 1,
    alignItems: "center",
  },
  exportButtonText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "700",
  },
  secondaryHeaderButton: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.28)",
  },
  secondaryHeaderButtonText: {
    color: "#334155",
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
    zIndex: 100,
  },
  floatingButtonCompact: {
    left: 14,
    right: 14,
    alignItems: "center",
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
    height: "88%",
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
    maxWidth: 380,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
  },
  periodPromptTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  periodPromptText: {
    fontSize: 13,
    color: "#64748b",
  },
  periodQuickOption: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  periodQuickOptionActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  periodQuickOptionLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  periodQuickOptionLabelActive: {
    color: "#f8fafc",
  },
  periodQuickOptionHint: {
    fontSize: 13,
    color: "#64748b",
  },
  periodQuickOptionHintActive: {
    color: "rgba(248,250,252,0.78)",
  },
  periodSectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  periodYearSelector: {
    gap: 10,
  },
  periodYearTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.24)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  periodYearTriggerText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  periodYearTriggerArrow: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
  },
  periodYearDropdown: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  periodYearOption: {
    minWidth: 76,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.24)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  periodYearOptionActive: {
    backgroundColor: "#dbeafe",
    borderColor: "#60a5fa",
  },
  periodYearOptionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },
  periodYearOptionTextActive: {
    color: "#1d4ed8",
  },
  periodMonthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  periodMonthChip: {
    width: "31%",
    minWidth: 0,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.24)",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  periodMonthChipActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  periodMonthChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
    textAlign: "center",
  },
  periodMonthChipTextActive: {
    color: "#f8fafc",
  },
  periodPromptActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  periodPromptButton: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: "#e2e8f0",
  },
  periodPromptButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  deleteMonthPromptContent: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
  },
  deleteMonthPromptTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  deleteMonthPromptText: {
    fontSize: 13,
    color: "#64748b",
  },
  deleteMonthOptionButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.24)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  deleteMonthOptionDanger: {
    borderColor: "rgba(220, 38, 38, 0.24)",
    backgroundColor: "#fff7f7",
  },
  deleteMonthOptionInfo: {
    borderColor: "rgba(59, 130, 246, 0.2)",
    backgroundColor: "#f8fbff",
  },
  deleteMonthOptionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  deleteMonthOptionText: {
    fontSize: 13,
    color: "#64748b",
  },
  deleteMonthPromptActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});
