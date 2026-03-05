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

const DASHBOARD_GRADIENT = ["#000000", "#073D33", "#107A65", "#20F4CA"] as const;

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
        description: String(t?.description ?? t?.descricao ?? ""),
        amount: Number(t?.amount ?? t?.valor ?? t?.value ?? 0),
        type: (() => {
          const rawType = String(t?.type ?? t?.tipo ?? "").toLowerCase().trim();
          if (rawType === "income" || rawType === "icome" || rawType === "receita") return "income";
          return "expense";
        })(),
        category: String(t?.category ?? t?.categoria ?? "Sem categoria"),
        date: String(t?.date ?? t?.data ?? new Date().toISOString()),
        notes: t?.notes ?? t?.observacao ?? undefined,
      };
    }).map((transaction, index) => ({
        ...transaction,
        id: `${transaction.type}-${transaction.backendId}-${index}`,
      }));
      setTransactions(normalized);
    } catch (error: any) {
      setTransactions([]);
      const message = String(error?.message ?? "Nao foi possivel carregar transacoes");
      showMessage("Erro", `Nao foi possivel carregar transacoes: ${message}`);
    }
  };

  const handleSubmit = async (data: TransactionFormData) => {
    try {
      setLoading(true);

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
      } else if (data.type === "expense") {
        await apiService.createDespesa(payload);
      } else {
        await apiService.createReceita({
          ...payload,
          categoria: data.category,
        });
      }

      showMessage("Sucesso", editingTransaction ? "Transacao atualizada com sucesso!" : "Transacao cadastrada com sucesso!");
      await loadTransactions();
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

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setQuickActionType(null);
    setOpenedFromDashboard(false);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const transaction = transactions.find((item) => item.id === id);
    if (!transaction) return;

    if (!transaction?.backendId || transaction.backendId.startsWith("tx-")) {
      showMessage("Erro", "Esta transacao nao possui um ID valido para exclusao.");
      return;
    }

   if (Platform.OS === "web") {
  Alert.alert(
    "Excluir transacao",
    "Tem certeza que deseja excluir esta transacao?",
    [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => {
          if (transaction) {
            void executeDelete(transaction);
          }
        },
      },
    ]
  );
  return;
}

    Alert.alert("Excluir transacao", "Tem certeza que deseja excluir esta transacao?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => {
          void executeDelete(transaction);
        },
      },
    ]);
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
    borderRightColor: "#d9dde5",
    backgroundColor: "#f8f8fa",
  },
  sidebarContent: {
    paddingVertical: 24,
  },
  main: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
    width: "100%",
    maxWidth: 1330,
    alignSelf: "center",
  },
  pageContent: {
    flex: 1,
    gap: 16,
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
    color: "#666666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#ffffff",
  },
  titleBlock: {
    gap: 6,
  },
  periodSwitchButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.45)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  periodSwitchButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  exportButton: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportButtonText: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "700",
  },
  floatingButton: {
    position: "absolute",
    right: 18,
    backgroundColor: "#0B6E5B",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    zIndex: 20,
  },
  floatingButtonText: {
    color: "#ECFEFF",
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
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  modalCloseButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  modalCloseButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  periodPromptContent: {
    width: "100%",
    maxWidth: 760,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    padding: 18,
    gap: 12,
  },
  periodPromptTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  periodPromptText: {
    fontSize: 13,
    color: "#4b5563",
  },
  periodInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 13,
    color: "#111827",
  },
  periodPromptActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  periodPromptButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  periodPromptApplyButton: {
    backgroundColor: "#0B6E5B",
  },
  periodPromptApplyText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ECFEFF",
  },
});

