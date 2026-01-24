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
   CATEGORIAS
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
   COMPONENTE
============================== */

const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  initialData,
  isLoading,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    description: initialData?.description || "",
    amount: initialData?.amount?.toString() || "",
    type: initialData?.type || "income",
    category: initialData?.category || "",
    date: initialData?.date || new Date().toISOString().split("T")[0],
    notes: initialData?.notes || "",
  });

  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const categories =
    formData.type === "income" ? incomeCategories : expenseCategories;

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

    onSubmit({
      description: formData.description,
      amount,
      type: formData.type,
      category: formData.category,
      date: formData.date,
      notes: formData.notes,
    });
  };

  return (
    <View style={styles.card}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Nova Transação</Text>

        <Text style={styles.subtitle}>
          {formData.type === "income"
            ? "Registre uma nova receita"
            : "Registre uma nova despesa"}
        </Text>

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
            keyboardType="numeric"
            value={formData.amount}
            onChangeText={(v) =>
              setFormData((p) => ({ ...p, amount: v }))
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
              setFormData((p) => ({ ...p, description: v }))
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
              setFormData((p) => ({ ...p, date: v }))
            }
          />
        </View>

        {/* SALVAR */}
        <TouchableOpacity
          style={styles.submit}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitText}>
            {isLoading ? "Salvando..." : "Salvar"}
          </Text>
        </TouchableOpacity>

        {onCancel && (
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.cancel}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* MODAL TIPO */}
      <Modal transparent visible={showTypePicker} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {["income", "expense"].map((t) => (
              <TouchableOpacity
                key={t}
                style={styles.modalOption}
                onPress={() => {
                  setFormData((p) => ({
                    ...p,
                    type: t as "income" | "expense",
                    category: "",
                  }));
                  setShowTypePicker(false);
                }}
              >
                <Text>
                  {t === "income" ? "Receita" : "Despesa"}
                </Text>
              </TouchableOpacity>
            ))}
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
                    setFormData((p) => ({ ...p, category: cat }));
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default TransactionForm;

/* ==============================
   STYLES
============================== */

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  content: {
    gap: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#666",
    marginBottom: 8,
  },
  formGroup: {
    marginBottom: 8,
  },
  label: {
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
  },
  selectTrigger: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  selectValue: {
    fontSize: 16,
  },
  selectArrow: {
    fontSize: 12,
  },
  submit: {
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  submitText: {
    color: "#fff",
    fontWeight: "600",
  },
  cancel: {
    textAlign: "center",
    color: "#666",
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "80%",
    borderRadius: 12,
    padding: 16,
  },
  modalOption: {
    padding: 12,
    alignItems: "center",
  },
});
