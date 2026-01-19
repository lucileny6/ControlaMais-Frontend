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

export interface TransactionFormData {
  description: string;
  amount: string;
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

export function TransactionForm({
  onSubmit,
  initialData,
  isLoading,
  onCancel,
}: TransactionFormProps) {
  const [formData, setFormData] = useState<TransactionFormData>({
    description: initialData?.description || "",
    amount: initialData?.amount || "",
    type: initialData?.type || "expense",
    category: initialData?.category || "",
    date: initialData?.date || new Date().toISOString().split("T")[0],
    notes: initialData?.notes || "",
  });

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const handleSubmit = () => {
    // Validação básica
    if (!formData.description.trim()) {
      Alert.alert("Erro", "Por favor, insira uma descrição");
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      Alert.alert("Erro", "Por favor, insira um valor válido");
      return;
    }
    if (!formData.category) {
      Alert.alert("Erro", "Por favor, selecione uma categoria");
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (field: keyof TransactionFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const categories =
    formData.type === "income" ? incomeCategories : expenseCategories;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerRow}>
          <Text style={styles.cardTitle}>
            {initialData ? "Editar Transação" : "Nova Transação"}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
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

        <View style={styles.formGroup}>
          <Text style={styles.label}>Valor (R$)</Text>
          <TextInput
            style={styles.input}
            placeholder="0,00"
            value={formData.amount}
            onChangeText={(value) => handleChange("amount", value)}
            keyboardType="numeric"
            returnKeyType="done"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Supermercado, Salário, Conta de luz..."
            value={formData.description}
            onChangeText={(value) => handleChange("description", value)}
            returnKeyType="done"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Categoria</Text>
          <TouchableOpacity
            style={styles.selectTrigger}
            onPress={() => setShowCategoryPicker(true)}
          >
            <Text
              style={
                formData.category
                  ? styles.selectValue
                  : styles.selectPlaceholder
              }
            >
              {formData.category || "Selecione uma categoria"}
            </Text>
            <Text style={styles.selectArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Data</Text>
          <TextInput
            style={styles.input}
            value={formData.date}
            onChangeText={(value) => handleChange("date", value)}
            placeholder="DD-MM-YYYY"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Observações (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Adicione detalhes sobre esta transação..."
            value={formData.notes}
            onChangeText={(value) => handleChange("notes", value)}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.buttonsContainer}>
          {onCancel && (
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading
                ? "Salvando..."
                : initialData
                  ? "Atualizar"
                  : "Adicionar Transação"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showTypePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTypePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione o Tipo</Text>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                handleChange("type", "income");
                setShowTypePicker(false);
              }}
            >
              <Text style={styles.modalOptionText}>Receita</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                handleChange("type", "expense");
                setShowTypePicker(false);
              }}
            >
              <Text style={styles.modalOptionText}>Despesa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalOption, styles.modalCancel]}
              onPress={() => setShowTypePicker(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCategoryPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione a Categoria</Text>
            <ScrollView style={styles.modalScroll}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={styles.modalOption}
                  onPress={() => {
                    handleChange("category", category);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{category}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.modalOption, styles.modalCancel]}
                onPress={() => setShowCategoryPicker(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    margin: 16,
    elevation: 3,
  },
  cardHeader: {
    padding: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    color: "#666666",
  },
  cardContent: {
    padding: 18,
    paddingTop: 8,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#000000",
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  selectTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    padding: 12,
  },
  selectValue: {
    fontSize: 16,
    color: "#000000",
  },
  selectPlaceholder: {
    fontSize: 16,
    color: "#999999",
  },
  selectArrow: {
    fontSize: 12,
    color: "#666666",
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666666",
  },
  submitButton: {
    backgroundColor: "#000000",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    width: "80%",
    maxHeight: "60%",
    overflow: "hidden",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    textAlign: "center",
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#000000",
    textAlign: "center",
  },
  modalCancel: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#f9f9f9",
  },
  modalCancelText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    fontWeight: "500",
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    color: "#6b7280",
    fontWeight: "bold",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
});
