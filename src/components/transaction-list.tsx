import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  notes?: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export function TransactionList({ transactions, onEdit, onDelete }: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const normalizeCategory = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

  const parseDateValue = (value: string) => {
    const raw = String(value ?? "").trim();
    if (!raw) return null;

    const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
    const brPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;

    let parsed: Date;
    if (isoPattern.test(raw)) {
      const [, year, month, day] = raw.match(isoPattern)!;
      parsed = new Date(Number(year), Number(month) - 1, Number(day));
    } else if (brPattern.test(raw)) {
      const [, day, month, year] = raw.match(brPattern)!;
      parsed = new Date(Number(year), Number(month) - 1, Number(day));
    } else {
      parsed = new Date(raw);
    }

    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const description = String(transaction?.description ?? "");
    const type = transaction?.type ?? "expense";
    const category = String(transaction?.category ?? "");
    const matchesSearch = description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || type === filterType;
    const matchesCategory =
      filterCategory === "all" ||
      normalizeCategory(category) === normalizeCategory(filterCategory);
    const transactionDate = parseDateValue(String(transaction?.date ?? ""));
    const start = parseDateValue(startDate);
    const end = parseDateValue(endDate);
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

    return matchesSearch && matchesType && matchesCategory && matchesDate;
  });

  const totalTransactions = filteredTransactions.length;
  const totalIncome = filteredTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((acc, transaction) => acc + Number(transaction.amount || 0), 0);
  const totalExpense = filteredTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((acc, transaction) => acc + Number(transaction.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  const categories = Array.from(
    new Set(
      transactions
        .map((t) => String(t?.category ?? "").trim())
        .filter((category) => category.length > 0)
    )
  );

  const formatCurrency = (amount: number) => {
    return Math.abs(amount).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.description}>{item.description}</Text>
            <View style={styles.badgeContainer}>
              <View style={[styles.badge, styles.categoryBadge]}>
                <Text style={styles.badgeText}>{item.category}</Text>
              </View>
              <View style={[
                styles.badge, 
                item.type === "income" ? styles.incomeBadge : styles.expenseBadge
              ]}>
                <Text style={styles.badgeText}>
                  {item.type === "income" ? "Receita" : "Despesa"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.date}>{formatDate(item.date)}</Text>
            {item.notes && (
              <Text style={styles.notes} numberOfLines={1}>
                {item.notes}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.transactionActions}>
          <View style={styles.amountContainer}>
            <Text style={[
              styles.amount,
              item.type === "income" ? styles.incomeAmount : styles.expenseAmount
            ]}>
              {item.type === "income" ? "+" : "-"} R$ {formatCurrency(item.amount)}
            </Text>
          </View>

          <Pressable 
            style={styles.menuButton}
            onPress={() => {
              onEdit(item);
            }}
            hitSlop={8}
          >
            <Text style={styles.menuButtonText}>⋮</Text>
          </Pressable>
        </View>
      </View>

      {/* Botoes de acao */}
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
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Excluir</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar transacoes..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />

        <View style={styles.dateFilterRow}>
          <TextInput
            style={styles.dateInput}
            placeholder="Data inicial (AAAA-MM-DD)"
            value={startDate}
            onChangeText={setStartDate}
          />
          <TextInput
            style={styles.dateInput}
            placeholder="Data final (AAAA-MM-DD)"
            value={endDate}
            onChangeText={setEndDate}
          />
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity 
            style={[
              styles.filterButton,
              filterType === "all" && styles.filterButtonActive
            ]}
            onPress={() => setFilterType("all")}
          >
            <Text style={[
              styles.filterButtonText,
              filterType === "all" && styles.filterButtonTextActive
            ]}>Todos</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.filterButton,
              filterType === "income" && styles.filterButtonActive
            ]}
            onPress={() => setFilterType("income")}
          >
            <Text style={[
              styles.filterButtonText,
              filterType === "income" && styles.filterButtonTextActive
            ]}>Receitas</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.filterButton,
              filterType === "expense" && styles.filterButtonActive
            ]}
            onPress={() => setFilterType("expense")}
          >
            <Text style={[
              styles.filterButtonText,
              filterType === "expense" && styles.filterButtonTextActive
            ]}>Despesas</Text>
          </TouchableOpacity>
        </View>

        {/* Filtro de categoria */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          <TouchableOpacity 
            style={[
              styles.categoryChip,
              filterCategory === "all" && styles.categoryChipActive
            ]}
            onPress={() => setFilterCategory("all")}
          >
            <Text style={[
              styles.categoryChipText,
              filterCategory === "all" && styles.categoryChipTextActive
            ]}>Todas</Text>
          </TouchableOpacity>
          
          {categories.map((category, index) => (
            <TouchableOpacity 
              key={`${category}-${index}`}
              style={[
                styles.categoryChip,
                filterCategory === category && styles.categoryChipActive
              ]}
              onPress={() => setFilterCategory(category)}
            >
              <Text style={[
                styles.categoryChipText,
                filterCategory === category && styles.categoryChipTextActive
              ]}>{category}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total de transacoes</Text>
          <Text style={styles.summaryValue}>{totalTransactions}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Receitas</Text>
          <Text style={[styles.summaryValue, styles.incomeText]}>
            R$ {formatCurrency(totalIncome)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Despesas</Text>
          <Text style={[styles.summaryValue, styles.expenseText]}>
            R$ {formatCurrency(totalExpense)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Saldo</Text>
          <Text style={[styles.summaryValue, balance >= 0 ? styles.incomeText : styles.expenseText]}>
            R$ {formatCurrency(balance)}
          </Text>
        </View>
      </View>

      {/* Lista de transacoes */}
      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {searchTerm || filterType !== "all" || filterCategory !== "all"
              ? "Nenhuma transacao encontrada com os filtros aplicados."
              : "Nenhuma transacao registrada ainda."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item, index) => `${item?.id || item?.date || "tx"}-${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    gap: 10,
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  dateFilterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    fontSize: 13,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    minWidth: 95,
  },
  filterButtonActive: {
    backgroundColor: '#000000',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  categoriesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  categoryChipActive: {
    backgroundColor: '#000000',
  },
  categoryChipText: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  listContent: {
    gap: 8,
    paddingBottom: 14,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  summaryCard: {
    flexGrow: 0,
    minWidth: 130,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
  },
  incomeText: {
    color: '#16a34a',
  },
  expenseText: {
    color: '#dc2626',
  },
  transactionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionInfo: {
    flex: 1,
    marginRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginRight: 6,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadge: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  incomeBadge: {
    backgroundColor: '#dcfce7',
  },
  expenseBadge: {
    backgroundColor: '#fee2e2',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  date: {
    fontSize: 12,
    color: '#666666',
  },
  notes: {
    fontSize: 12,
    color: '#666666',
    flex: 1,
  },
  transactionActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  incomeAmount: {
    color: '#16a34a', // green-600
  },
  expenseAmount: {
    color: '#dc2626', // red-600
  },
  menuButton: {
    padding: 4,
  },
  menuButtonText: {
    fontSize: 18,
    color: '#666666',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    paddingTop: 10,
  },
  actionButton: {
    minWidth: 90,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#f5f5f5',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  deleteButtonText: {
    color: '#dc2626',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});

