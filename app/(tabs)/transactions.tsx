import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardNav } from "@/components/dashboard-nav";
import {
    TransactionForm,
    TransactionFormData,
} from "@/components/transaction-form";
import { TransactionList } from "@/components/transaction-list";
import { CreateTransactionDTO } from "@/lib/types";
import { ApiService } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface User {
  name?: string;
  email?: string;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  notes?: string;
}

export default function PageTransactions() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const api = new ApiService();

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      const authToken = await AsyncStorage.getItem("authToken");

      if (!storedUser || !authToken) {
        router.replace("/login");
        return;
      }

      setUser(JSON.parse(storedUser));

      loadTransactions();
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      router.replace("/login");
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setIsLoading(true);

      const response = await api.getTransactions();

      setTransactions(response.date || []);

      console.log(
        "Transações carregadas do backend:",
        response.date?.length || 0,
      );
    } catch (error: any) {
      console.log("Erro  ao carregar transações:", error);

      Alert.alert(
        "Erro",
        "Não foi possível carregar as transações. Verifique sua conexão.",
        [{ text: "OK" }],
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const handleAddTransaction = async (formData: TransactionFormData) => {
    setIsLoading(true);

    try {
      const transactionData: CreateTransactionDTO = {
        description: formData.description,
        amount: Number.parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        date: formData.date,
        notes: formData.notes,
      };

      console.log("Enviando transações para API:", transactionData);
      const newTransaction = await api.createTransection(transactionData);
      setTransactions((prev) => [newTransaction, ...prev]);
      setIsDialogOpen(false);
      Alert.alert("Sucesso", "Transação adicionada com sucesso!", [
        { text: "OK" },
      ]);
      console.log("Transação criada no backend:", newTransaction);
    } catch (error: any) {
      console.error("Erro ao criar transação", error);

      let errorMessage = "Erro ao criar transação";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert("Erro", errorMessage, [{ text: "Ok" }]);

      loadTransactions();
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTransaction = async (formData: any) => {
    if (!editingTransaction) return;

    setIsLoading(true);

    try {
      const updateData = {
        description: formData.description,
        amount: Number.parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        date: formData.date,
        notes: formData.notes,
      };

      console.log("Atualizando transação:", editingTransaction.id, updateData);

      const updatedTransaction = await api.updateTransaction(
        editingTransaction.id,
        updateData,
      );

      setTransactions((prev) =>
        prev.map((t) =>
          t.id === editingTransaction.id ? updatedTransaction : t,
        ),
      );

      setEditingTransaction(null);
      setIsDialogOpen(false);

      Alert.alert("Sucesso", "A transação foi atualizada com sucesso!", [
        { text: "Ok" },
      ]);
      console.log("Transação atulizada no backend", updatedTransaction);
    } catch (error: any) {
      console.log("Erro ao atulizar transação:", error);
      let errorMessage = "Erro ao atualizar transação";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert("Erro", errorMessage, [{ text: "Ok" }]);

      loadTransactions();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    Alert.alert(
      "Confirmar exclusão",
      "Tem certeza que deseja excluir está transação?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteTransaction(id);

              setTransactions((prev) => prev.filter((t) => t.id !== id));
              console.log("Transaction deleted: ", id);
              Alert.alert("Sucesso", "Atrandsação foi excluída com sucesso!", [
                { text: "Ok" },
              ]);
            } catch (error: any) {
              console.log("Erro ao excluir transação:", error);
              let errorMessage = "Erro ao excluir transação";
              if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
              }

              Alert.alert("Erro", errorMessage, [{ text: "Ok" }]);

              loadTransactions();
            }
          },
        },
      ],
    );
  };

  const openAddDialog = () => {
    setEditingTransaction(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsDialogOpen(true);
  };

  if (isLoadingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
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
          <ScrollView style={styles.scrollContent}>
            <View style={styles.pageContainer}>
              <View style={styles.pageContent}>
                <View style={styles.header}>
                  <View>
                    <Text style={styles.title}>Transações</Text>
                    <Text style={styles.subtitle}>
                      {"Gerencie suas transações"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={openAddDialog}
                  >
                    <Text style={styles.addButtonText}>Nova Transação</Text>
                  </TouchableOpacity>
                </View>

                <Modal
                  visible={isDialogOpen}
                  animationType="slide"
                  transparent={true}
                  onRequestClose={() => setIsDialogOpen(false)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      <TransactionForm
                        onSubmit={
                          editingTransaction
                            ? handleEditTransaction
                            : handleAddTransaction
                        }
                        initialData={
                          editingTransaction
                            ? {
                                description: editingTransaction.description,
                                amount: editingTransaction.amount.toString(),
                                type: editingTransaction.type,
                                category: editingTransaction.category,
                                date: editingTransaction.date,
                                notes: editingTransaction.notes,
                              }
                            : undefined
                        }
                        isLoading={isLoading}
                        onCancel={() => setIsDialogOpen(false)}
                      />
                    </View>
                  </View>
                </Modal>

                <TransactionList
                  transactions={transactions}
                  onEdit={openEditDialog}
                  onDelete={handleDeleteTransaction}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layoutContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: 256,
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  sidebarContent: {
    paddingVertical: 24,
  },
  main: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
  pageContent: {
    flex: 1,
    padding: 16,
  },
  mobileHint: {
    backgroundColor: "#dbeafe",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  mobileHintText: {
    color: "#1e40af",
    fontSize: 14,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#666666",
  },

  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 4,
  },
  addButton: {
    backgroundColor: "#000000",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 2,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    width: "100%",
    maxWidth: 700,
    maxHeight: "95%",
  },
});
