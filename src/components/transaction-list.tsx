import React, { useState } from 'react';
import {
  FlatList,
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

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || transaction.type === filterType;
    const matchesCategory = filterCategory === "all" || transaction.category === filterCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  const categories = Array.from(new Set(transactions.map((t) => t.category)));

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

          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => {
              onEdit(item);
            }}
          >
            <Text style={styles.menuButtonText}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Botões de ação */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => onEdit(item)}
        >
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(item.id)}
        >
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar transações..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />

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
          
          {categories.map((category) => (
            <TouchableOpacity 
              key={category}
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

      {/* Lista de transações */}
      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {searchTerm || filterType !== "all" || filterCategory !== "all"
              ? "Nenhuma transação encontrada com os filtros aplicados."
              : "Nenhuma transação registrada ainda."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.id}
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
    gap: 16,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#000000',
  },
  filterButtonText: {
    fontSize: 14,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  categoryChipActive: {
    backgroundColor: '#000000',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  listContent: {
    gap: 12,
    paddingBottom: 20,
  },
  transactionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionInfo: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginRight: 8,
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
    gap: 12,
  },
  date: {
    fontSize: 14,
    color: '#666666',
  },
  notes: {
    fontSize: 14,
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
    fontSize: 16,
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
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    padding: 8,
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
    fontSize: 14,
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