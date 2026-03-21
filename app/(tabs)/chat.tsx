import { ChatInput } from "@/components/chat-input";
import { ChatMessage } from "@/components/chat-message";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardNav } from "@/components/dashboard-nav";
import { AIResponse, AITransactionAction } from "@/lib/types";
import { apiService } from "@/services/api";
import { chatIAService } from "@/services/chatIA";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const DASHBOARD_GRADIENT = ["#F8FBFD", "#EEF4F7", "#E8F0F4", "#E2EBF1"] as const;

export default function ChatPage() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Olá! Posso te ajudar a registrar receitas e despesas usando linguagem natural",
      isUser: false,
      timestamp: new Date(),
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false);
  const [pendingAction, setPendingAction] = useState<AITransactionAction | null>(null);
  const [pendingConfirmationData, setPendingConfirmationData] = useState<Record<string, unknown> | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const hasPendingConfirmationData = pendingConfirmationData !== null;

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);

    return () => clearTimeout(timeout);
  }, [messages, isLoading, aguardandoConfirmacao]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response: AIResponse = await chatIAService.sendMessage(content);

      const iaMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.mensagem,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, iaMessage]);
      setAguardandoConfirmacao(response.tipo === "CONFIRMACAO");
      setPendingConfirmationData(response.dados ?? null);
      setPendingAction(response.acao ?? response.action ?? null);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: String(
            error?.message ?? "Erro ao comunicar com o workflow do chat.",
          ),
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const createTransactionFromAction = async (action: AITransactionAction) => {
    const normalizedType = normalizeTransactionType(action);
    const payload = {
      descricao: String(action.descricao ?? action.description ?? "Lancamento via chat").trim(),
      valor: parseCurrencyValue(action.valor ?? action.amount),
      categoria: String(action.categoria ?? action.category ?? "Sem categoria").trim(),
      data: normalizeDateValue(action.data ?? action.date),
      recorrente: parseBooleanValue(action.recorrente ?? action.recurring),
      recurring: parseBooleanValue(action.recorrente ?? action.recurring),
    };

    if (!payload.descricao || payload.valor <= 0 || !payload.categoria || !payload.data) {
      throw new Error("A resposta do chat nao trouxe dados suficientes para criar o lancamento.");
    }

    if (normalizedType === "income") {
      await apiService.createReceita(payload);
      return "Receita registrada com sucesso pelo chat.";
    }

    await apiService.createDespesa(payload);
    return "Despesa registrada com sucesso pelo chat.";
  };

  const confirmar = () => {
    setAguardandoConfirmacao(false);
    if (!pendingAction) {
      handleSendMessage("sim");
      return;
    }

    appendUserSystemChoice("Confirmar");

    setIsLoading(true);
    void createTransactionFromAction(pendingAction)
      .then((message) => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            content: message,
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      })
      .catch((error: any) => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            content: String(error?.message ?? "Nao foi possivel registrar o lancamento via chat."),
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      })
      .finally(() => {
        setPendingAction(null);
        setPendingConfirmationData(null);
        setIsLoading(false);
      });
  };

  const cancelar = () => {
    setAguardandoConfirmacao(false);
    setPendingAction(null);
    setPendingConfirmationData(null);
    handleSendMessage("cancelar");
  };

  const appendUserSystemChoice = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${content}`,
        content,
        isUser: true,
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <LinearGradient colors={DASHBOARD_GRADIENT} locations={[0, 0.3, 0.57, 0.82, 1]} style={styles.gradient}>
      <View style={[styles.layoutContainer, { paddingTop: insets.top }]}>
        <DashboardHeader />

        <View style={styles.content}>
          {isLargeScreen && (
            <View style={styles.sidebar}>
              <DashboardNav />
            </View>
          )}

          <View style={styles.main}>
            <View style={styles.chatShell}>
              <View style={styles.heroHeader}>
                <Text style={styles.pageTitle}>Chat IA</Text>
                <Text style={styles.pageSubtitle}>
                  Converse com o assistente para registrar lancamentos e tirar duvidas financeiras.
                </Text>
              </View>
            <KeyboardAvoidingView
              style={styles.keyboardArea}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                onContentSizeChange={() =>
                  scrollViewRef.current?.scrollToEnd({ animated: true })
                }
              >
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg.content}
                    isUser={msg.isUser}
                    timestamp={msg.timestamp}
                  />
                ))}

                {aguardandoConfirmacao && (
                  <View style={styles.confirmBox}>
                    <Text style={styles.confirmText}>
                      {hasPendingConfirmationData
                        ? "Deseja confirmar os dados retornados pelo chat?"
                        : "Deseja confirmar a acao sugerida pelo chat?"}
                    </Text>

                    <View style={styles.confirmButtons}>
                      <TouchableOpacity style={styles.confirmBtn} onPress={confirmar}>
                        <Text style={styles.confirmBtnText}>Confirmar</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.cancelBtn} onPress={cancelar}>
                        <Text style={styles.cancelBtnText}>Cancelar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {isLoading && <ActivityIndicator style={{ margin: 16 }} />}
              </ScrollView>

              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={isLoading || aguardandoConfirmacao}
              />
            </KeyboardAvoidingView>
            </View>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

function normalizeTransactionType(action: AITransactionAction) {
  const rawType = String(action.tipo ?? action.type ?? "").trim().toLowerCase();
  return ["receita", "income", "entrada", "ganho"].includes(rawType) ? "income" : "expense";
}

function parseCurrencyValue(value: string | number | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== "string") {
    return 0;
  }

  const raw = value.trim();
  if (!raw) {
    return 0;
  }

  const cleaned = raw.replace(/[^\d,.-]/g, "");
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  if (hasComma && hasDot) {
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    const normalized =
      lastComma > lastDot
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned.replace(/,/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (hasComma) {
    const parsed = Number(cleaned.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseBooleanValue(value: boolean | string | undefined) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return false;
  }

  return ["true", "1", "sim", "yes"].includes(value.trim().toLowerCase());
}

function normalizeDateValue(value: string | undefined) {
  if (!value) {
    return new Date().toISOString().split("T")[0];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return new Date().toISOString().split("T")[0];
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("/");
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().split("T")[0];
  }

  return parsed.toISOString().split("T")[0];
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  layoutContainer: { flex: 1, backgroundColor: "transparent" },
  content: { flex: 1, flexDirection: "row" },
  sidebar: {
    width: 256,
    borderRightWidth: 1,
    borderRightColor: "rgba(148, 163, 184, 0.18)",
    backgroundColor: "rgba(255, 255, 255, 0.78)",
  },
  main: { flex: 1, padding: 24 },
  chatShell: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.74)",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.92)",
    shadowColor: "#0f172a",
    shadowOpacity: 0.07,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    overflow: "hidden",
  },
  heroHeader: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.14)",
    backgroundColor: "rgba(255, 255, 255, 0.34)",
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#10233f",
    letterSpacing: -0.8,
  },
  pageSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: "#5f7087",
    maxWidth: 760,
  },
  keyboardArea: { flex: 1 },
  messagesContainer: { flex: 1 },
  messagesContent: { paddingHorizontal: 18, paddingVertical: 14 },

  confirmBox: {
    backgroundColor: "#f6fafc",
    padding: 16,
    borderRadius: 18,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(197, 210, 223, 0.45)",
  },
  confirmText: {
    fontSize: 14,
    marginBottom: 12,
    color: "#10233f",
    fontWeight: "600",
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 12,
  },
  confirmBtn: {
    backgroundColor: "#10233f",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  confirmBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  cancelBtn: {
    backgroundColor: "#f4f7fa",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(197, 210, 223, 0.55)",
  },
  cancelBtnText: {
    color: "#b84b5f",
    fontWeight: "700",
  },
});
