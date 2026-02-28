import { ChatInput } from "@/components/chat-input";
import { ChatMessage } from "@/components/chat-message";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardNav } from "@/components/dashboard-nav";
import { chatIAService } from "@/services/chatIA";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
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

interface AIResponse {
  tipo: "TEXTO" | "CONFIRMACAO";
  mensagem: string;
}

const DASHBOARD_GRADIENT = ["#000000", "#073D33", "#107A65", "#20F4CA"] as const;

export default function ChatPage() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "OlÃ¡! Posso te ajudar a registrar receitas e despesas usando linguagem natural ðŸ˜Š",
      isUser: false,
      timestamp: new Date(),
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false);

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
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: "Erro ao comunicar com o servidor ðŸ˜•",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmar = () => {
    setAguardandoConfirmacao(false);
    handleSendMessage("sim");
  };

  const cancelar = () => {
    setAguardandoConfirmacao(false);
    handleSendMessage("cancelar");
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
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <ScrollView style={styles.messagesContainer}>
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
                    <Text style={styles.confirmText}>Deseja confirmar a aÃ§Ã£o?</Text>

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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  layoutContainer: { flex: 1, backgroundColor: "transparent" },
  content: { flex: 1, flexDirection: "row" },
  sidebar: { width: 256, backgroundColor: "#fff" },
  main: { flex: 1 },
  messagesContainer: { flex: 1, padding: 16 },

  confirmBox: {
    backgroundColor: "#eef2ff",
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  confirmText: {
    fontSize: 14,
    marginBottom: 8,
    color: "#1e40af",
    fontWeight: "500",
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 12,
  },
  confirmBtn: {
    backgroundColor: "#10b981",
    padding: 8,
    borderRadius: 6,
  },
  confirmBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancelBtn: {
    backgroundColor: "#ef4444",
    padding: 8,
    borderRadius: 6,
  },
  cancelBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
