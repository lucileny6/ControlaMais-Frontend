import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardNav } from "@/components/dashboard-nav";
import { normalizeDashboardTransaction, parseTransactionDate } from "@/lib/monthly-finance";
import { DashboardTransaction, TransactionType } from "@/lib/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { apiService } from "@/services/api";

const DASHBOARD_GRADIENT = ["#F4F8FC", "#EDF3F8", "#E7EEF6", "#E1EAF4"] as const;
type ReportTypeFilter = "all" | TransactionType;

const formatCurrency = (amount: number) =>
  Number(amount || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const normalizeCategory = (value: string) => {
  const normalized = String(value ?? "").trim();
  return normalized || "Sem categoria";
};

const normalizeCategoryKey = (value: string) =>
  normalizeCategory(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const formatInputDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
};

const createStartOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
const createEndOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const parseFilterDate = (value: string) => {
  const parsed = parseTransactionDate(value);
  return parsed ? createStartOfDay(parsed) : null;
};

const getInitialPeriod = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: formatInputDate(start),
    end: formatInputDate(end),
  };
};

export default function ReportsPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const initialPeriod = getInitialPeriod();

  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(true);
  const [allTransactions, setAllTransactions] = useState<DashboardTransaction[]>([]);
  const [startInput, setStartInput] = useState(initialPeriod.start);
  const [endInput, setEndInput] = useState(initialPeriod.end);
  const [appliedStartDate, setAppliedStartDate] = useState(initialPeriod.start);
  const [appliedEndDate, setAppliedEndDate] = useState(initialPeriod.end);
  const [typeFilter, setTypeFilter] = useState<ReportTypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [exportStatus, setExportStatus] = useState("Escolha os filtros e gere o PDF quando quiser.");

  useEffect(() => {
    void checkAuthentication();
  }, []);

  useEffect(() => {
    if (!isLoadingAuth) {
      void loadReportData();
    }
  }, [isLoadingAuth]);

  useFocusEffect(
    useCallback(() => {
      if (!isLoadingAuth) {
        void loadReportData();
      }
    }, [isLoadingAuth]),
  );

  const periodRange = useMemo(() => {
    const start = parseFilterDate(appliedStartDate) ?? createStartOfDay(new Date());
    const rawEnd = parseTransactionDate(appliedEndDate) ?? new Date();
    const end = createEndOfDay(rawEnd);
    return { start, end };
  }, [appliedEndDate, appliedStartDate]);

  const periodTransactions = useMemo(
    () =>
      allTransactions.filter((transaction) => {
        const parsedDate = parseTransactionDate(transaction.date);
        if (!parsedDate) return false;
        const timestamp = parsedDate.getTime();
        return timestamp >= periodRange.start.getTime() && timestamp <= periodRange.end.getTime();
      }),
    [allTransactions, periodRange.end, periodRange.start],
  );

  const availableCategories = useMemo(() => {
    const filteredByType =
      typeFilter === "all"
        ? periodTransactions
        : periodTransactions.filter((transaction) => transaction.type === typeFilter);

    const categoryMap = new Map<string, string>();

    filteredByType.forEach((transaction) => {
      const label = normalizeCategory(transaction.category);
      const key = normalizeCategoryKey(label);
      if (!categoryMap.has(key)) {
        categoryMap.set(key, label);
      }
    });

    return [...categoryMap.values()].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [periodTransactions, typeFilter]);

  useEffect(() => {
    if (categoryFilter !== "all" && !availableCategories.includes(categoryFilter)) {
      setCategoryFilter("all");
    }
  }, [availableCategories, categoryFilter]);

  const filteredTransactions = useMemo(
    () =>
      periodTransactions.filter((transaction) => {
        if (typeFilter !== "all" && transaction.type !== typeFilter) return false;
        if (
          categoryFilter !== "all" &&
          normalizeCategoryKey(transaction.category) !== normalizeCategoryKey(categoryFilter)
        ) {
          return false;
        }
        return true;
      }),
    [categoryFilter, periodTransactions, typeFilter],
  );

  const incomeTransactions = useMemo(
    () =>
      [...filteredTransactions]
        .filter((transaction) => transaction.type === "income")
        .sort((a, b) => b.amount - a.amount),
    [filteredTransactions],
  );

  const expenseTransactions = useMemo(
    () =>
      [...filteredTransactions]
        .filter((transaction) => transaction.type === "expense")
        .sort((a, b) => b.amount - a.amount),
    [filteredTransactions],
  );

  const totalIncome = useMemo(() => incomeTransactions.reduce((acc, transaction) => acc + transaction.amount, 0), [incomeTransactions]);
  const totalExpenses = useMemo(() => expenseTransactions.reduce((acc, transaction) => acc + transaction.amount, 0), [expenseTransactions]);
  const balance = totalIncome - totalExpenses;
  const showIncomeColumn = typeFilter !== "expense";
  const showExpenseColumn = typeFilter !== "income";

  const periodLabel = useMemo(() => {
    const start = periodRange.start.toLocaleDateString("pt-BR");
    const end = periodRange.end.toLocaleDateString("pt-BR");
    return start === end ? start : `${start} ate ${end}`;
  }, [periodRange.end, periodRange.start]);

  const checkAuthentication = async () => {
    try {
      const [authToken, legacyAuthToken] = await Promise.all([
        AsyncStorage.getItem("authToken"),
        AsyncStorage.getItem("@authToken"),
      ]);

      if (!(authToken || legacyAuthToken)) {
        router.replace("/login");
      }
    } catch (error) {
      console.error("Erro ao verificar autenticacao:", error);
      router.replace("/login");
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const loadReportData = async () => {
    try {
      setIsLoadingReport(true);

      const rawTransactions = await Promise.race<any[]>([
        apiService.getTransactions(),
        new Promise<any[]>((resolve) => setTimeout(() => resolve([]), 8000)),
      ]);

      const normalizedTransactions = (rawTransactions ?? []).map((transaction: any, index: number) =>
        normalizeDashboardTransaction(transaction, index),
      );

      setAllTransactions(normalizedTransactions);
    } catch (error) {
      console.error("Erro ao carregar dados de relatórios:", error);
      setAllTransactions([]);
    } finally {
      setIsLoadingReport(false);
    }
  };

  const applyPeriodFilter = () => {
    const start = parseFilterDate(startInput);
    const end = parseTransactionDate(endInput);

    if (!start || !end) {
      Alert.alert("Periodo invalido", "Use o formato DD-MM-AAAA. Exemplo: 26-03-2026");
      return;
    }

    if (createStartOfDay(start).getTime() > createEndOfDay(end).getTime()) {
      Alert.alert("Periodo invalido", "A data inicial precisa ser menor ou igual a data final.");
      return;
    }

    setAppliedStartDate(startInput);
    setAppliedEndDate(endInput);
    setExportStatus("Periodo atualizado. Agora voce ja pode gerar o PDF.");
  };

  const handleExportPdf = (silent = false) => {
    if (Platform.OS !== "web") {
      if (!silent) {
        Alert.alert("Gerar PDF", "No app mobile, use a versao web para exportar PDF.");
      }
      setExportStatus("No app mobile, a exportacao em PDF fica disponivel na versao web.");
      return false;
    }

    if (filteredTransactions.length === 0) {
      if (!silent) {
        Alert.alert("Gerar PDF", "Não há dados neste período para exportar.");
      }
      setExportStatus("Nao ha dados no filtro selecionado para gerar o PDF.");
      return false;
    }

    const webEnv = globalThis as {
      document?: {
        body?: { appendChild: (node: unknown) => void; removeChild: (node: unknown) => void };
        createElement?: (tag: string) => {
          href: string;
          download: string;
          click: () => void;
        };
      };
      URL?: { createObjectURL?: (obj: unknown) => string; revokeObjectURL?: (url: string) => void };
      Blob?: typeof Blob;
      TextEncoder?: typeof TextEncoder;
    };

    if (
      !webEnv.document?.createElement ||
      !webEnv.document?.body ||
      !webEnv.URL?.createObjectURL ||
      !webEnv.Blob ||
      !webEnv.TextEncoder
    ) {
      if (!silent) {
        Alert.alert("Gerar PDF", "Exportacao PDF indisponivel neste ambiente.");
      }
      setExportStatus("A exportacao em PDF nao esta disponivel neste ambiente.");
      return false;
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
      const base = removeAccents(String(value ?? "")).replace(/[^\x20-\x7E]/g, " ").trim();
      if (base.length >= width) return `${base.slice(0, Math.max(0, width - 1))} `;
      return base.padEnd(width, " ");
    };

    const compactCurrency = (amount: number) =>
      Number(amount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

    const buildColumnRows = (transactions: DashboardTransaction[]) =>
      [...transactions]
        .sort((a, b) => {
          const aTime = parseTransactionDate(a.date)?.getTime() ?? 0;
          const bTime = parseTransactionDate(b.date)?.getTime() ?? 0;
          return bTime - aTime;
        })
        .map((transaction) => {
          const label = transaction.description || normalizeCategory(transaction.category);
          return `${fitCell(label, 24)}${fitCell(`R$ ${compactCurrency(transaction.amount)}`, 16)}`;
        });

    const incomeColumnRows = showIncomeColumn ? buildColumnRows(incomeTransactions) : [];
    const expenseColumnRows = showExpenseColumn ? buildColumnRows(expenseTransactions) : [];
    const columnRowCount = Math.max(incomeColumnRows.length, expenseColumnRows.length);

    const detailRows = Array.from({ length: columnRowCount }, (_, index) => {
      const incomeRow = incomeColumnRows[index] ?? `${fitCell("", 24)}${fitCell("", 16)}`;
      const expenseRow = expenseColumnRows[index] ?? `${fitCell("", 24)}${fitCell("", 16)}`;

      if (showIncomeColumn && showExpenseColumn) {
        return `${incomeRow}    ${expenseRow}`;
      }

      return showIncomeColumn ? incomeRow : expenseRow;
    });

    const columnHeader = showIncomeColumn && showExpenseColumn
      ? `${fitCell("RECEITAS", 24)}${fitCell("VALOR", 16)}    ${fitCell("DESPESAS", 24)}${fitCell("VALOR", 16)}`
      : showIncomeColumn
        ? `${fitCell("RECEITAS", 24)}${fitCell("VALOR", 16)}`
        : `${fitCell("DESPESAS", 24)}${fitCell("VALOR", 16)}`;

    const totalsRow = showIncomeColumn && showExpenseColumn
      ? `${fitCell("TOTAL RECEITAS", 24)}${fitCell(`R$ ${compactCurrency(totalIncome)}`, 16)}    ${fitCell("TOTAL DESPESAS", 24)}${fitCell(`R$ ${compactCurrency(totalExpenses)}`, 16)}`
      : showIncomeColumn
        ? `${fitCell("TOTAL RECEITAS", 24)}${fitCell(`R$ ${compactCurrency(totalIncome)}`, 16)}`
        : `${fitCell("TOTAL DESPESAS", 24)}${fitCell(`R$ ${compactCurrency(totalExpenses)}`, 16)}`;

    const lines = [
      "RELATORIO FINANCEIRO",
      `Gerado em ${new Date().toLocaleDateString("pt-BR")}`,
      " ",
      `Periodo: ${periodLabel}`,
      `Tipo: ${typeFilter === "all" ? "Todos" : typeFilter === "income" ? "Receitas" : "Despesas"}`,
      `Categoria: ${categoryFilter === "all" ? "Todas" : categoryFilter}`,
      " ",
      columnHeader,
      "-".repeat(88),
      ...detailRows,
      "-".repeat(88),
      totalsRow,
      " ",
      `SALDO FINAL: R$ ${compactCurrency(balance)}`,
    ].slice(0, 46);

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
    link.download = `relatorio-${new Date().toISOString().slice(0, 10)}.pdf`;
    webEnv.document.body.appendChild(link);
    link.click();
    webEnv.document.body.removeChild(link);

    setTimeout(() => {
      webEnv.URL?.revokeObjectURL?.(url);
    }, 3000);

    setExportStatus("PDF gerado com sucesso. Se quiser, voce pode gerar novamente com outros filtros.");
    return true;
  };

  if (isLoadingAuth || isLoadingReport) {
    return (
      <LinearGradient colors={DASHBOARD_GRADIENT} locations={[0, 0.3, 0.57, 0.82, 1]} style={styles.gradient}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10233f" />
          <Text style={styles.loadingText}>Carregando relatório...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={DASHBOARD_GRADIENT} locations={[0, 0.3, 0.57, 0.82, 1]} style={styles.gradient}>
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
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.pageCard}>
                <View style={styles.topBar}>
                  <View>
                    <Text style={styles.title}>Relatório Financeiro</Text>
                    <Text style={styles.subtitle}>
                      Filtre por período, tipo e categoria ou veja o resumo em gráfico.
                    </Text>
                  </View>

                  <TouchableOpacity style={styles.exportButton} onPress={() => void handleExportPdf()}>
                    <Text style={styles.exportButtonText}>Gerar PDF</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.filtersCard}>
                  <View style={styles.filterBlock}>
                    <Text style={styles.filterLabel}>Periodo</Text>
                    <View style={styles.periodRow}>
                      <TextInput
                        style={styles.dateInput}
                        placeholder="DD-MM-AAAA"
                        value={startInput}
                        onChangeText={setStartInput}
                      />
                      <TextInput
                        style={styles.dateInput}
                        placeholder="DD-MM-AAAA"
                        value={endInput}
                        onChangeText={setEndInput}
                      />
                      <TouchableOpacity style={styles.applyButton} onPress={applyPeriodFilter}>
                        <Text style={styles.applyButtonText}>Aplicar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.filterBlock}>
                    <Text style={styles.filterLabel}>Tipo</Text>
                    <View style={styles.chipRow}>
                      {[
                        { label: "Todos", value: "all" as ReportTypeFilter },
                        { label: "Receitas", value: "income" as ReportTypeFilter },
                        { label: "Despesas", value: "expense" as ReportTypeFilter },
                      ].map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[styles.filterChip, typeFilter === option.value && styles.filterChipActive]}
                          onPress={() => {
                            setTypeFilter(option.value);
                            setExportStatus("Tipo atualizado. Gere o PDF quando terminar os filtros.");
                          }}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              typeFilter === option.value && styles.filterChipTextActive,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.filterBlock}>
                    <Text style={styles.filterLabel}>Categoria</Text>
                    <TouchableOpacity
                      style={styles.selectTrigger}
                      onPress={() => setShowCategoryPicker(true)}
                    >
                      <Text style={styles.selectTriggerText}>
                        {categoryFilter === "all" ? "Todas" : categoryFilter}
                      </Text>
                      <Text style={styles.selectTriggerArrow}>▼</Text>
                    </TouchableOpacity>
                  </View>

                </View>

                <Text style={styles.periodLabel}>Periodo selecionado: {periodLabel}</Text>

                <View style={styles.exportStatusCard}>
                  <Text style={styles.exportStatusTitle}>Relatório</Text>
                  <Text style={styles.exportStatusText}>{exportStatus}</Text>

                  <View style={[styles.summaryCards, !isLargeScreen && styles.summaryCardsStacked]}>
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryCardLabel}>Receitas</Text>
                      <Text style={[styles.summaryCardValue, styles.positiveValue]}>{formatCurrency(totalIncome)}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryCardLabel}>Despesas</Text>
                      <Text style={[styles.summaryCardValue, styles.negativeValue]}>{formatCurrency(totalExpenses)}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryCardLabel}>Saldo Final</Text>
                      <Text style={[styles.summaryCardValue, balance >= 0 ? styles.positiveValue : styles.negativeValue]}>
                        {formatCurrency(balance)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.previewButton}
                      onPress={() => setShowPreviewModal(true)}
                    >
                      <Text style={styles.previewButtonText}>Visualizar relatório</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.generateButton}
                      onPress={() => {
                        setExportStatus("Gerando o PDF do relatório...");
                        handleExportPdf();
                      }}
                    >
                      <Text style={styles.generateButtonText}>Gerar PDF</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>

        <Modal
          transparent
          visible={showPreviewModal}
          animationType="fade"
          onRequestClose={() => setShowPreviewModal(false)}
        >
          <View style={styles.previewOverlay}>
            <View style={styles.previewContent}>
              <View style={styles.previewHeader}>
                <View>
                  <Text style={styles.previewTitle}>Prévia do relatório</Text>
                  <Text style={styles.previewSubtitle}>{periodLabel}</Text>
                </View>

                <TouchableOpacity
                  style={styles.previewCloseButton}
                  onPress={() => setShowPreviewModal(false)}
                >
                  <Text style={styles.previewCloseButtonText}>Fechar</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.previewMeta}>
                Tipo: {typeFilter === "all" ? "Todos" : typeFilter === "income" ? "Receitas" : "Despesas"} | Categoria:{" "}
                {categoryFilter === "all" ? "Todas" : categoryFilter}
              </Text>

              <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.previewGrid}>
                  {showIncomeColumn && (
                    <View style={[styles.previewColumn, !showExpenseColumn && styles.previewColumnFull]}>
                      <View style={[styles.previewColumnHeader, styles.previewIncomeHeader]}>
                        <Text style={styles.previewColumnHeaderText}>Receitas</Text>
                      </View>

                      {incomeTransactions.length === 0 ? (
                        <View style={styles.previewEmptyState}>
                          <Text style={styles.previewEmptyText}>Nenhuma receita neste filtro.</Text>
                        </View>
                      ) : (
                        incomeTransactions.map((transaction) => (
                          <View key={transaction.id} style={styles.previewRow}>
                            <View style={styles.previewRowCopy}>
                              <Text style={styles.previewRowTitle}>
                                {transaction.description || normalizeCategory(transaction.category)}
                              </Text>
                              <Text style={styles.previewRowMeta}>{normalizeCategory(transaction.category)}</Text>
                            </View>
                            <Text style={styles.previewRowValue}>{formatCurrency(transaction.amount)}</Text>
                          </View>
                        ))
                      )}

                      <View style={styles.previewTotalBox}>
                        <Text style={styles.previewTotalLabel}>Total de Receitas</Text>
                        <Text style={[styles.previewTotalValue, styles.positiveValue]}>{formatCurrency(totalIncome)}</Text>
                      </View>
                    </View>
                  )}

                  {showExpenseColumn && (
                    <View style={[styles.previewColumn, !showIncomeColumn && styles.previewColumnFull]}>
                      <View style={[styles.previewColumnHeader, styles.previewExpenseHeader]}>
                        <Text style={styles.previewColumnHeaderText}>Despesas</Text>
                      </View>

                      {expenseTransactions.length === 0 ? (
                        <View style={styles.previewEmptyState}>
                          <Text style={styles.previewEmptyText}>Nenhuma despesa neste filtro.</Text>
                        </View>
                      ) : (
                        expenseTransactions.map((transaction) => (
                          <View key={transaction.id} style={styles.previewRow}>
                            <View style={styles.previewRowCopy}>
                              <Text style={styles.previewRowTitle}>
                                {transaction.description || normalizeCategory(transaction.category)}
                              </Text>
                              <Text style={styles.previewRowMeta}>{normalizeCategory(transaction.category)}</Text>
                            </View>
                            <Text style={styles.previewRowValue}>{formatCurrency(transaction.amount)}</Text>
                          </View>
                        ))
                      )}

                      <View style={styles.previewTotalBox}>
                        <Text style={styles.previewTotalLabel}>Total de Despesas</Text>
                        <Text style={[styles.previewTotalValue, styles.negativeValue]}>{formatCurrency(totalExpenses)}</Text>
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.previewBalanceBox}>
                  <Text style={styles.previewBalanceLabel}>Saldo Final</Text>
                  <Text style={[styles.previewBalanceValue, balance >= 0 ? styles.positiveValue : styles.negativeValue]}>
                    {formatCurrency(balance)}
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          transparent
          visible={showCategoryPicker}
          animationType="slide"
          onRequestClose={() => setShowCategoryPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Selecionar categoria</Text>

              <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                <TouchableOpacity
                  style={[styles.modalOption, categoryFilter === "all" && styles.modalOptionActive]}
                  onPress={() => {
                    setCategoryFilter("all");
                    setShowCategoryPicker(false);
                    setExportStatus("Categoria atualizada. Gere o PDF quando terminar os filtros.");
                  }}
                >
                  <Text style={styles.modalOptionText}>Todas</Text>
                </TouchableOpacity>

                {availableCategories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[styles.modalOption, categoryFilter === category && styles.modalOptionActive]}
                    onPress={() => {
                      setCategoryFilter(category);
                      setShowCategoryPicker(false);
                      setExportStatus("Categoria atualizada. Gere o PDF quando terminar os filtros.");
                    }}
                  >
                    <Text style={styles.modalOptionText}>{category}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCategoryPicker(false)}
              >
                <Text style={styles.modalCloseButtonText}>Fechar</Text>
              </TouchableOpacity>
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
    borderRightColor: "rgba(148, 163, 184, 0.18)",
    backgroundColor: "rgba(255, 255, 255, 0.78)",
  },
  sidebarContent: {
    paddingVertical: 24,
  },
  main: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingVertical: 24,
    width: "100%",
    maxWidth: 1380,
    alignSelf: "center",
  },
  pageCard: {
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.92)",
    padding: 26,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#64748b",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#314d6f",
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#6a7d96",
  },
  filtersCard: {
    marginTop: 22,
    padding: 18,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(205, 216, 227, 0.8)",
    gap: 16,
  },
  filterBlock: {
    gap: 10,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#314d6f",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  periodRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  dateInput: {
    minWidth: 150,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: "#10233f",
  },
  applyButton: {
    backgroundColor: "#10233f",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  applyButtonText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "700",
  },
  exportButton: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
  },
  exportButtonText: {
    color: "#314d6f",
    fontSize: 13,
    fontWeight: "700",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectTrigger: {
    minHeight: 46,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  selectTriggerText: {
    flex: 1,
    fontSize: 14,
    color: "#314d6f",
    fontWeight: "600",
  },
  selectTriggerArrow: {
    fontSize: 12,
    color: "#6a7d96",
  },
  filterChip: {
    backgroundColor: "#f8fbff",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.24)",
  },
  filterChipActive: {
    backgroundColor: "#10233f",
    borderColor: "#10233f",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5c708d",
  },
  filterChipTextActive: {
    color: "#f8fafc",
  },
  periodLabel: {
    marginTop: 16,
    marginBottom: 18,
    fontSize: 14,
    color: "#6a7d96",
  },
  exportStatusCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(205, 216, 227, 0.8)",
    padding: 22,
    gap: 18,
  },
  exportStatusTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#314d6f",
  },
  exportStatusText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5f748f",
  },
  summaryCards: {
    flexDirection: "row",
    gap: 14,
  },
  summaryCardsStacked: {
    flexDirection: "column",
  },
  summaryCard: {
    flex: 1,
    minWidth: 180,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(205, 216, 227, 0.8)",
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  summaryCardLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6a7d96",
    textTransform: "uppercase",
  },
  summaryCardValue: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: "800",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  previewButton: {
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
  },
  previewButtonText: {
    color: "#314d6f",
    fontSize: 13,
    fontWeight: "700",
  },
  generateButton: {
    alignSelf: "flex-start",
    backgroundColor: "#10233f",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  generateButtonText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "700",
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.42)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  previewContent: {
    width: "100%",
    maxWidth: 1100,
    maxHeight: "86%",
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(203, 213, 225, 0.8)",
    shadowColor: "#0f172a",
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 10,
  },
  previewTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#314d6f",
  },
  previewSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#6a7d96",
  },
  previewMeta: {
    marginBottom: 18,
    fontSize: 14,
    color: "#5f748f",
  },
  previewCloseButton: {
    backgroundColor: "#10233f",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  previewCloseButtonText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "700",
  },
  previewScroll: {
    flex: 1,
  },
  previewGrid: {
    flexDirection: "row",
    gap: 18,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  previewColumn: {
    flex: 1,
    minWidth: 300,
    backgroundColor: "#f8fbff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(205, 216, 227, 0.8)",
    overflow: "hidden",
  },
  previewColumnFull: {
    minWidth: "100%",
  },
  previewColumnHeader: {
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  previewIncomeHeader: {
    backgroundColor: "#429348",
  },
  previewExpenseHeader: {
    backgroundColor: "#de4a43",
  },
  previewColumnHeaderText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(203, 213, 225, 0.65)",
  },
  previewRowCopy: {
    flex: 1,
  },
  previewRowTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#314d6f",
  },
  previewRowMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "#7d8fa6",
  },
  previewRowValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#314d6f",
  },
  previewEmptyState: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  previewEmptyText: {
    fontSize: 14,
    color: "#718198",
    textAlign: "center",
  },
  previewTotalBox: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: "#ffffff",
    borderTopWidth: 2,
    borderTopColor: "rgba(203, 213, 225, 0.75)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  previewTotalLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#314d6f",
  },
  previewTotalValue: {
    fontSize: 15,
    fontWeight: "800",
  },
  previewBalanceBox: {
    marginTop: 18,
    paddingVertical: 18,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(205, 216, 227, 0.8)",
    alignItems: "center",
    gap: 8,
  },
  previewBalanceLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#5f748f",
  },
  previewBalanceValue: {
    fontSize: 26,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "78%",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(203, 213, 225, 0.8)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#314d6f",
    marginBottom: 16,
  },
  modalList: {
    maxHeight: 360,
  },
  modalOption: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#f8fbff",
    borderWidth: 1,
    borderColor: "rgba(203, 213, 225, 0.8)",
    marginBottom: 8,
  },
  modalOptionActive: {
    backgroundColor: "#e7eef6",
    borderColor: "#9db3cb",
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#314d6f",
  },
  modalCloseButton: {
    marginTop: 14,
    alignSelf: "flex-end",
    backgroundColor: "#10233f",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  modalCloseButtonText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "700",
  },
  chartSection: {
    gap: 18,
  },
  chartCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(205, 216, 227, 0.8)",
    padding: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#314d6f",
    marginBottom: 16,
  },
  comparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  chartLegendLabel: {
    width: 78,
    fontSize: 14,
    fontWeight: "700",
    color: "#314d6f",
  },
  barTrack: {
    flex: 1,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#e7eef6",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
  },
  incomeBarFill: {
    backgroundColor: "#429348",
  },
  expenseBarFill: {
    backgroundColor: "#de4a43",
  },
  chartValue: {
    minWidth: 118,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "700",
    color: "#314d6f",
  },
  categoryChartList: {
    gap: 16,
  },
  categoryChartRow: {
    gap: 8,
  },
  categoryChartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  categoryDotLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryChartTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#314d6f",
  },
  reportGrid: {
    flexDirection: "row",
    gap: 22,
  },
  reportGridStacked: {
    flexDirection: "column",
  },
  columnCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(205, 216, 227, 0.8)",
    overflow: "hidden",
  },
  columnHeader: {
    paddingVertical: 18,
    paddingHorizontal: 22,
  },
  incomeHeader: {
    backgroundColor: "#429348",
  },
  expenseHeader: {
    backgroundColor: "#de4a43",
  },
  columnHeaderText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  list: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  listRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(203, 213, 225, 0.7)",
  },
  listRowLast: {
    borderBottomWidth: 0,
  },
  rowCopy: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#314d6f",
  },
  rowMeta: {
    fontSize: 12,
    color: "#7d8fa6",
    marginTop: 4,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#314d6f",
  },
  totalBox: {
    marginHorizontal: 18,
    marginTop: 8,
    marginBottom: 18,
    paddingTop: 18,
    borderTopWidth: 2,
    borderTopColor: "rgba(203, 213, 225, 0.75)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#314d6f",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  footerSummary: {
    alignItems: "center",
    marginTop: 26,
    paddingTop: 6,
  },
  summaryLine: {
    width: "72%",
    height: 2,
    backgroundColor: "rgba(151, 178, 204, 0.7)",
    marginBottom: 16,
  },
  summaryLineShort: {
    width: "36%",
    height: 2,
    backgroundColor: "rgba(151, 178, 204, 0.7)",
    marginVertical: 14,
  },
  summaryText: {
    fontSize: 19,
    fontWeight: "700",
    color: "#314d6f",
    textAlign: "center",
  },
  summaryValue: {
    fontSize: 19,
    fontWeight: "800",
    color: "#314d6f",
  },
  positiveValue: {
    color: "#2d7564",
  },
  negativeValue: {
    color: "#de4a43",
  },
  emptyState: {
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#718198",
    textAlign: "center",
  },
});
