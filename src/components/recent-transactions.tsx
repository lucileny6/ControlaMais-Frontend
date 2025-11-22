import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import React from 'react';
import { Text, View } from 'react-native';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
}

// Mock data - será substituído por dados reais
const mockTransactions: Transaction[] = [
  {
    id: "1",
    description: "Salário",
    amount: 3200,
    type: "income",
    category: "Trabalho",
    date: "2024-01-15",
  },
  {
    id: "2",
    description: "Supermercado",
    amount: -150,
    type: "expense",
    category: "Alimentação",
    date: "2024-01-14",
  },
  {
    id: "3",
    description: "Conta de luz",
    amount: -85,
    type: "expense",
    category: "Contas",
    date: "2024-01-13",
  },
  {
    id: "4",
    description: "Freelance",
    amount: 500,
    type: "income",
    category: "Extra",
    date: "2024-01-12",
  },
  {
    id: "5",
    description: "Transporte",
    amount: -45,
    type: "expense",
    category: "Transporte",
    date: "2024-01-11",
  },
];

export function RecentTransactions() {
  return (
    <Card style={styles.card}>
      <CardHeader style={styles.cardHeader}>
        <CardTitle style={styles.cardTitle}>Transações Recentes</CardTitle>
        <CardDescription style={styles.cardDescription}>
          Suas últimas movimentações financeiras
        </CardDescription>
      </CardHeader>
      <CardContent style={styles.cardContent}>
        <View style={styles.transactionsList}>
          {mockTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionInfo}>
                <View style={styles.transactionHeader}>
                  <Text style={styles.transactionDescription}>
                    {transaction.description}
                  </Text>
                  <Badge variant="outline" style={styles.badge}>
                    {transaction.category}
                  </Badge>
                </View>
                <Text style={styles.transactionDate}>
                  {new Date(transaction.date).toLocaleDateString("pt-BR")}
                </Text>
              </View>
              <View style={styles.amountContainer}>
                <Text style={[
                  styles.transactionAmount,
                  transaction.type === "income" ? styles.income : styles.expense
                ]}>
                  {transaction.type === "income" ? "+" : "-"}
                  R$ {Math.abs(transaction.amount).toLocaleString("pt-BR")}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </CardContent>
    </Card>
  );
}

const styles = {
  card: {
    minHeight: 400, // Altura mínima aumentada
    borderRadius: 16, // Border radius maior
  },
  cardHeader: {
    paddingBottom: 16, // Mais padding
  },
  cardTitle: {
    fontSize: 20, // Título maior
    fontWeight: 'bold' as const,
    marginBottom: 4, // Mais espaçamento
  },
  cardDescription: {
    fontSize: 16, // Descrição maior
    color: '#6b7280',
  },
  cardContent: {
    paddingTop: 8, // Ajuste de padding
  },
  transactionsList: {
    gap: 20, // Mais espaçamento entre transações
  },
  transactionItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 20, // Muito mais padding interno
    borderRadius: 12, // Border radius maior
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f8fafc', // Fundo mais suave
    minHeight: 80, // Altura mínima para cada item
  },
  transactionInfo: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12, // Mais espaçamento
    marginBottom: 8, // Mais espaçamento
  },
  transactionDescription: {
    fontSize: 18, // Fonte bem maior
    fontWeight: '600' as const,
    color: '#111827',
  },
  badge: {
    paddingHorizontal: 12, // Badge maior
    paddingVertical: 6, // Badge maior
  },
  transactionDate: {
    fontSize: 14, // Fonte maior
    color: '#6b7280',
  },
  amountContainer: {
    alignItems: 'flex-end' as const,
  },
  transactionAmount: {
    fontSize: 18, // Fonte bem maior para valores
    fontWeight: 'bold' as const,
  },
  income: {
    color: '#10b981', // green
  },
  expense: {
    color: '#ef4444', // red
  },
} as const;