import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNav } from '@/components/dashboard-nav';
import { ExpenseChart } from '@/components/expense-chart';
import { FinancialInsights } from '@/components/financial-insights';
import { IncomeExpenseChart } from '@/components/income-expense-chart';
import { MonthlySummary } from '@/components/monthly-summary';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface User {
    name?: string;
    email?: string;
}

export default function ReportsPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isLargeScreen = width >= 768;

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

    if (isLoading) {
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
                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                        <View style={styles.pageContent}>
                            <View style={styles.header}>
                                <Text style={styles.title}>Relatórios</Text>
                                <Text style={styles.subtitle}>
                                    {'Análise detalhada das suas finanças'}
                                </Text>
                            </View>

                            <View style={styles.section}>
                                <MonthlySummary />
                            </View>

                            <View style={[
                                styles.chartsGrid,
                                { 
                                    flexDirection: isLargeScreen ? 'row' : 'column',
                                    gap: isLargeScreen ? 20 : 16
                                }
                            ]}>
                                <View style={[
                                    styles.chartContainer,
                                    { 
                                        flex: isLargeScreen ? 1 : undefined,
                                        minWidth: isLargeScreen ? 0 : '100%'
                                    }
                                ]}>
                                    <IncomeExpenseChart />
                                </View>
                                <View style={[
                                    styles.chartContainer,
                                    { 
                                        flex: isLargeScreen ? 1 : undefined,
                                        minWidth: isLargeScreen ? 0 : '100%'
                                    }
                                ]}>
                                    <ExpenseChart />
                                </View>
                            </View>

                            <View style={styles.section}>
                                <FinancialInsights />
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },

    scrollContent: {
        flexGrow: 1,
    },

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


    header: {
        marginBottom: 24,
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

    section: {
        marginBottom: 24,
    },

    chartsGrid: {
        marginBottom: 24,
        alignItems: 'stretch'
    },

    chartContainer: {
        flex: 1,
        minWidth: 350
    },
});