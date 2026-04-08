import {
  calculateMonthlyFinancialTotals,
  isInvestmentCategory,
} from "@/lib/investments";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense" | "ia";
  category: string;
  date: string;
  notes?: string;
  recorrente?: boolean;
  recurrenceMonths?: number;
  recurrenceCurrent?: number;
}

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  initialStartDate?: string;
  initialEndDate?: string;
  periodSyncToken?: number;
  periodLabel?: string;
  onOpenPeriodPicker?: () => void;
  onFilteredDataChange?: (filtered: Transaction[]) => void;
  onExportContextChange?: (context: {
    filtered: Transaction[];
    filterType: "all" | "income" | "expense";
    totalIncome: number;
    totalExpense: number;
    totalInvestment: number;
    balance: number;
  }) => void;
}

export function TransactionList({
  transactions,
  onEdit,
  onDelete,
  initialStartDate = "",
  initialEndDate = "",
  periodSyncToken = 0,
  periodLabel = "",
  onOpenPeriodPicker,
  onFilteredDataChange,
  onExportContextChange,
}: TransactionListProps) {
  const toMonthYear = (value: string) => {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
    if (isoPattern.test(raw)) {
      const [, year, month] = raw.match(isoPattern)!;
      return `${month}-${year}`;
    }
    return raw;
  };

  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all",


  );
  const [filterRecurrence, setFilterRecurrence] = useState<"all" | "normal" | "recurring">(
    "all",
  );
  const [filterCategory, setFilterCategory] = useState("all");
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [startDate, setStartDate] = useState(toMonthYear(initialStartDate));
  const [endDate, setEndDate] = useState(toMonthYear(initialEndDate));
  const [hoveredRecurringId, setHoveredRecurringId] = useState<string | null>(null);

  useEffect(() => {
    setStartDate(toMonthYear(initialStartDate));
    setEndDate(toMonthYear(initialEndDate));
  }, [initialStartDate, initialEndDate, periodSyncToken]);
  const normalizeCategory = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

  const parseDateValue = (value: string, endOfMonth = false) => {
    const raw = String(value ?? "").trim();
    if (!raw) return null;

    const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
    const brPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const brDashPattern = /^(\d{2})-(\d{2})-(\d{4})$/;
    const monthYearPattern = /^(\d{2})-(\d{4})$/;
    const isoMonthPattern = /^(\d{4})-(\d{2})$/;

    let parsed: Date;
    if (isoPattern.test(raw)) {
      const [, year, month, day] = raw.match(isoPattern)!;
      parsed = new Date(Number(year), Number(month) - 1, Number(day));
    } else if (brPattern.test(raw)) {
      const [, day, month, year] = raw.match(brPattern)!;
      parsed = new Date(Number(year), Number(month) - 1, Number(day));
    } else if (brDashPattern.test(raw)) {
      const [, day, month, year] = raw.match(brDashPattern)!;
      parsed = new Date(Number(year), Number(month) - 1, Number(day));
    } else if (monthYearPattern.test(raw)) {
      const [, month, year] = raw.match(monthYearPattern)!;
      if (endOfMonth) {
        const lastDay = new Date(Number(year), Number(month), 0).getDate();
        parsed = new Date(Number(year), Number(month) - 1, lastDay);
      } else {
        parsed = new Date(Number(year), Number(month) - 1, 1);
      }
    } else if (isoMonthPattern.test(raw)) {
      const [, year, month] = raw.match(isoMonthPattern)!;
      if (endOfMonth) {
        const lastDay = new Date(Number(year), Number(month), 0).getDate();
        parsed = new Date(Number(year), Number(month) - 1, lastDay);
      } else {
        parsed = new Date(Number(year), Number(month) - 1, 1);
      }
    } else {
      parsed = new Date(raw);
    }

    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const type = transaction?.type ?? "expense";
    const category = String(transaction?.category ?? "");
    const matchesType = filterType === "all" || type === filterType;
    const matchesRecurrence =
      filterRecurrence === "all" ||
      (filterRecurrence === "recurring" ? Boolean(transaction?.recorrente) : !transaction?.recorrente);
    const matchesCategory =
      filterCategory === "all" ||
      normalizeCategory(category) === normalizeCategory(filterCategory);
    const transactionDate = parseDateValue(String(transaction?.date ?? ""));
    const start = parseDateValue(startDate, false);
    const end = parseDateValue(endDate, true);
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);

    const hasOnlyStart = Boolean(start) && !end;
    const hasOnlyEnd = !start && Boolean(end);

    const matchesDate = (() => {
      if (!start && !end) return true;
      if (!transactionDate) return false;
      const current = new Date(transactionDate);
      current.setHours(12, 0, 0, 0);

      if (hasOnlyStart) {
        const target = new Date(start!);
        target.setHours(12, 0, 0, 0);
        return current.getTime() === target.getTime();
      }

      if (hasOnlyEnd) {
        const target = new Date(end!);
        target.setHours(12, 0, 0, 0);
        return current.getTime() === target.getTime();
      }

      const matchesStartDate = !start || current >= start;
      const matchesEndDate = !end || current <= end;
      return matchesStartDate && matchesEndDate;
    })();

    return matchesType && matchesRecurrence && matchesCategory && matchesDate;
  });

  const sortedFilteredTransactions = [...filteredTransactions].sort((a, b) => {
    const aTime = parseDateValue(String(a?.date ?? ""))?.getTime() ?? 0;
    const bTime = parseDateValue(String(b?.date ?? ""))?.getTime() ?? 0;
    return bTime - aTime;
  });

  const { totalIncome, totalExpense, totalInvestment, balance } =
    calculateMonthlyFinancialTotals(filteredTransactions);

  useEffect(() => {
    onFilteredDataChange?.(sortedFilteredTransactions);
  }, [sortedFilteredTransactions, onFilteredDataChange]);

  useEffect(() => {
    onExportContextChange?.({
      filtered: sortedFilteredTransactions,
      filterType,
      totalIncome,
      totalExpense,
      totalInvestment,
      balance,
    });
  }, [
    sortedFilteredTransactions,
    filterType,
    filterRecurrence,
    totalIncome,
    totalExpense,
    totalInvestment,
    balance,
    onExportContextChange,
  ]);

  const categories = Array.from(
    transactions.reduce((acc, transaction) => {
      const rawCategory = String(transaction?.category ?? "").trim();
      if (!rawCategory) return acc;

      const normalizedKey = normalizeCategory(rawCategory);
      if (!acc.has(normalizedKey)) {
        acc.set(normalizedKey, rawCategory);
      }

      return acc;
    }, new Map<string, string>()).values(),
  );

  const clearFilters = () => {
    setFilterCategory("all");
    setFilterType("all");
    setFilterRecurrence("all");
  };

  const formatCurrency = (amount: number) => {
    return Math.abs(amount).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    });
  };
  const formatBalanceValue = (amount: number) => {
    const formatted = formatCurrency(amount);
    if (amount < 0) return `- R$ ${formatted}`;
    return `R$ ${formatted}`;
  };

  const formatDate = (dateString: string) => {
    const date = parseDateValue(dateString);
    if (!date) return dateString;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getRecurrenceCount = (item: Transaction) => {
    const parsed = Math.floor(Number(item.recurrenceMonths ?? 0));
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }

    return item.recorrente ? 1 : 0;
  };

  const getRecurrenceTooltipLabel = (item: Transaction) => {
    const recurrenceCount = getRecurrenceCount(item);
    if (recurrenceCount <= 0) return "";

    const parsedCurrent = Math.floor(Number(item.recurrenceCurrent ?? 0));
    const recurrenceCurrent =
      Number.isFinite(parsedCurrent) && parsedCurrent > 0
        ? Math.min(parsedCurrent, recurrenceCount)
        : 1;

    return `${recurrenceCurrent}/${recurrenceCount}`;
  };

  const isInvestmentExpense = (item: Transaction) =>
    item.type === "expense" && isInvestmentCategory(item.category);

  const getTransactionDotStyle = (item: Transaction) => {
    if (item.type === "income") return styles.typeDotIncome;
    if (item.type === "ia" || isInvestmentExpense(item)) return styles.typeDotIa;
    return styles.typeDotExpense;
  };

  const getTransactionAmountStyle = (item: Transaction) => {
    if (item.type === "income") return styles.incomeAmount;
    if (item.type === "ia" || isInvestmentExpense(item)) return styles.iaAmount;
    return styles.expenseAmount;
  };

  const renderRecurrenceStatus = (item: Transaction) => {
    if (!item.recorrente) {
      return <Text style={styles.reportCellText}>Manual</Text>;
    }

    const showTooltip = Platform.OS === "web" && hoveredRecurringId === item.id;

    return (
      <View style={styles.recurrenceStatusWrap}>
        <Pressable
          style={styles.recurrenceBadge}
          onHoverIn={Platform.OS === "web" ? () => setHoveredRecurringId(item.id) : undefined}
          onHoverOut={Platform.OS === "web" ? () => setHoveredRecurringId((current) => (current === item.id ? null : current)) : undefined}
        >
          <Text style={styles.recurrenceBadgeText}>Recorrente</Text>
        </Pressable>
        {showTooltip && (
          <View style={styles.recurrenceTooltip}>
            <Text style={styles.recurrenceTooltipText}>{getRecurrenceTooltipLabel(item)}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <View
      style={[
        styles.transactionCard,
        item.type === "income"
          ? styles.transactionCardIncome
          : item.type === "expense"
            ? styles.transactionCardExpense
            : styles.transactionCardIa,
      ]}
    >
      <View style={styles.transactionHeader}>
        <View style={styles.transactionInfo}>
          <View style={styles.headlineRow}>
            <View
              style={[
                styles.typeDot,
                getTransactionDotStyle(item),
              ]}
            />
            <Text style={styles.description}>{item.description}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>📂 {item.category}</Text>
            <Text style={styles.metaText}>📅 {formatDate(item.date)}</Text>
          </View>
        </View>

        <View style={styles.amountContainer}>
          <Text
            style={[
              styles.amount,
              getTransactionAmountStyle(item),
            ]}
          >
            {item.type === "income" ? "+" : item.type === "expense" ? "-" : ""} R${" "}
            {formatCurrency(item.amount)}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <Pressable
          style={[styles.actionButton, styles.editButton]}
          onPress={() => onEdit(item)}
          hitSlop={8}
        >
          <Text style={styles.actionButtonText}>Editar</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(item.id)}
          hitSlop={8}
        >
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
            Excluir
          </Text>
        </Pressable>
      </View>
    </View>
  );
  void renderTransactionItem;

  const renderReportTransactionItem = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={[styles.reportCell, styles.dateColumn]}>
          <Text style={styles.reportCellText}>{formatDate(item.date)}</Text>
        </View>

        <View style={[styles.reportCell, styles.descriptionColumn]}>
          <View style={styles.reportDescriptionRow}>
            <View
              style={[
                styles.typeDot,
                getTransactionDotStyle(item),
              ]}
            />
            <Text style={styles.description}>{item.description}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{item.category}</Text>
          </View>
        </View>

        <View style={[styles.reportCell, styles.typeColumn]}>
          <Text style={styles.reportCellText}>
            {item.type === "income" ? "Receita" : item.type === "expense" ? "Despesa" : "Ação IA"}
          </Text>
        </View>

        <View style={[styles.reportCell, styles.statusColumn]}>
          {renderRecurrenceStatus(item)}
        </View>

        <View
          style={[
            styles.reportCell,
            styles.amountColumn,
            styles.amountContainer,
          ]}
        >
          <Text
            style={[
              styles.amount,
              getTransactionAmountStyle(item),
            ]}
          >
            {item.type === "income" ? "+" : item.type === "expense" ? "-" : ""} R$ {formatCurrency(item.amount)}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <Pressable
          style={[styles.actionButton, styles.editButton]}
          onPress={() => onEdit(item)}
          hitSlop={8}
        >
          <Text style={styles.actionButtonText}>Editar</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(item.id)}
          hitSlop={8}
        >
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
            Excluir
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolbarRow}
        >
          <View style={styles.toolbarItem}>
            <Text style={styles.toolbarLabel}>Período</Text>
            <TouchableOpacity
              style={styles.toolbarSelect}
              onPress={onOpenPeriodPicker}
              disabled={!onOpenPeriodPicker}
            >
              <Text style={styles.toolbarSelectText}>
                {periodLabel || "Selecionar mês/ano"}
              </Text>
              <Text style={styles.toolbarSelectArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.toolbarItem}>
            <Text style={styles.toolbarLabel}>Categoria</Text>
            <TouchableOpacity
              style={styles.toolbarSelect}
              onPress={() => setCategoryPickerOpen(true)}
            >
              <Text style={styles.toolbarSelectText}>
                {filterCategory === "all" ? "Selecionar categoria" : filterCategory}
              </Text>
              <Text style={styles.toolbarSelectArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.toolbarItem}>
            <Text style={styles.toolbarLabel}>Tipo</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  filterType === "all" && styles.typeButtonActive,
                ]}
                onPress={() => setFilterType("all")}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    filterType === "all" && styles.typeButtonTextActive,
                  ]}
                >
                  Todos
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  filterType === "income" && styles.typeButtonActive,
                ]}
                onPress={() => setFilterType("income")}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    filterType === "income" && styles.typeButtonTextActive,
                  ]}
                >
                  Receitas
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  filterType === "expense" && styles.typeButtonActive,
                ]}
                onPress={() => setFilterType("expense")}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    filterType === "expense" && styles.typeButtonTextActive,
                  ]}
                >
                  Despesas
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.toolbarItem}>
            <Text style={styles.toolbarLabel}>Recorrência</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  filterRecurrence === "all" && styles.typeButtonActive,
                ]}
                onPress={() => setFilterRecurrence("all")}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    filterRecurrence === "all" && styles.typeButtonTextActive,
                  ]}
                >
                  Todos
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  filterRecurrence === "normal" && styles.typeButtonActive,
                ]}
                onPress={() => setFilterRecurrence("normal")}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    filterRecurrence === "normal" && styles.typeButtonTextActive,
                  ]}
                >
                  Normais
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  filterRecurrence === "recurring" && styles.typeButtonActive,
                ]}
                onPress={() => setFilterRecurrence("recurring")}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    filterRecurrence === "recurring" && styles.typeButtonTextActive,
                  ]}
                >
                  Recorrentes
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={clearFilters}
          >
            <Text style={styles.clearFiltersText}>Limpar filtros</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <Modal
        visible={categoryPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryPickerOpen(false)}
      >
        <View style={styles.categoryModalOverlay}>
          <View style={styles.categoryModalContent}>
            <Text style={styles.categoryModalTitle}>Selecionar categoria</Text>
            <ScrollView style={styles.categoryModalList}>
              <TouchableOpacity
                style={[
                  styles.categoryOption,
                  filterCategory === "all" && styles.categoryOptionActive,
                ]}
                onPress={() => {
                  setFilterCategory("all");
                  setCategoryPickerOpen(false);
                }}
              >
                <Text style={styles.categoryOptionText}>Todas</Text>
              </TouchableOpacity>
              {categories.map((category, index) => (
                <TouchableOpacity
                  key={`${category}-${index}`}
                  style={[
                    styles.categoryOption,
                    filterCategory === category && styles.categoryOptionActive,
                  ]}
                  onPress={() => {
                    setFilterCategory(category);
                    setCategoryPickerOpen(false);
                  }}
                >
                  <Text style={styles.categoryOptionText}>{category}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.categoryCloseButton}
              onPress={() => setCategoryPickerOpen(false)}
            >
              <Text style={styles.categoryCloseButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, styles.summaryIncomeCard]}>
          <Text style={styles.summaryLabel}>Receitas</Text>
          <Text style={[styles.summaryValue, styles.incomeText]}>
            R$ {formatCurrency(totalIncome)}
          </Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryExpenseCard]}>
          <Text style={styles.summaryLabel}>Despesas</Text>
          <Text style={[styles.summaryValue, styles.expenseText]}>
            R$ {formatCurrency(totalExpense)}
          </Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryInvestmentCard]}>
          <Text style={styles.summaryLabel}>Investimentos</Text>
          <Text style={[styles.summaryValue, styles.investmentText]}>
            R$ {formatCurrency(totalInvestment)}
          </Text>
        </View>
        <View style={[styles.summaryCard, styles.summaryBalanceCard]}>
          <Text style={[styles.summaryLabel, styles.summaryBalanceLabel]}>
            Saldo
          </Text>
          <Text
            style={[
              styles.summaryValue,
              styles.summaryBalanceValue,
              balance >= 0
                ? styles.summaryBalancePositive
                : styles.summaryBalanceNegative,
            ]}
          >
            {formatBalanceValue(balance)}
          </Text>
        </View>
      </View>

      <View style={styles.ledgerContainer}>
        <View style={styles.ledgerHeader}>
          <View>
            <Text style={styles.ledgerTitle}>Lancamentos do periodo</Text>
            <Text style={styles.ledgerSubtitle}>
              Visualize receitas e despesas do mes em formato de extrato.
            </Text>
          </View>
          <View style={styles.ledgerBadge}>
            <Text style={styles.ledgerBadgeText}>
              {sortedFilteredTransactions.length} itens
            </Text>
          </View>
        </View>

        <View style={styles.reportHeaderRow}>
          <Text style={[styles.reportHeaderText, styles.dateColumn]}>Data</Text>
          <Text style={[styles.reportHeaderText, styles.descriptionColumn]}>
            Descricao
          </Text>
          <Text style={[styles.reportHeaderText, styles.typeColumn]}>Tipo</Text>
          <Text style={[styles.reportHeaderText, styles.statusColumn]}>
            Situacao
          </Text>
          <Text
            style={[
              styles.reportHeaderText,
              styles.amountColumn,
              styles.reportHeaderAmount,
            ]}
          >
            Valor
          </Text>
        </View>

        {sortedFilteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <Text style={styles.emptyStateIconMark}>-</Text>
            </View>
            <Text style={styles.emptyStateText}>
              Nenhuma transacao encontrada neste periodo.
            </Text>
            <Text style={styles.emptyStateHint}>
              Ajuste os filtros ou troque o periodo para visualizar lancamentos.
            </Text>
          </View>
        ) : (
          <FlatList
            data={sortedFilteredTransactions}
            renderItem={renderReportTransactionItem}
            keyExtractor={(item, index) =>
              `${item?.id || item?.date || "tx"}-${index}`
            }
            showsVerticalScrollIndicator={false}
            style={styles.ledgerList}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    gap: 4,
    marginBottom: 2,
  },
  toolbarRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingBottom: 2,
  },
  toolbarItem: {
    gap: 4,
    minWidth: 132,
  },
  toolbarLabel: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "600",
  },
  toolbarSelect: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minWidth: 168,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  toolbarSelectText: {
    fontSize: 12,
    color: "#0f172a",
    fontWeight: "500",
    flexShrink: 1,
  },
  toolbarSelectArrow: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "700",
  },
  typeRow: {
    flexDirection: "row",
    gap: 6,
  },
  typeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    minHeight: 24,
    justifyContent: "center",
  },
  typeButtonActive: {
    backgroundColor: "#000000",
  },
  typeButtonText: {
    fontSize: 11,
    color: "#666666",
    fontWeight: "500",
  },
  typeButtonTextActive: {
    color: "#ffffff",
  },
  clearFiltersButton: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 30,
    justifyContent: "center",
  },
  clearFiltersText: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "600",
  },
  categoryModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  categoryModalContent: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "75%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  categoryModalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  categoryModalList: {
    maxHeight: 280,
  },
  categoryOption: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  categoryOptionActive: {
    backgroundColor: "#f1f5f9",
  },
  categoryOptionText: {
    fontSize: 14,
    color: "#0f172a",
  },
  categoryCloseButton: {
    alignSelf: "flex-end",
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  categoryCloseButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 12,
  },
  listContent: {
    gap: 2,
    paddingBottom: 4,
  },
  summaryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: "center",
  },
  summaryIncomeCard: {
    backgroundColor: "rgba(240, 253, 244, 0.92)",
    borderColor: "rgba(34, 197, 94, 0.22)",
  },
  summaryExpenseCard: {
    backgroundColor: "rgba(254, 242, 242, 0.92)",
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  summaryInvestmentCard: {
    backgroundColor: "rgba(239, 246, 255, 0.94)",
    borderColor: "rgba(37, 99, 235, 0.2)",
  },
  summaryBalanceCard: {
    backgroundColor: "#f8fafc",
    borderColor: "rgba(15, 23, 42, 0.12)",
    minHeight: 60,
  },
  summaryLabel: {
    fontSize: 9,
    color: "#334155",
    marginBottom: 2,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111111",
  },
  summaryBalanceLabel: {
    color: "#64748b",
  },
  summaryBalanceValue: {
    fontSize: 12,
    fontWeight: "800",
  },
  summaryBalancePositive: {
    color: "#0f172a",
  },
  summaryBalanceNegative: {
    color: "#b91c1c",
  },
  incomeText: {
    color: "#15803d",
  },
  expenseText: {
    color: "#dc2626",
  },
  investmentText: {
    color: "#2563eb",
  },
  ledgerContainer: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: "#0f172a",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  ledgerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.14)",
    gap: 12,
  },
  ledgerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
  ledgerSubtitle: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 2,
  },
  ledgerBadge: {
    backgroundColor: "#f8fafc",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ledgerBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
  },
  reportHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 6,
    paddingBottom: 8,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.14)",
  },
  reportHeaderText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reportHeaderAmount: {
    textAlign: "right",
  },
  reportCellText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
  recurrenceStatusWrap: {
    position: "relative",
    alignSelf: "flex-start",
  },
  recurrenceBadge: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.18)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  recurrenceBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1d4ed8",
  },
  recurrenceTooltip: {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: 6,
    backgroundColor: "#0f172a",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 144,
    zIndex: 20,
    shadowColor: "#0f172a",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  recurrenceTooltipText: {
    fontSize: 11,
    lineHeight: 16,
    color: "#f8fafc",
    fontWeight: "600",
  },
  dateColumn: {
    flex: 1.1,
  },
  descriptionColumn: {
    flex: 2.8,
  },
  typeColumn: {
    flex: 1.2,
  },
  statusColumn: {
    flex: 1.2,
  },
  amountColumn: {
    flex: 1.3,
  },
  ledgerList: {
    maxHeight: 760,
  },
  reportCell: {
    justifyContent: "center",
  },
  transactionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 0,
    paddingHorizontal: 6,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.12)",
  },
  transactionCardIncome: {
    backgroundColor: "#ffffff",
  },
  transactionCardExpense: {
    backgroundColor: "#ffffff",
  },
  transactionCardIa: {
    backgroundColor: "#ffffff",
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  reportDescriptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  transactionInfo: {
    flex: 1,
    gap: 4,
  },
  headlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  typeDotIncome: {
    backgroundColor: "#22c55e",
  },
  typeDotExpense: {
    backgroundColor: "#ef4444",
  },
  typeDotIa: {
    backgroundColor: "#2563eb",
  },
  description: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
  },
  metaRow: {
    marginTop: 4,
  },
  metaText: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "500",
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 14,
    fontWeight: "700",
  },
  incomeAmount: {
    color: "#16a34a", // green-600
  },
  expenseAmount: {
    color: "#dc2626", // red-600
  },
  iaAmount: {
    color: "#2563eb",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
    paddingLeft: 0,
  },
  actionButton: {
    minWidth: 64,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.16)",
  },
  deleteButton: {
    backgroundColor: "#fff7f7",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.12)",
  },
  actionButtonText: {
    fontSize: 10,
    fontWeight: "700",
  },
  deleteButtonText: {
    color: "#dc2626",
  },
  emptyState: {
    backgroundColor: "#ffffff",
    padding: 36,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.14)",
    gap: 10,
    minHeight: 320,
    justifyContent: "center",
  },
  emptyStateIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
  emptyStateIconMark: {
    fontSize: 18,
    lineHeight: 18,
    color: "#64748b",
  },
  emptyStateText: {
    fontSize: 15,
    color: "#334155",
    fontWeight: "600",
    textAlign: "center",
  },
  emptyStateHint: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
});
