import React, { useState } from "react";
import { Alert, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

// IMPORT DIRETO DO COMPONENTE REAL
import TransactionForm from "../../src/components/transaction-form";

// IMPORT DO SERVICE REAL (SEM AXIOS)
import { apiService } from "../../src/services/api";

interface TransactionFormData {
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  notes?: string;
}

export default function NewTransactionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
      router.replace("/dashboard");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível cadastrar a transação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TransactionForm
        onSubmit={handleSubmit}
        isLoading={loading}
        onCancel={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
  },
});
