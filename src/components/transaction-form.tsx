import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/* ==============================
   TIPOS
============================== */

export interface TransactionFormData {
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  notes?: string;
}

interface TransactionFormProps {
  onSubmit: (data: TransactionFormData) => void;
  initialData?: Partial<TransactionFormData>;
  isLoading?: boolean;
  onCancel?: () => void;
}

/* ==============================
   CATEGORIAS (UI)
============================== */

const incomeCategories = [
  "Salário",
  "Freelance",
  "Investimentos",
  "Vendas",
  "Outros",
];

const expenseCategories = [
  "Alimentação",
  "Transporte",
  "Contas",
  "Saúde",
  "Educação",
  "Lazer",
  "Compras",
  "Outros",
];

/* ==============================
   MAPAS PARA BACKEND
============================== */

const incomeCategoryMap: Record<string, string> = {
  Salário: "SALARIO",
  Freelance: "FREELANCE",
  Investimentos: "INVESTIMENTOS",
  Vendas: "VENDAS",
  Outros: "OUTROS",
};

const expenseCategoryMap: Record<string, string> = {
  Alimentação: "ALIMENTACAO",
  Transporte: "TRANSPORTE",
  Contas: "CONTAS",
  Saúde: "SAUDE",
  Educação: "EDUCACAO",
  Lazer: "LAZER",
  Compras: "COMPRAS",
  Outros: "OUTROS",
};

export function TransactionForm({
  onSubmit,
  initialData,
  isLoading,
  onCancel,
}: TransactionFormProps) {
  const [formData, setFormData] = useState({
    description: initialData?.description || "",
    amount: "",
    type: initialData?.type || "expense",
    category: "",
    date: initialData?.date || new Date().toISOString().split("T")[0],
    notes: initialData?.notes || "",
  });

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  /* ==============================
     SUBMIT
  ============================== */

  const handleSubmit = () => {
    if (!formData.description.trim()) {
      Alert.alert("Erro", "Informe a descrição");
      return;
    }

    const amount = Number(
      formData.amount.replace(/\./g, "").replace(",", "."),
    );

    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Erro", "Valor inválido");
      return;
    }

    if (!formData.category) {
      Alert.alert("Erro", "Selecione uma categoria");
      return;
    }

    const categoryMap =
      formData.type === "income"
        ? incomeCategoryMap
        : expenseCategoryMap;

    const payload: TransactionFormData = {
      description: formData.description,
      amount,
      type: formData.type,
      category: categoryMap[formData.category],
      date: formData.date,
      notes: formData.notes,
    };

    onSubmit(payload);
  };

  const categories =
    formData.type === "income" ? incomeCategories : expenseCategories;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerRow}>
          <Text style={styles.cardTitle}>Nova Transação</Text>
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardDescription}>
          {formData.type === "income"
            ? "Registre uma nova receita"
            : "Registre uma nova despesa"}
        </Text>
      </View>

      <ScrollView style={styles.cardContent}>
        {/* TIPO */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Tipo</Text>
          <TouchableOpacity
            style={styles.selectTrigger}
            onPress={() => setShowTypePicker(true)}
          >
            <Text style={styles.selectValue}>
              {formData.type === "income" ? "Receita" : "Despesa"}
            </Text>
            <Text style={styles.selectArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* VALOR */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Valor (R$)</Text>
          <TextInput
            style={styles.input}
            placeholder="0,00"
            value={formData.amount}
            keyboardType="numeric"
            onChangeText={(v) =>
              setFormData((prev) => ({ ...prev, amount: v }))
            }
          />
        </View>

        {/* DESCRIÇÃO */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={styles.input}
            value={formData.description}
            onChangeText={(v) =>
              setFormData((prev) => ({ ...prev, description: v }))
            }
          />
        </View>

        {/* CATEGORIA */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Categoria</Text>
          <TouchableOpacity
            style={styles.selectTrigger}
            onPress={() => setShowCategoryPicker(true)}
          >
            <Text style={styles.selectValue}>
              {formData.category || "Selecione uma categoria"}
            </Text>
            <Text style={styles.selectArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* DATA */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Data</Text>
          <TextInput
            style={styles.input}
            value={formData.date}
            onChangeText={(v) =>
              setFormData((prev) => ({ ...prev, date: v }))
            }
          />
        </View>

        {/* OBS */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Observações</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            value={formData.notes}
            onChangeText={(v) =>
              setFormData((prev) => ({ ...prev, notes: v }))
            }
          />
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? "Salvando..." : "Adicionar"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL TIPO */}
      <Modal transparent visible={showTypePicker} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione o Tipo</Text>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setFormData((prev) => ({
                  ...prev,
                  type: "income",
                  category: "",
                }));
                setShowTypePicker(false);
              }}
            >
              <Text style={styles.modalOptionText}>Receita</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setFormData((prev) => ({
                  ...prev,
                  type: "expense",
                  category: "",
                }));
                setShowTypePicker(false);
              }}
            >
              <Text style={styles.modalOptionText}>Despesa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL CATEGORIA */}
      <Modal transparent visible={showCategoryPicker} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={styles.modalOption}
                  onPress={() => {
                    setFormData((prev) => ({
                      ...prev,
                      category: cat,
                    }));
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ==============================
   STYLES
============================== */

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 12, margin: 16 },
  cardHeader: { padding: 16 },
  cardTitle: { fontSize: 20, fontWeight: "bold" },
  cardDescription: { color: "#666" },
  cardContent: { padding: 16 },
  formGroup: { marginBottom: 16 },
  label: { fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
  },
  textArea: { minHeight: 60 },
  selectTrigger: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  selectValue: { fontSize: 16 },
  selectArrow: { fontSize: 12 },
  submitButton: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: { color: "#fff", fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "80%",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  modalOption: { padding: 12 },
  modalOptionText: { textAlign: "center", fontSize: 16 },
  closeButtonText: { fontSize: 22 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
