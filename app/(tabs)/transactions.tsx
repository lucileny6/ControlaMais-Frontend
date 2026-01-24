import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";

import TransactionForm, {
  TransactionFormData,
} from "@/components/transaction-form";
import { TransactionList } from "@/components/transaction-list";
import { apiService } from "@/services/api";

/* ==============================
   TIPOS
============================== */

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  notes?: string;
}

/* ==============================
   COMPONENTE
============================== */

export default function TransactionsPage() {
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  /* ==============================
     CARREGAR TRANSAÇÕES
  ============================== */

  const loadTransactions = async () => {
    try {
      const data = await apiService.getTransactions();
      setTransactions(data as Transaction[]);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar transações");
    }
  };

  /* ==============================
     SUBMIT (CORRIGIDO)
  ============================== */

  const handleSubmit = async (data: TransactionFormData) => {
    try {
      setLoading(true);

      if (data.type === "expense") {
        await apiService.createDespesa({
          descricao: data.description,
          valor: data.amount,
          categoria: data.category,
          data: data.date,
          observacao: data.notes,
        });
      } else {
        await apiService.createReceita({
          descricao: data.description,
          valor: data.amount,
          categoria: data.category,
          data: data.date,
          observacao: data.notes,
        });
      }

      Alert.alert("Sucesso", "Transação cadastrada com sucesso!");
      await loadTransactions();
      setModalOpen(false);
    } catch {
      Alert.alert("Erro", "Erro ao salvar transação");
    } finally {
      setLoading(false);
    }
  };

  /* ==============================
     RENDER
  ============================== */

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transações</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setModalOpen(true)}
        >
          <Text style={styles.buttonText}>Nova Transação</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <TransactionList
          transactions={transactions}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      </ScrollView>

      <Modal visible={modalOpen} animationType="slide">
        <TransactionForm
          onSubmit={handleSubmit}
          isLoading={loading}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </View>
  );
}

/* ==============================
   STYLES
============================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#000",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
