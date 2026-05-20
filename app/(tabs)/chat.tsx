import { ChatInput } from "@/components/chat-input";
import { ChatMessage } from "@/components/chat-message";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardNav } from "@/components/dashboard-nav";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { chatIAService } from "@/services/chatIA";
import { useFocusEffect } from "expo-router";
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

interface User {
  name?: string;
  nome?: string;
  nomeCompleto?: string;
  displayName?: string;
  userName?: string;
  user_name?: string;
  username?: string;
  fullName?: string;
  firstName?: string;
  given_name?: string;
  email?: string;
}

const DASHBOARD_GRADIENT = ["#F8FBFD", "#EEF4F7", "#E8F0F4", "#E2EBF1"] as const;
const buildInitialMessages = (name?: string): Message[] => [
  {
    id: "1",
    content: getWelcomeMessage(name),
    isUser: false,
    timestamp: new Date(),
  },
];
const getWelcomeMessage = (name?: string) =>
  name
    ? `Olá, ${name}! Estou aqui para te ajudar. Posso consultar seu saldo, gastos e receitas ou registrar novas movimentações. O que deseja fazer?`
    : "Olá! Estou aqui para te ajudar. Posso consultar seu saldo, gastos e receitas ou registrar novas movimentações. O que deseja fazer?";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
    const decodeBase64 = (globalThis as any)?.atob;
    if (typeof decodeBase64 !== "function") return null;

    return JSON.parse(decodeBase64(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getStringClaim(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function formatNameFromEmail(email?: string) {
  const localPart = String(email ?? "").trim().split("@")[0] ?? "";
  if (!localPart) return "";

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveUserName(user: User | null) {
  if (!user) return "";

  const emailPrefix = user.email?.includes("@") ? user.email.split("@")[0].trim().toLowerCase() : "";
  const candidates = [
    user.displayName,
    user.nomeCompleto,
    user.nome,
    user.fullName,
    user.firstName,
    user.given_name,
    user.name,
    user.userName,
    user.user_name,
    user.username,
  ];

  for (const candidate of candidates) {
    const value = String(candidate ?? "").trim();
    if (!value) continue;
    if (emailPrefix && value.toLowerCase() === emailPrefix) continue;
    if (/\d/.test(value)) continue;
    return value;
  }

  return formatNameFromEmail(user.email);
}

function getUserFromToken(token: string): User | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const email = getStringClaim(payload, ["email", "upn"]);
  const sub = getStringClaim(payload, ["sub"]);
  const name = getStringClaim(payload, [
    "name",
    "nome",
    "nomeCompleto",
    "displayName",
    "fullName",
    "firstName",
    "given_name",
    "preferred_username",
    "user_name",
    "username",
  ]);

  const resolvedEmail = email || (sub.includes("@") ? sub : "");
  if (!name && !resolvedEmail) return null;

  return { name: name || undefined, email: resolvedEmail || undefined };
}

export default function ChatPage() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const displayNameRef = useRef("");

  const [messages, setMessages] = useState<Message[]>(() => buildInitialMessages());
  const [isLoading, setIsLoading] = useState(false);
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false);
  const [pendingConfirmationMessage, setPendingConfirmationMessage] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);

    return () => clearTimeout(timeout);
  }, [messages, isLoading, aguardandoConfirmacao]);

  useEffect(() => {
    const loadDisplayName = async () => {
      const [storedUser, legacyStoredUser, storedDisplayName, legacyDisplayName, authToken, legacyAuthToken] = await Promise.all([
        AsyncStorage.getItem("user"),
        AsyncStorage.getItem("@user"),
        AsyncStorage.getItem("displayName"),
        AsyncStorage.getItem("@displayName"),
        AsyncStorage.getItem("authToken"),
        AsyncStorage.getItem("@authToken"),
      ]);

      const persistedDisplayName = String(storedDisplayName || legacyDisplayName || "").trim();
      const token = String(authToken || legacyAuthToken || "");
      const serializedUser = storedUser || legacyStoredUser;

      let parsedUser: User | null = null;
      if (serializedUser) {
        try {
          parsedUser = JSON.parse(serializedUser) as User;
        } catch {
          parsedUser = null;
        }
      }

      if (persistedDisplayName) {
        parsedUser = {
          ...(parsedUser ?? {}),
          displayName: persistedDisplayName,
        };
      }

      const resolvedDisplayName =
        resolveUserName(parsedUser) ||
        resolveUserName(getUserFromToken(token)) ||
        persistedDisplayName;

      displayNameRef.current = resolvedDisplayName;

      setMessages((prev) => {
        if (prev.length === 0) return prev;
        if (prev[0]?.id !== "1" || prev[0]?.isUser) return prev;

        const next = [...prev];
        next[0] = {
          ...next[0],
          content: getWelcomeMessage(resolvedDisplayName),
        };
        return next;
      });
    };

    void loadDisplayName();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setMessages(buildInitialMessages(displayNameRef.current));
        setIsLoading(false);
        setAguardandoConfirmacao(false);
        setPendingConfirmationMessage(null);
      };
    }, []),
  );

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
      const response = await chatIAService.sendMessage(content);

      const iaMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.mensagem,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, iaMessage]);
      setAguardandoConfirmacao(response.tipo === "CONFIRMACAO");
      setPendingConfirmationMessage(response.tipo === "CONFIRMACAO" ? response.mensagem : null);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: String(error?.message ?? "Erro ao comunicar com o backend do chat."),
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
    setPendingConfirmationMessage(null);
    void handleSendMessage("sim");
  };

  const cancelar = () => {
    setAguardandoConfirmacao(false);
    setPendingConfirmationMessage(null);
    void handleSendMessage("cancelar");
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
                  Converse com o assistente para registrar lançamentos e tirar dúvidas financeiras.
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
                        {pendingConfirmationMessage ?? "Se estiver tudo certo, confirme para continuar."}
                      </Text>

                      <Text style={styles.confirmHint}>
                        Sua escolha será enviada para o backend continuar o fluxo.
                      </Text>

                      <View style={styles.confirmButtons}>
                        <TouchableOpacity style={styles.confirmBtn} onPress={confirmar}>
                          <Text style={styles.confirmBtnText}>Sim, confirmar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelBtn} onPress={cancelar}>
                          <Text style={styles.cancelBtnText}>Não, cancelar</Text>
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
    letterSpacing: 0,
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
    marginBottom: 8,
    color: "#10233f",
    fontWeight: "600",
    lineHeight: 21,
  },
  confirmHint: {
    fontSize: 13,
    marginBottom: 14,
    color: "#5f7087",
    lineHeight: 19,
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
