import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNav } from '@/components/dashboard-nav';
import { DebtPredictor } from '@/components/debt-predictor';
import { PurchaseSimulator } from '@/components/purchase-simulator';
import { SavingsSuggestions } from '@/components/savings-suggestions';
import { Progress } from '@/components/ui/progress';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface User {
    name?: string;
    email?: string;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
}

// Mock goals data
const mockGoals: Goal[] = [
  {
    id: "1",
    title: "Reserva de Emergência",
    description: "6 meses de despesas para emergências",
    targetAmount: 7200,
    currentAmount: 2350,
    deadline: "2024-12-31",
    category: "Emergência",
  },
  {
    id: "2",
    title: "Viagem de Férias",
    description: "Viagem para o Nordeste nas férias",
    targetAmount: 2500,
    currentAmount: 800,
    deadline: "2024-07-01",
    category: "Lazer",
  },
  {
    id: "3",
    title: "Notebook Novo",
    description: "Notebook para trabalho e estudos",
    targetAmount: 3500,
    currentAmount: 1200,
    deadline: "2024-06-01",
    category: "Tecnologia",
  },
];

export default function GoalsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isLargeScreen = width >= 768;

    const [goals, setGoals] = useState<Goal[]>(mockGoals);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newGoal, setNewGoal] = useState({
        title: '',
        description: '',
        amount: '',
        deadline: '',
    });

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
            setIsLoading(false);
        }
    }

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
        });
    };

    const calculateDaysLeft = (deadline: string) => {
        const today = new Date();
        const targetDate = new Date(deadline);
        const diffTime = targetDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const renderGoalCard = (goal: Goal) => {
        const progress = (goal.currentAmount / goal.targetAmount) * 100;
        const remaining = goal.targetAmount - goal.currentAmount;
        const daysLeft = calculateDaysLeft(goal.deadline);

        return (
            <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    <Text style={styles.goalDescription}>{goal.description}</Text>
                </View>
                
                <View style={styles.goalContent}>
                    {/* Progresso */}
                    <View style={styles.progressSection}>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressLabel}>Progresso</Text>
                            <Text style={styles.progressPercentage}>{progress.toFixed(1)}%</Text>
                        </View>
                        <Progress value={progress} style={styles.progressBar} />
                    </View>

                    {/* Valores */}
                    <View style={styles.valuesContainer}>
                        <View style={styles.valueItem}>
                            <Text style={styles.valueLabel}>Atual</Text>
                            <Text style={styles.valueAmount}>R$ {formatCurrency(goal.currentAmount)}</Text>
                        </View>
                        <View style={styles.valueItem}>
                            <Text style={styles.valueLabel}>Meta</Text>
                            <Text style={styles.valueAmount}>R$ {formatCurrency(goal.targetAmount)}</Text>
                        </View>
                    </View>

                    {/* Informações restantes */}
                    <View style={styles.remainingInfo}>
                        <Text style={styles.remainingLabel}>Faltam</Text>
                        <Text style={styles.remainingAmount}>R$ {formatCurrency(remaining)}</Text>
                        <Text style={styles.remainingDays}>{daysLeft} dias restantes</Text>
                    </View>
                </View>
            </View>
        );
    };

    if (isLoading) {
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
                {isLargeScreen && (
                    <View style={styles.sidebar}>
                        <View style={styles.sidebarContent}>
                            <DashboardNav />
                        </View>
                    </View>
                )}
                
                <View style={styles.main}>
                    <ScrollView 
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.pageContent}>
                            <View style={styles.header}>
                                <View style={styles.headerText}>
                                    <Text style={styles.title}>Metas e Assistente Financeiro</Text>
                                    <Text style={styles.subtitle}>
                                        {'Gerencie suas metas e use ferramentas inteligentes'}
                                    </Text>
                                </View>

                                <TouchableOpacity 
                                    style={styles.newGoalButton}
                                    onPress={() => setIsDialogOpen(true)}
                                >
                                    <Text style={styles.newGoalButtonText}>Nova Meta</Text>
                                </TouchableOpacity>
                            </View>

                            <Modal
                                visible={isDialogOpen}
                                animationType="slide"
                                transparent={true}
                                onRequestClose={() => setIsDialogOpen(false)}
                            >
                                <View style={styles.modalOverlay}>
                                    <View style={styles.modalContent}>
                                        <View style={styles.modalHeader}>
                                            <Text style={styles.modalTitle}>Criar Nova Meta</Text>
                                            <TouchableOpacity 
                                                onPress={() => setIsDialogOpen(false)}
                                                style={styles.closeButton}
                                            >
                                                <Text style={styles.closeButtonText}>×</Text>
                                            </TouchableOpacity>
                                        </View>

                                        <ScrollView style={styles.modalBody}>
                                            <View style={styles.formGroup}>
                                                <Text style={styles.label}>Título da Meta</Text>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="Ex: Reserva de emergência"
                                                    value={newGoal.title}
                                                    onChangeText={(text) => setNewGoal(prev => ({...prev, title: text}))}
                                                />
                                            </View>

                                            <View style={styles.formGroup}>
                                                <Text style={styles.label}>Descrição</Text>
                                                <TextInput
                                                    style={[styles.input, styles.textArea]}
                                                    placeholder="Descreva sua meta..."
                                                    value={newGoal.description}
                                                    onChangeText={(text) => setNewGoal(prev => ({...prev, description: text}))}
                                                    multiline
                                                    numberOfLines={3}
                                                    textAlignVertical="top"
                                                />
                                            </View>

                                            <View style={styles.formRow}>
                                                <View style={[styles.formGroup, styles.flex1]}>
                                                    <Text style={styles.label}>Valor Alvo (R$)</Text>
                                                    <TextInput
                                                        style={styles.input}
                                                        placeholder="0,00"
                                                        value={newGoal.amount}
                                                        onChangeText={(text) => setNewGoal(prev => ({...prev, amount: text}))}
                                                        keyboardType="numeric"
                                                    />
                                                </View>

                                                <View style={[styles.formGroup, styles.flex1]}>
                                                    <Text style={styles.label}>Prazo</Text>
                                                    <TextInput
                                                        style={styles.input}
                                                        placeholder="YYYY-MM-DD"
                                                        value={newGoal.deadline}
                                                        onChangeText={(text) => setNewGoal(prev => ({...prev, deadline: text}))}
                                                    />
                                                </View>
                                            </View>

                                            <TouchableOpacity 
                                                style={styles.createButton}
                                                onPress={() => {
                                                    setIsDialogOpen(false);
                                                }}
                                            >
                                                <Text style={styles.createButtonText}>Criar Meta</Text>
                                            </TouchableOpacity>
                                        </ScrollView>
                                    </View>
                                </View>
                            </Modal>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Suas Metas</Text>
                                <View style={styles.goalsGrid}>
                                    {goals.map(renderGoalCard)}
                                </View>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Ferramentas Inteligentes</Text>
                                
                                <View style={styles.toolsGrid}>
                                    <View style={styles.toolItem}>
                                        <PurchaseSimulator />
                                    </View>
                                    <View style={styles.toolItem}>
                                        <DebtPredictor />
                                    </View>
                                </View>

                                <View style={styles.savingsSection}>
                                    <SavingsSuggestions />
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 16,
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

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    headerText: {
        flex: 1,
        marginRight: 12,
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
    newGoalButton: {
        backgroundColor: '#000000',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    newGoalButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 16,
    },
    goalsGrid: {
        gap: 16,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    goalCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        elevation: 2,
        minWidth: 300,
        minHeight: 180,
        padding: 24,
        flex: 1
    },
    goalHeader: {
        padding: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    goalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    goalDescription: {
        fontSize: 14,
        color: '#6b7280',
    },
    goalContent: {
        padding: 16,
        paddingTop: 12,
        gap: 16,
    },
    progressSection: {
        gap: 8,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    progressPercentage: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    progressBar: {
        height: 8,
    },
    valuesContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    valueItem: {
        flex: 1,
    },
    valueLabel: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 4,
    },
    valueAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    remainingInfo: {
        gap: 4,
    },
    remainingLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    remainingAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    remainingDays: {
        fontSize: 12,
        color: '#6b7280',
    },
    toolsGrid: {
        gap: 20,
        flexWrap: 'wrap',
        flexDirection: 'row'
    },
    toolItem: {
        flex: 1,
        minHeight: 200,
        minWidth: 300
    },
    savingsSection: {
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        width: '90%',
        maxWidth: 600,
        maxHeight: '80%',
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    closeButton: {
        padding: 4,
    },
    closeButtonText: {
        fontSize: 24,
        color: '#6b7280',
        fontWeight: 'bold',
    },
    modalBody: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 16,
        maxHeight: 400,
    },
    formRow: {
        flexDirection: 'row',
        gap: 12,
    },
    flex1: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#111827',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    createButton: {
        backgroundColor: '#000000',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    createButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});