import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNav } from '@/components/dashboard-nav';
import { TransactionForm } from "@/components/transaction-form";
import { TransactionList } from "@/components/transaction-list";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface User {
    name?: string;
    email?: string;
}

interface Transaction{
    id: string,
    description: string,
    amount: number,
    type: "income" | "expense",
    category: string,
    date: string,
    notes? : string;
}

const mockTransactions: Transaction[] = [
    {
        id: "1",
        description: "Salário",
        amount: 3200.00,
        type: "income",
        category: "Salário",
        date: "2025-10-30"
    },
    {
        id: "2",
        description: "Supermercado",
        amount: 150.00,
        type: "expense",
        category: "Alimentação",
        date: "2025-11-02",
        notes: "Compras da semana"
    },
    {
        id: "3",
        description: "Conta de luz",
        amount: 120.00,
        type: "expense",
        category: "Contas",
        date: "2025-11-07"
    },
    {
        id: "4",
        description: "Freelance",
        amount: 500.00,
        type: "income",
        category: "Freelance",
        date: "2025-11-12"
    },
    {
        id: "5",
        description: "Transporte",
        amount: 80.00,
        type: "expense",
        category: "Transporte",
        date: "2025-11-13"
    },
];

export default function PageTransactions(){
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isLargeScreen = width >= 768;

    const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null> (null);
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

    const handleAddTransaction = async (formData: any) => {
        setIsLoading(true);

        setTimeout(() => {
            const newTransaction: Transaction = {
                id: Date.now().toString(),
                description: formData.description,
                amount: Number.parseFloat(formData.amount),
                type: formData.type,
                category: formData.category,
                date: formData.date,
                notes: formData.notes
            };

            setTransactions((prev) => [newTransaction, ...prev]);
            setIsDialogOpen(false);
            setIsLoading(false);
            console.log("[v0] Transaction added: ", newTransaction);
        }, 1000);
    };

    const handleEditTransaction = async (formData: any) => {
        if(!editingTransaction) return;

        setIsLoading(true);

        setTimeout(() => {
            const updatedTransaction: Transaction = {
                ...editingTransaction,
                description: formData.description,
                amount: Number.parseFloat(formData.amount),
                type: formData.type,
                category: formData.category,
                date: formData.date,
                notes: formData.notes
            };

            setTransactions((prev) => prev.map((t) => (t.id === editingTransaction.id ? updatedTransaction: t)));
            setEditingTransaction(null);
            setIsDialogOpen(false);
            setIsLoading(false);
            console.log("[v0] Transaction updated: ", updatedTransaction);
        }, 1000);
    };

    const handleDeleteTransaction = (id: string) => {
        Alert.alert(
            "Confirmar exclusão",
            "Tem certeza que deseja excluir está transação?",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: () => {
                        setTransactions((prev) => prev.filter((t) => t.id !== id));
                        console.log("[v0] Transaction deleted: ", id);
                    }
                }
            ]
        );
    };

    const openAddDialog = () => {
        setEditingTransaction(null);
        setIsDialogOpen(true);
    };

    const openEditDialog = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsDialogOpen(true);
    };

    if (isLoadingAuth) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000000" />
                <Text style={styles.loadingText}>Carregando...</Text>
            </View>
        );
    }

    return (
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
                    <ScrollView style={styles.scrollContent}>
                        <View style={styles.pageContainer}>
                            <View style={styles.pageContent}>
                                <View style={styles.header}>
                                    <View>
                                        <Text style={styles.title}>Transações</Text>
                                        <Text style={styles.subtitle}>
                                            {'Gerencie suas transações'}
                                        </Text>
                                    </View>

                                    <TouchableOpacity style={styles.addButton} onPress={openAddDialog}>
                                        <Text style={styles.addButtonText}>Nova Transação</Text>
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

                                            <TransactionForm
                                                onSubmit={editingTransaction ? handleEditTransaction : handleAddTransaction}
                                                initialData={
                                                    editingTransaction
                                                    ? {
                                                        description: editingTransaction.description,
                                                        amount: editingTransaction.amount.toString(),
                                                        type: editingTransaction.type,
                                                        category: editingTransaction.category,
                                                        date: editingTransaction.date,
                                                        notes: editingTransaction.notes,
                                                    }
                                                    : undefined
                                                }
                                                isLoading={isLoading}
                                                onCancel={() => setIsDialogOpen(false)}
                                            />
                                        </View>
                                    </View>
                                </Modal>

                                <TransactionList 
                                    transactions={transactions}
                                    onEdit={openEditDialog}
                                    onDelete={handleDeleteTransaction}
                                />
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
    pageContainer: {
        flex: 1,
    },
    pageContent: {
        flex: 1,
        padding: 16,
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

    scrollContent: {
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        marginTop: 4,
    },
    addButton: {
        backgroundColor: '#000000',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        width: '100%',
        maxWidth: 700,
        maxHeight: '95%',
    },
});