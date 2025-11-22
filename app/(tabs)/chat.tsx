import { ChatInput } from '@/components/chat-input';
import { ChatMessage } from '@/components/chat-message';
import { ChatSuggestions } from '@/components/chat-suggestion';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNav } from '@/components/dashboard-nav';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface User {
    name?: string;
    email?: string;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

// Mock AI responses
const getAIResponse = (userMessage: string): string => {
  const message = userMessage.toLowerCase();

  if (message.includes("saldo") || message.includes("quanto tenho")) {
    return "Seu saldo atual é de R$ 2.350,00. Você teve um aumento de 20,1% em relação ao mês passado! 💰";
  }

  if (message.includes("economizar") || message.includes("poupar")) {
    return "Aqui estão algumas dicas para economizar: 1) Anote todos os gastos, 2) Defina metas mensais, 3) Evite compras por impulso. Quer que eu te ajude a criar uma meta de poupança?";
  }

  if (message.includes("despesa") || message.includes("gasto")) {
    return "Vou te ajudar a registrar uma despesa! Qual foi o valor e a categoria do gasto? Por exemplo: 'Gastei R$ 50 no supermercado'";
  }

  if (message.includes("meta")) {
    return "Criar metas é fundamental! Sua meta atual é poupar R$ 1.000 e você já tem R$ 750 (75%). Quer ajustar essa meta ou criar uma nova?";
  }

  if (message.includes("gastos") || message.includes("análise")) {
    return "Este mês você gastou R$ 850, que representa 26,6% da sua receita. Suas principais categorias de gasto são: Alimentação (35%), Contas (25%), Transporte (15%). Está dentro do recomendado!";
  }

  if (message.includes("compra") || message.includes("simular")) {
    return "Vou simular uma compra para você! Me diga o valor do produto que está pensando em comprar e eu analiso o impacto no seu orçamento. Ou acesse a página de Metas para usar o simulador completo.";
  }

  if (message.includes("endividamento") || message.includes("dívida")) {
    return "Baseado no seu padrão atual de gastos, seu risco de endividamento é BAIXO. Você tem uma margem de segurança boa! Para análise detalhada, visite a seção de Metas onde temos o preditor de endividamento.";
  }

  if (message.includes("sugestões") || message.includes("dicas")) {
    return "Tenho algumas sugestões personalizadas para você economizar até R$ 394/mês! As principais são: reduzir delivery (R$ 80/mês), renegociar planos (R$ 45/mês) e usar mais transporte público (R$ 120/mês). Veja todas na página de Metas!";
  }

  return "Entendi sua pergunta! Como assistente financeiro, posso te ajudar com controle de gastos, metas de poupança, análise de despesas, simulação de compras e previsão de endividamento. Pode me fazer perguntas específicas sobre suas finanças!";
}

export default function ChatPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isLargeScreen = width >= 768;

    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            content:
                "Olá! Sou seu assistente financeiro pessoal. Como posso te ajudar hoje a organizar suas finanças? Posso ajudar com análises, simulações de compra, previsões de endividamento e sugestões de economia!",
            isUser: false,
            timestamp: new Date(),
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        checkAuthentication();
    }, []);

    const checkAuthentication = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('user');
            const authToken = await AsyncStorage.getItem('authToken');

            if (!storedUser || !authToken) {
                router.replace('/login');
                return;
            }

            setUser(JSON.parse(storedUser));
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            router.replace('/login');
        } finally {
            setIsLoadingAuth(false);
        }
    }

    const handleSendMessage = async (content: string) => {
        const userMessage: Message = {
            id: Date.now().toString(),
            content,
            isUser: true,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        // Simular delay da IA
        setTimeout(() => {
            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                content: getAIResponse(content),
                isUser: false,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, aiResponse]);
            setIsLoading(false);
        }, 1000);
    };

    if (isLoadingAuth) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000000" />
                <Text style={styles.loadingText}>Carregando...</Text>
            </View>
        );
    }

    return(
        <View style={[styles.layoutContainer, { paddingTop: insets.top }]}>
            <DashboardHeader />
            
            <View style={styles.content}>
                {/* DashboardNav apenas no desktop */}
                {isLargeScreen && (
                    <View style={styles.sidebar}>
                        <View style={styles.sidebarContent}>
                            <DashboardNav />
                        </View>
                    </View>
                )}
                
                <View style={styles.main}>
                    <KeyboardAvoidingView 
                        style={styles.keyboardContainer}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    >
                        {/* Mensagem sobre navegação (opcional para mobile) */}
                        {!isLargeScreen && (
                            <View style={styles.mobileHint}>
                                <Text style={styles.mobileHintText}>
                                    📱 Use a barra inferior para navegar
                                </Text>
                            </View>
                        )}

                        <View style={styles.pageContent}>
                            {/* Cabeçalho */}
                            <View style={styles.header}>
                                <View style={styles.headerText}>
                                    <Text style={styles.title}>Chat com IA</Text>
                                    <Text style={styles.subtitle}>
                                        {'Converse com seu assistente financeiro pessoal'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.chatContainer}>
                                {/* Sugestões */}
                                <ChatSuggestions onSelectSuggestion={handleSendMessage} />

                                {/* Área de mensagens */}
                                <ScrollView 
                                    style={styles.messagesContainer}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.messagesContent}
                                >
                                    {messages.map((message) => (
                                        <ChatMessage
                                            key={message.id}
                                            message={message.content}
                                            isUser={message.isUser}
                                            timestamp={message.timestamp}
                                        />
                                    ))}

                                    {isLoading && (
                                        <View style={styles.loadingMessage}>
                                            <View style={styles.avatar}>
                                                <Text style={styles.avatarText}>IA</Text>
                                            </View>
                                            <View style={styles.loadingBubble}>
                                                <View style={styles.typingIndicator}>
                                                    <View style={[styles.dot, styles.dot1]}></View>
                                                    <View style={[styles.dot, styles.dot2]}></View>
                                                    <View style={[styles.dot, styles.dot3]}></View>
                                                </View>
                                            </View>
                                        </View>
                                    )}
                                </ScrollView>

                                {/* Input */}
                                <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // 🔁 ESTILOS DO LAYOUT (REUTILIZÁVEIS)
    layoutContainer: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
    },
    sidebar: {
        width: 256,
        borderRightWidth: 1,
        borderRightColor: '#e2e8f0',
        backgroundColor: '#ffffff',
    },
    sidebarContent: {
        paddingVertical: 24,
    },
    main: {
        flex: 1,
    },
    keyboardContainer: {
        flex: 1,
    },
    pageContent: {
        flex: 1,
    },
    mobileHint: {
        backgroundColor: '#dbeafe',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        alignItems: 'center',
    },
    mobileHintText: {
        color: '#1e40af',
        fontSize: 14,
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: '#666666',
    },

    // 🔽 ESTILOS ESPECÍFICOS DA TELA CHAT 🔽
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        backgroundColor: '#ffffff',
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
    },
    chatContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 8,
    },
    loadingMessage: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    avatar: {
        height: 32,
        width: 32,
        borderRadius: 16,
        backgroundColor: '#6b7280',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 12,
        color: '#ffffff',
        fontWeight: 'bold',
    },
    loadingBubble: {
        backgroundColor: '#e5e7eb',
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 12,
        maxWidth: '80%',
    },
    typingIndicator: {
        flexDirection: 'row',
        gap: 4,
        alignItems: 'center',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#6b7280',
    },
    dot1: {
        opacity: 0.6,
    },
    dot2: {
        opacity: 0.8,
    },
    dot3: {
        opacity: 1,
    },
});