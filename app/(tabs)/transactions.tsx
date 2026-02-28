import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardNav } from "@/components/dashboard-nav";
import TransactionForm, { TransactionFormData } from "@/components/transaction-form";
import { TransactionList } from "@/components/transaction-list";
import { apiService } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Transaction {
  id: string;
  backendId: string;
  deleteCandidates: string[];
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  notes?: string;
}

const DASHBOARD_GRADIENT = ["#000000", "#073D33", "#107A65", "#20F4CA"] as const;

export default function TransactionsPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    checkAuthentication();
    loadTransactions();
  }, []);

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === "web" && globalThis?.alert) {
      globalThis.alert(`${title}\n${message}`);
      return;
    }
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
    } catch {
      showMessage("Erro", "Nao foi possivel carregar transacoes");
    }
  };

  const handleSubmit = async (data: TransactionFormData) => {
    try {
      setLoading(true);

      const payload = {
        descricao: data.description,
        valor: data.amount,
        categoria: data.category,
        data: data.date,
        observacao: data.notes,
      };

      if (editingTransaction) {
        let updated = false;
        let lastError: unknown = null;

        for (const candidateId of editingTransaction.deleteCandidates) {
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
        await apiService.createReceita(payload);
      }

      showMessage("Sucesso", editingTransaction ? "Transacao atualizada com sucesso!" : "Transacao cadastrada com sucesso!");
      await loadTransactions();
      setModalOpen(false);
      setEditingTransaction(null);
    } catch {
      showMessage("Erro", editingTransaction ? "Erro ao atualizar transacao" : "Erro ao salvar transacao");
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async (transaction: Transaction) => {
    try {
      let deleted = false;
      let lastError: unknown = null;

      for (const candidateId of transaction.deleteCandidates) {
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
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const transaction = transactions.find((item) => item.id === id);

    if (!transaction?.backendId || transaction.backendId.startsWith("tx-")) {
      showMessage("Erro", "Esta transacao nao possui um ID valido para exclusao.");
      return;
    }

    if (Platform.OS === "web") {
      const confirmed = globalThis?.confirm
        ? globalThis.confirm("Tem certeza que deseja excluir esta transacao?")
        : true;

      if (confirmed) {
        void executeDelete(transaction);
      }
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
                  <Text style={styles.title}>Transacoes</Text>

                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => {
                      setEditingTransaction(null);
                      setModalOpen(true);
                    }}
                  >
                    <Text style={styles.buttonText}>Nova Transacao</Text>
                  </TouchableOpacity>
                </View>

                <TransactionList transactions={transactions} onEdit={handleEdit} onDelete={handleDelete} />
              </View>
            </View>
          </View>
        </View>

        <Modal visible={modalOpen} animationType="slide">
          <TransactionForm
            onSubmit={handleSubmit}
            initialData={editingTransaction ?? undefined}
            isLoading={loading}
            onCancel={() => {
              setModalOpen(false);
              setEditingTransaction(null);
            }}
          />
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
  button: {
    backgroundColor: "#0B6E5B",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "#ECFEFF",
    fontWeight: "600",
  },
});
