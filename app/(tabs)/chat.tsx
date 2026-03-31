import { ChatInput } from "@/components/chat-input";
import { ChatMessage } from "@/components/chat-message";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardNav } from "@/components/dashboard-nav";
import {
  buildMonthlyFinanceSnapshot,
  normalizeDashboardTransaction,
  parseTransactionDate,
} from "@/lib/monthly-finance";
import {
  interpretUserMessage,
  type InterpretedMessage,
} from "@/lib/interpretador";
import { AIResponse, AITransactionAction } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

interface PendingRegistrationDraft {
  tipo: "income" | "expense";
  subject: string;
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
const getWelcomeMessage = (name?: string) =>
  name
    ? `Olá, ${name}! 👋 Estou aqui para te ajudar. Posso consultar seu saldo, gastos e receitas ou registrar novas movimentações. O que deseja fazer?`
    : "Olá! 👋 Estou aqui para te ajudar. Posso consultar seu saldo, gastos e receitas ou registrar novas movimentações. O que deseja fazer?";

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

// Legacy helper kept temporarily while the chat flow is being migrated.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isCancelMessage(normalized: string) {
  return ["cancelar", "cancela", "nao", "não", "parar", "deixa"].includes(normalized);
}

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
  const [pendingConfirmationMessage, setPendingConfirmationMessage] = useState<string | null>(null);
  const [pendingRegistrationDraft, setPendingRegistrationDraft] = useState<PendingRegistrationDraft | null>(null);
  const [displayName, setDisplayName] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);
  const hasPendingConfirmationData = pendingConfirmationData !== null;
  const hasStructuredConfirmation = pendingAction !== null || hasPendingConfirmationData;

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

      setDisplayName(resolvedDisplayName);

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

  const addNamePrefix = (message: string) =>
    displayName ? `${displayName}, ${message.charAt(0).toLowerCase()}${message.slice(1)}` : message;

  const resolveTransactionCategory = (
    rawCategory: string,
    transactionType: PendingRegistrationDraft["tipo"] | "income" | "expense",
  ) => {
    const normalized = rawCategory
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    if (transactionType === "income") {
      if (["salario", "pagamento", "holerite"].some((keyword) => normalized.includes(keyword))) {
        return "Salário";
      }

      if (["comissao", "bonus", "bonificacao"].some((keyword) => normalized.includes(keyword))) {
        return "Comissão";
      }

      return "Renda extra";
    }

    if (
      [
        "investimento",
        "investi",
        "investir",
        "aporte",
        "apliquei",
        "aplicacao",
        "acoes",
        "acao",
        "tesouro",
        "cdb",
        "fii",
        "cripto",
        "bitcoin",
      ].some((keyword) => normalized.includes(keyword))
    ) {
      return "Investimento";
    }

    if (
      [
        "mercado",
        "supermercado",
        "feira",
        "padaria",
        "acougue",
        "açougue",
        "sacolao",
        "hortifruti",
      ].some((keyword) => normalized.includes(keyword))
    ) {
      return "Alimentacao";
    }

    if (["lanche", "restaurante", "ifood", "delivery", "pizza", "hamburguer"].some((keyword) => normalized.includes(keyword))) {
      return "Restaurante";
    }

    if (["uber", "99", "onibus", "ônibus", "metro", "metrô", "gasolina", "combustivel", "combustível"].some((keyword) => normalized.includes(keyword))) {
      return "Transporte";
    }

    if (["aluguel", "condominio", "condomínio", "agua", "água", "luz", "energia", "internet"].some((keyword) => normalized.includes(keyword))) {
      return "Moradia";
    }

    if (["farmacia", "farmácia", "remedio", "remédio", "consulta", "medico", "médico", "plano de saude", "plano de saúde"].some((keyword) => normalized.includes(keyword))) {
      return "Saude";
    }

    if (["cinema", "viagem", "show", "bar", "festa", "lazer", "streaming"].some((keyword) => normalized.includes(keyword))) {
      return "Lazer";
    }

    return "Outros";
  };

  const buildActionFromInterpretation = (
    interpretation: InterpretedMessage,
    fallbackType?: PendingRegistrationDraft["tipo"],
    fallbackCategory?: string,
  ): AITransactionAction | null => {
    const inferredType =
      interpretation.intent === "create_income"
        ? "income"
        : interpretation.intent === "create_expense"
        ? "expense"
        : fallbackType;

    const amount = interpretation.entities.amount;
    if (!inferredType || amount === undefined || amount <= 0) {
      return null;
    }

    const description = String(interpretation.entities.category ?? fallbackCategory ?? "").trim();
    const category = resolveTransactionCategory(description, inferredType);
    const label = inferredType === "expense" ? "despesa" : "receita";

    return {
      tipo: inferredType,
      valor: amount,
      categoria: category,
      descricao: description || `Lancamento de ${label} via chat`,
      data: normalizeDateValue(interpretation.entities.date),
    };
  };

  const buildRegistrationDecision = (interpretation: InterpretedMessage): AIResponse | null => {
    if (interpretation.intent === "create_transaction") {
      setPendingRegistrationDraft(null);
      return {
        tipo: "TEXTO",
        mensagem: addNamePrefix(
          "Claro. Me diga se voce quer registrar uma receita ou uma despesa e informe valor e descricao.",
        ),
      };
    }

    if (interpretation.intent !== "create_expense" && interpretation.intent !== "create_income") {
      return null;
    }

    const transactionType = interpretation.intent === "create_income" ? "income" : "expense";
    const amount = interpretation.entities.amount;
    const category = String(interpretation.entities.category ?? "").trim();
    const label = transactionType === "expense" ? "despesa" : "receita";
    const connector = transactionType === "expense" ? "com" : "de";

    if (amount !== undefined && amount > 0) {
      const action = buildActionFromInterpretation(interpretation, transactionType, category);
      if (!action) {
        return null;
      }

      const subjectText = category || label;
      setPendingRegistrationDraft(null);
      return {
        tipo: "CONFIRMACAO",
        mensagem: addNamePrefix(`Confirma ${formatCurrency(amount)} ${connector} ${subjectText}?`),
        acao: action,
      };
    }

    if (category) {
      setPendingRegistrationDraft({
        tipo: transactionType,
        subject: category,
      });
      return {
        tipo: "TEXTO",
        mensagem: addNamePrefix(`Claro. Qual o valor da ${label} ${connector} ${category}?`),
      };
    }

    setPendingRegistrationDraft(null);
    return {
      tipo: "TEXTO",
      mensagem: addNamePrefix(
        transactionType === "expense"
          ? 'Claro. Me diga o gasto com valor e descricao, por exemplo: "gastei 15 reais com lanche".'
          : 'Claro. Me diga a receita com valor e descricao, por exemplo: "recebi 1200 de salario".',
      ),
    };
  };

  const buildPendingDraftDecision = (interpretation: InterpretedMessage): AIResponse | null => {
    if (!pendingRegistrationDraft) {
      return null;
    }

    if (interpretation.intent === "cancel") {
      setPendingRegistrationDraft(null);
      return {
        tipo: "TEXTO",
        mensagem: addNamePrefix("Tudo bem. Cancelei esse cadastro pelo chat."),
      };
    }

    const amount = interpretation.entities.amount;
    const operationLabel = pendingRegistrationDraft.tipo === "expense" ? "despesa" : "receita";
    const connector = pendingRegistrationDraft.tipo === "expense" ? "com" : "de";

    if (amount === undefined || amount <= 0) {
      return {
        tipo: "TEXTO",
        mensagem: addNamePrefix(
          `Ainda preciso do valor da ${operationLabel} ${connector} ${pendingRegistrationDraft.subject}.`,
        ),
      };
    }

    const action = buildActionFromInterpretation(
      interpretation,
      pendingRegistrationDraft.tipo,
      pendingRegistrationDraft.subject,
    );
    if (!action) {
      return null;
    }

    setPendingRegistrationDraft(null);
    return {
      tipo: "CONFIRMACAO",
      mensagem: addNamePrefix(
        `Confirma ${formatCurrency(amount)} ${connector} ${pendingRegistrationDraft.subject}?`,
      ),
      acao: action,
    };
  };

  const buildLocalFinanceReply = async (interpretation: InterpretedMessage): Promise<string | null> => {
    const intent = interpretation.intent;
    const isFinanceIntent = [
      "get_balance",
      "get_expenses",
      "get_income",
      "get_summary",
      "get_top_expense",
    ].includes(intent);

    if (!isFinanceIntent) {
      return null;
    }

    try {
      const transactions = await apiService.getTransactions();
      const normalizedTransactions = (transactions ?? []).map((transaction: any, index: number) =>
        normalizeDashboardTransaction(transaction, index),
      );
      const snapshot = buildMonthlyFinanceSnapshot(normalizedTransactions);
      const requestedDate = interpretation.entities.date;
      const currentDate = new Date();
      const currentDateKey = [
        currentDate.getFullYear(),
        String(currentDate.getMonth() + 1).padStart(2, "0"),
        String(currentDate.getDate()).padStart(2, "0"),
      ].join("-");

      const filteredTransactions = requestedDate
        ? normalizedTransactions.filter((transaction) => {
            const parsedDate = parseTransactionDate(transaction.date);
            if (!parsedDate) return false;
            const transactionDate = [
              parsedDate.getFullYear(),
              String(parsedDate.getMonth() + 1).padStart(2, "0"),
              String(parsedDate.getDate()).padStart(2, "0"),
            ].join("-");
            return transactionDate === requestedDate;
          })
        : snapshot.transactions;

      const filteredIncome = filteredTransactions
        .filter((transaction) => transaction.type === "income")
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      const filteredExpenses = filteredTransactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      const filteredBalance = filteredIncome - filteredExpenses;
      const filteredExpenseTotals = filteredTransactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((acc, transaction) => {
          const category = transaction.category || "Sem categoria";
          acc.set(category, (acc.get(category) ?? 0) + transaction.amount);
          return acc;
        }, new Map<string, number>());
      const topExpenseCategory = [...filteredExpenseTotals.entries()].sort((a, b) => b[1] - a[1])[0];

      const monthLabel = snapshot.monthDate.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });
      const specificDateLabel =
        requestedDate && parseTransactionDate(requestedDate)
          ? parseTransactionDate(requestedDate)!.toLocaleDateString("pt-BR")
          : null;
      const isToday = requestedDate === currentDateKey;
      const periodReference = isToday
        ? "hoje"
        : specificDateLabel
        ? `em ${specificDateLabel}`
        : `em ${monthLabel}`;

      if (filteredTransactions.length === 0) {
        if (intent === "get_income") {
          return addNamePrefix(`Ainda nao encontrei receitas registradas ${periodReference}.`);
        }

        if (intent === "get_expenses" || intent === "get_top_expense") {
          return addNamePrefix(`Ainda nao encontrei despesas registradas ${periodReference}.`);
        }

        return addNamePrefix(`Ainda nao encontrei lancamentos ${periodReference}.`);
      }

      if (intent === "get_balance") {
        return addNamePrefix(`Seu saldo ${periodReference} esta em ${formatCurrency(filteredBalance)}.`);
      }

      if (intent === "get_income") {
        return addNamePrefix(`Voce recebeu ${formatCurrency(filteredIncome)} ${periodReference}.`);
      }

      if (intent === "get_expenses") {
        return addNamePrefix(`Voce gastou ${formatCurrency(filteredExpenses)} ${periodReference}.`);
      }

      if (intent === "get_top_expense") {
        if (!topExpenseCategory) {
          return addNamePrefix(`Nao encontrei uma categoria de despesa dominante ${periodReference}.`);
        }

        return addNamePrefix(
          `A categoria que mais pesou ${periodReference} foi ${topExpenseCategory[0]}, com ${formatCurrency(topExpenseCategory[1])}.`,
        );
      }

      const categoryHighlight = topExpenseCategory
        ? ` A categoria que mais pesou foi ${topExpenseCategory[0]} com ${formatCurrency(topExpenseCategory[1])}.`
        : "";

      return addNamePrefix(
        `No periodo consultado, suas receitas somam ${formatCurrency(filteredIncome)}, as despesas ${formatCurrency(filteredExpenses)} e o saldo esta em ${formatCurrency(filteredBalance)}.${categoryHighlight}`,
      );
    } catch (error) {
      console.warn("[Chat] Nao foi possivel montar o resumo financeiro local:", error);
      return null;
    }
  };

  const buildLocalResponse = async (interpretation: InterpretedMessage): Promise<AIResponse | null> => {
    const draftResponse = buildPendingDraftDecision(interpretation);
    if (draftResponse) {
      return draftResponse;
    }

    const registrationResponse = buildRegistrationDecision(interpretation);
    if (registrationResponse) {
      return registrationResponse;
    }

    const financeReply = await buildLocalFinanceReply(interpretation);
    if (financeReply) {
      return {
        tipo: "TEXTO",
        mensagem: financeReply,
      };
    }

    if (interpretation.intent === "cancel") {
      return {
        tipo: "TEXTO",
        mensagem: addNamePrefix("Tudo bem. Se quiser, podemos tentar novamente."),
      };
    }

    return null;
  };

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
      const interpretation = interpretUserMessage(content);
      const localResponse = await buildLocalResponse(interpretation);
      const response: AIResponse = localResponse ?? (await chatIAService.sendMessage(content));

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
      setPendingConfirmationMessage(response.tipo === "CONFIRMACAO" ? response.mensagem : null);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: String(error?.message ?? "Erro ao comunicar com o workflow do chat."),
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
      observacao: "[CHAT] Criado via chat",
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

  //  solução simples
  window.location.reload();
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
        setPendingConfirmationMessage(null);
        setIsLoading(false);
      });
  };

  const cancelar = () => {
    setAguardandoConfirmacao(false);
    setPendingAction(null);
    setPendingConfirmationData(null);
    setPendingConfirmationMessage(null);
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
                      {pendingConfirmationMessage ??
                        (hasStructuredConfirmation
                          ? "Se estiver tudo certo, confirme para registrar este lancamento."
                          : "Se a interpretacao estiver correta, confirme para continuar.")}
                    </Text>

                    <Text style={styles.confirmHint}>
                      {hasStructuredConfirmation
                        ? "Ao confirmar, o lancamento sera salvo no seu historico."
                        : "Ao confirmar, vamos responder 'sim' para a IA continuar o fluxo."}
                    </Text>

                    <View style={styles.confirmButtons}>
                      <TouchableOpacity style={styles.confirmBtn} onPress={confirmar}>
                        <Text style={styles.confirmBtnText}>Sim, confirmar</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.cancelBtn} onPress={cancelar}>
                        <Text style={styles.cancelBtnText}>Nao, cancelar</Text>
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
