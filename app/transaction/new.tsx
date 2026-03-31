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
  recorrente: boolean;
  recurrenceMonths?: number;
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

const parseIsoDateParts = (value: string) => {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
};

const addMonthsToIsoDate = (value: string, monthsToAdd: number) => {
  const parts = parseIsoDateParts(value);
  if (!parts) return value;

  const target = new Date(parts.year, parts.month - 1 + monthsToAdd, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  const safeDay = Math.min(parts.day, lastDay);
  const month = String(target.getMonth() + 1).padStart(2, "0");
  const day = String(safeDay).padStart(2, "0");

  return `${target.getFullYear()}-${month}-${day}`;
};

export default function NewTransactionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: TransactionFormData) => {
    try {
      setLoading(true);

      const recurringOccurrencesTotal = data.recorrente
        ? Math.max(1, Math.floor(Number(data.recurrenceMonths ?? 12)))
        : 1;

      const basePayload = {
        descricao: data.description,
        valor: data.amount,
        categoria: data.category,
        data: normalizeDateToIso(data.date),
        observacao: data.notes,
        recorrente: data.recorrente,
        recurring: data.recorrente,
      };

      const payloads = data.recorrente
        ? Array.from({ length: recurringOccurrencesTotal }, (_, index) => ({
            ...basePayload,
            data: addMonthsToIsoDate(basePayload.data, index),
          }))
        : [basePayload];

      if (data.type === "expense") {
        await Promise.all(payloads.map((payload) => apiService.createDespesa(payload)));
      } else {
        await Promise.all(payloads.map((payload) => apiService.createReceita(payload)));
      }

      Alert.alert(
        "Sucesso",
        data.recorrente
          ? `Transacao recorrente cadastrada para ${recurringOccurrencesTotal} ${recurringOccurrencesTotal === 1 ? "mes" : "meses"}!`
          : "Transacao cadastrada com sucesso!",
      );
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
