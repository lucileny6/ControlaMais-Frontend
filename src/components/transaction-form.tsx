import React, { useEffect, useState } from "react";
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
  recorrente: boolean;
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

const incomeCategories = ["Salário", "Comissão", "Renda extra"];

const expenseCategories = [
  "Moradia",
  "Supermercado",
  "Restaurante",
  "Padaria",
  "Açougue",
  "Delivery",
  "Combustível",
  "Uber",
  "Transporte público",
  "Medicamentos",
  "Plano de saúde",
  "Academia",
  "Streaming",
  "Cinema",
  "Viagens",
  "Compras",
  "Educação",
  "Pets",
  "Assinaturas",
  "Tecnologia",
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
  const formatDateForDisplay = (value?: string) => {
    const raw = String(value ?? "").trim();
    if (!raw) {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.getFullYear();
      return `${day}-${month}-${year}`;
    }

    const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
    if (isoPattern.test(raw)) {
      const [, year, month, day] = raw.match(isoPattern)!;
      return `${day}-${month}-${year}`;
    }

    return raw;
  };

  const [formData, setFormData] = useState({
    description: initialData?.description || "",
    amount: initialData?.amount?.toString() || "",
    type: initialData?.type || "income",
    category: initialData?.category || "",
    date: formatDateForDisplay(initialData?.date),
    notes: initialData?.notes || "",
    recorrente: initialData?.recorrente ?? false,
  });

  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    setFormData({
      description: initialData?.description || "",
      amount: initialData?.amount?.toString() || "",
      type: initialData?.type || "income",
      category: initialData?.category || "",
      date: formatDateForDisplay(initialData?.date),
      notes: initialData?.notes || "",
      recorrente: initialData?.recorrente ?? false,
    });
  }, [initialData]);

  const categories =
    formData.type === "income" ? incomeCategories : expenseCategories;
  const handleExitCategoryPicker = () => {
    setShowCategoryPicker(false);
  };

  /* ==============================
     SUBMIT
  ============================== */

  const handleSubmit = () => {
    if (!formData.description.trim()) {
      Alert.alert("Erro", "Informe a descrição");
      return;
    }

    const amount = Number(formData.amount.replace(/\./g, "").replace(",", "."));

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
      recorrente: formData.recorrente,
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
            onChangeText={(v) => setFormData((p) => ({ ...p, amount: v }))}
          />
        </View>

        {/* DESCRIÇÃO */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={styles.input}
            value={formData.description}
            onChangeText={(v) => setFormData((p) => ({ ...p, description: v }))}
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
            placeholder="DD-MM-AAAA"
            value={formData.date}
            onChangeText={(v) => setFormData((p) => ({ ...p, date: v }))}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Recorrencia</Text>
          <TouchableOpacity
            style={[
              styles.recurringToggle,
              formData.recorrente && styles.recurringToggleActive,
            ]}
            onPress={() =>
              setFormData((previous) => ({
                ...previous,
                recorrente: !previous.recorrente,
              }))
            }
          >
            <View
              style={[
                styles.recurringIndicator,
                formData.recorrente && styles.recurringIndicatorActive,
              ]}
            />
            <View style={styles.recurringTextBlock}>
              <Text style={styles.recurringTitle}>Transacao recorrente</Text>
              <Text style={styles.recurringDescription}>
                Marque se essa receita ou despesa acontece todo mes.
              </Text>
            </View>
          </TouchableOpacity>
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
                <Text>{t === "income" ? "Receita" : "Despesa"}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* MODAL CATEGORIA */}
      <Modal
        transparent
        visible={showCategoryPicker}
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
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
            <TouchableOpacity
              style={styles.modalExitButton}
              onPress={handleExitCategoryPicker}
            >
              <Text style={styles.modalExitButtonText}>Sair</Text>
            </TouchableOpacity>
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
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  selectValue: {
    fontSize: 14,
  },
  recurringToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
  },
  recurringToggleActive: {
    borderColor: "#0B6E5B",
    backgroundColor: "#ecfdf5",
  },
  recurringIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#9ca3af",
    backgroundColor: "#ffffff",
  },
  recurringIndicatorActive: {
    borderColor: "#0B6E5B",
    backgroundColor: "#0B6E5B",
  },
  recurringTextBlock: {
    flex: 1,
    gap: 2,
  },
  recurringTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  recurringDescription: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 17,
  },
  selectArrow: {
    fontSize: 11,
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
    width: "88%",
    maxWidth: 320,
    borderRadius: 12,
    padding: 10,
    maxHeight: 300,
  },
  modalOption: {
    paddingVertical: 8,
    alignItems: "center",
  },
  modalExitButton: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
  },
  modalExitButtonText: {
    color: "#374151",
    fontWeight: "600",
  },
});
