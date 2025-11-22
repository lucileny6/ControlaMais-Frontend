import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface FinancialData {
    balance: number;
    income: number;
    expenses: number;
    savingsGoal: number;
    currentSavings: number;
}

export function FinancialOverview() {
    const [data, setData] = useState<FinancialData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setData({
                balance: 2350,
                income: 3200,
                expenses: 850,
                savingsGoal: 1000,
                currentSavings: 750,
            });
            setLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <View style={styles.grid}>
                {[...Array(4)].map((_, i) => (
                    <Card key={i} style={styles.card}>
                        <CardHeader>
                            <View style={[styles.skeleton, { width: 80 }]} />
                        </CardHeader>
                        <CardContent>
                            <View style={[styles.skeleton, { width: 96, height: 32, marginBottom: 8 }]} />
                            <View style={[styles.skeleton, { width: 128 }]} />
                        </CardContent>
                    </Card>
                ))}
            </View>
        );
    }

    const safeData = data!;
    const savingsPercentage = (safeData.currentSavings / safeData.savingsGoal) * 100;
    const expensePercentage = (safeData.expenses / safeData.income) * 100;

    return (
        <View style={styles.grid}>
            <Card style={styles.card} maxWidth={600}>
                <CardHeader>
                    <CardTitle style={styles.cardTitleStyle}>Saldo Total</CardTitle>
                </CardHeader>
                <CardContent>
                    <Text style={styles.amountPrimary}>
                        R$ {safeData.balance.toLocaleString("pt-BR")}
                    </Text>
                    <Text style={styles.subtitle}>
                        +20.1% em relação ao mês passado
                    </Text>
                </CardContent>
            </Card>

            <Card style={styles.card} maxWidth={600}>
                <CardHeader>
                    <CardTitle style={styles.cardTitleStyle}>Receitas</CardTitle>
                </CardHeader>
                <CardContent>
                    <Text style={styles.amountIncome}>
                        R$ {safeData.income.toLocaleString("pt-BR")}
                    </Text>
                    <Text style={styles.subtitle}>Este mês</Text>
                </CardContent>
            </Card>

            <Card style={styles.card} maxWidth={600}>
                <CardHeader>
                    <CardTitle style={styles.cardTitleStyle}>Despesas</CardTitle>
                </CardHeader>
                <CardContent>
                    <Text style={styles.amountExpense}>
                        R$ {safeData.expenses.toLocaleString("pt-BR")}
                    </Text>
                    <Text style={styles.progressText}>
                        {expensePercentage.toFixed(1)}% da receita
                    </Text>
                </CardContent>
            </Card>

            <Card style={styles.card} maxWidth={600}>
                <CardHeader>
                    <CardTitle style={styles.cardTitleStyle}>Meta de Poupança</CardTitle>
                </CardHeader>
                <CardContent>
                    <Text style={styles.amountSavings}>
                        {savingsPercentage.toFixed(0)}%
                    </Text>
                    <Text style={styles.progressText}>
                        R$ {safeData.currentSavings} de R$ {safeData.savingsGoal}
                    </Text>
                </CardContent>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        gap: 20, // Aumentei o gap entre os cards
        marginBottom: 24,
        padding: 16,
    },
    card: {
        flex: 1,
        minWidth: 160, // Largura mínima maior
        minHeight: 140, // Altura mínima maior
        paddingVertical: 20, // Mais padding vertical
        paddingHorizontal: 16, // Mais padding horizontal
    },
    cardTitleStyle: {
        fontSize: 16, // Aumentei a fonte do título
        fontWeight: '600', // Deixei mais forte
        color: '#6b7280',
        marginBottom: 8, // Mais espaçamento
    },
    amountPrimary: {
        fontSize: 28, // Aumentei bastante o valor
        fontWeight: 'bold',
        color: '#3b82f6',
        marginBottom: 8, // Mais espaçamento
    },
    amountIncome: {
        fontSize: 28, // Aumentei bastante o valor
        fontWeight: 'bold',
        color: '#10b981',
        marginBottom: 8, // Mais espaçamento
    },
    amountExpense: {
        fontSize: 28, // Aumentei bastante o valor
        fontWeight: 'bold',
        color: '#ef4444',
        marginBottom: 8, // Mais espaçamento
    },
    amountSavings: {
        fontSize: 28, // Aumentei bastante o valor
        fontWeight: 'bold',
        color: '#8b5cf6',
        marginBottom: 8, // Mais espaçamento
    },
    subtitle: {
        fontSize: 14, // Aumentei a fonte do subtítulo
        color: '#9ca3af',
        lineHeight: 18, // Melhor legibilidade
    },
    progressText: {
        fontSize: 14, // Aumentei a fonte
        color: '#9ca3af',
        marginTop: 8,
        lineHeight: 18, // Melhor legibilidade
    },
    skeleton: {
        backgroundColor: '#f3f4f6',
        borderRadius: 4,
        height: 16,
    },
});