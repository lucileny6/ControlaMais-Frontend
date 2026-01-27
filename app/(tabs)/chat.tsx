import { ChatInput } from '@/components/chat-input';
import { ChatMessage } from '@/components/chat-message';
import { ChatSuggestions } from '@/components/chat-suggestion';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNav } from '@/components/dashboard-nav';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";


/* =========================
   TYPES
========================= */

type ChatState = "NORMAL" | "AGUARDANDO_CONFIRMACAO";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface AcaoFinanceira {
  tipo: "RECEITA" | "DESPESA";
  valor: number;
  categoria: string;
  descricao: string;
  data: string;
}

interface AIResponse {
  tipo: "TEXTO" | "CONFIRMACAO";
  mensagem: string;
  acao?: AcaoFinanceira;
}

/* =========================
   MOCK IA (TEMPORÁRIO)
========================= */

const mockIA = (mensagem: string): AIResponse => {
  const text = mensagem.toLowerCase();

  if (text.includes("paguei") || text.includes("gastei")) {
    return {
      tipo: "CONFIRMACAO",
      mensagem:
        "Entendi que você quer cadastrar a seguinte despesa. Confirma?",
      acao: {
        tipo: "DESPESA",
        valor: 80,
        categoria: "Internet",
        descricao: "Conta de internet",
        data: "2024-03-20",
      },
    };
  }

  if (text.includes("recebi") || text.includes("salário")) {
    return {
      tipo: "CONFIRMACAO",
      mensagem:
        "Entendi que você quer cadastrar a seguinte receita. Confirma?",
      acao: {
        tipo: "RECEITA",
        valor: 1200,
        categoria: "Salário",
        descricao: "Salário mensal",
        data: "2024-03-20",
      },
    };
  }

  return {
    tipo: "TEXTO",
    mensagem:
      "Posso te ajudar a cadastrar receitas ou despesas. Exemplo: 'Paguei 80 de internet ontem'.",
  };
};

/* =========================
   COMPONENT
========================= */

export default function ChatPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Olá! Posso te ajudar a cadastrar receitas e despesas usando linguagem natural.",
      isUser: false,
      timestamp: new Date(),
    },
  ]);

  const [chatState, setChatState] = useState<ChatState>("NORMAL");
  const [acaoPendente, setAcaoPendente] = useState<AcaoFinanceira | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    setTimeout(() => {
      const response = mockIA(content);

      const iaMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.mensagem,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, iaMessage]);
      setIsLoading(false);

      if (response.tipo === "CONFIRMACAO" && response.acao) {
        setChatState("AGUARDANDO_CONFIRMACAO");
        setAcaoPendente(response.acao);
      }
    }, 800);
  };

  const confirmarAcao = () => {
    if (!acaoPendente) return;

    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        content: "✅ Ação confirmada! (mock – ainda não salva no banco)",
        isUser: false,
        timestamp: new Date(),
      },
    ]);

    setChatState("NORMAL");
    setAcaoPendente(null);
  };

  const cancelarAcao = () => {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        content: "❌ Ok, ação cancelada. Pode corrigir ou tentar novamente.",
        isUser: false,
        timestamp: new Date(),
      },
    ]);

    setChatState("NORMAL");
    setAcaoPendente(null);
  };

  return (
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
              {messages.map(msg => (
                <ChatMessage
                  key={msg.id}
                  message={msg.content}
                  isUser={msg.isUser}
                  timestamp={msg.timestamp}
                />
              ))}

              {chatState === "AGUARDANDO_CONFIRMACAO" && acaoPendente && (
                <View style={styles.confirmBox}>
                  <Text style={styles.confirmText}>
                    {acaoPendente.tipo} • R$ {acaoPendente.valor} •{" "}
                    {acaoPendente.categoria}
                  </Text>

                  <View style={styles.confirmButtons}>
                    <TouchableOpacity
                      style={styles.confirmBtn}
                      onPress={confirmarAcao}
                    >
                      <Text style={styles.confirmBtnText}>Confirmar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={cancelarAcao}
                    >
                      <Text style={styles.cancelBtnText}>Cancelar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {isLoading && <ActivityIndicator style={{ margin: 16 }} />}
            </ScrollView>

            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={isLoading || chatState === "AGUARDANDO_CONFIRMACAO"}
            />
          </KeyboardAvoidingView>
        </View>
      </View>
    </View>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  layoutContainer: { flex: 1, backgroundColor: "#f8fafc" },
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
