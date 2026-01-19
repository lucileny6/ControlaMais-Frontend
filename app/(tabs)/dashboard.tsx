// app/(tabs)/dashboard.tsx
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardNav } from '@/components/dashboard-nav';
import { FinancialOverview } from "@/components/financial-overview";
import { QuickActions } from "@/components/quick-actions";
import { RecentTransactions } from "@/components/recent-transactions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface User{
    name?: string;
    email?: string;
}

export default function PageDashboard(){
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
                        <View style={styles.dashboardContent}>
                            <View style={styles.welcomeSection}>
                                <Text style={styles.title}>Dashboard</Text>
                                <Text style={styles.subtitle}>
                                    {user ? `Bem-vindo, ${user.name}` : 'Visão geral das suas finanças pessoais'}
                                </Text>
                            </View>
                            
                            <FinancialOverview />
                            
                            <View style={styles.grid}>
                                <View style={styles.column}>
                                    <RecentTransactions />
                                </View>
                                <View style={styles.column}>
                                    <QuickActions />
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </View>
    )
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
    dashboardContent: {
        flex: 1,
    },
    welcomeSection: {
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827'
    },
    subtitle: {
        fontSize: 16,
        color: '#4b5563',
        marginTop: 4
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 24,
        marginTop: 24,
    },
    column: {
        flex: 1,
        minWidth: 300,
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
});