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
          data: normalizeDateToIso(data.date),
          observacao: data.notes,
        });
      } else {
        await apiService.createReceita({
          descricao: data.description,
          valor: data.amount,
          categoria: data.category,
          data: normalizeDateToIso(data.date),
          observacao: data.notes,
        });
      }

      Alert.alert("Sucesso", "Transação cadastrada com sucesso!");
      router.replace("/dashboard");
    } catch (error: any) {
      const message = String(error?.message ?? "Nao foi possivel cadastrar a transacao");
      Alert.alert("Erro", `Nao foi possivel cadastrar a transacao: ${message}`);
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
