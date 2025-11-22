import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

export function QuickActions() {
    const { width } = useWindowDimensions();
    const isLargeScreen = width >= 768;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>Acesse rapidamente as funcionalidades principais</CardDescription>
            </CardHeader>
            <CardContent>
                <View style={isLargeScreen ? styles.gridLarge : styles.gridSmall}>
                    <Link href="/(tabs)/transactions" asChild>
                        <TouchableOpacity style={isLargeScreen ? styles.buttonLarge : styles.buttonSmall}>
                            <Text style={styles.buttonTitle}>Adicionar Receita</Text>
                            <Text style={styles.buttonDescription}>
                                Registre uma nova entrada de dinheiro
                            </Text>
                        </TouchableOpacity>
                    </Link>

                    <Link href="/(tabs)/transactions" asChild>
                        <TouchableOpacity style={isLargeScreen ? styles.buttonLarge : styles.buttonSmall}>
                            <Text style={styles.buttonTitle}>Adicionar Despesa</Text>
                            <Text style={styles.buttonDescription}>
                                Registre um novo gasto
                            </Text>
                        </TouchableOpacity>
                    </Link>

                    <Link href="/(tabs)/chat" asChild>
                        <TouchableOpacity style={isLargeScreen ? styles.buttonLarge : styles.buttonSmall}>
                            <Text style={styles.buttonTitle}>Conversar com IA</Text>
                            <Text style={styles.buttonDescription}>
                                Tire dúvidas sobre suas finanças
                            </Text>
                        </TouchableOpacity>
                    </Link>

                    <Link href="/(tabs)/reports" asChild>
                        <TouchableOpacity style={isLargeScreen ? styles.buttonLarge : styles.buttonSmall}>
                            <Text style={styles.buttonTitle}>Ver Relatórios</Text>
                            <Text style={styles.buttonDescription}>
                                Analise seus gastos e receitas
                            </Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </CardContent>
        </Card>
    );
}

const styles = {
  gridLarge: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 16,
  },
  gridSmall: {
    flexDirection: 'column' as const,
    gap: 12,
  },
  buttonLarge: {
    width: '48%',
    minHeight: 120,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 20,
    justifyContent: 'center' as const,
  },
  buttonSmall: {
    width: '100%',
    minHeight: 100,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center' as const,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 8,
  },
  buttonDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
} as const;