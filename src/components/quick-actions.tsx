import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "expo-router";
import { BarChart3, MessageCircle, Minus, Plus } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";

type ActionItem = {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

export function QuickActions() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const actions: ActionItem[] = [
    {
      href: "/transactions?type=receita",
      title: "Adicionar Receita",
      description: "Registre uma nova entrada de dinheiro",
      icon: (
        <View style={[styles.iconBadge, styles.iconIncome]}>
          <Plus size={24} color="#ffffff" strokeWidth={2.4} />
        </View>
      ),
    },
    {
      href: "/(tabs)/transactions",
      title: "Adicionar Despesa",
      description: "Registre um novo gasto",
      icon: (
        <View style={[styles.iconBadge, styles.iconExpense]}>
          <Minus size={24} color="#ffffff" strokeWidth={2.4} />
        </View>
      ),
    },
    {
      href: "/(tabs)/chat",
      title: "Conversar com IA",
      description: "Tire duvidas sobre suas financas",
      icon: (
        <View style={[styles.iconBadge, styles.iconInfo]}>
          <MessageCircle size={22} color="#ffffff" strokeWidth={2.2} />
        </View>
      ),
    },
    {
      href: "/(tabs)/reports",
      title: "Ver Relatorios",
      description: "Analise seus gastos e receitas",
      icon: (
        <View style={[styles.iconBadge, styles.iconInfo]}>
          <BarChart3 size={22} color="#ffffff" strokeWidth={2.2} />
        </View>
      ),
    },
  ];

  return (
    <Card style={styles.card}>
      <CardHeader>
        <CardTitle style={styles.title}>Acoes Rapidas</CardTitle>
        <CardDescription style={styles.description}>
          Acesse rapidamente as funcionalidades principais
        </CardDescription>
      </CardHeader>
      <CardContent>
        <View style={isLargeScreen ? styles.gridLarge : styles.gridSmall}>
          {actions.map((action) => (
            <Link key={action.title} href={action.href as any} asChild>
              <TouchableOpacity style={isLargeScreen ? styles.buttonLarge : styles.buttonSmall}>
                <View style={styles.buttonInner}>
                  {action.icon}
                  <View style={styles.textBox}>
                    <Text style={styles.buttonTitle}>{action.title}</Text>
                    <Text style={styles.buttonDescription}>{action.description}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#dfe3e8",
    backgroundColor: "#ffffff",
    maxWidth: "100%",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#141820",
  },
  description: {
    fontSize: 14,
    color: "#686f7d",
    marginTop: 6,
  },
  gridLarge: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  gridSmall: {
    flexDirection: "column",
    gap: 12,
  },
  buttonLarge: {
    width: "48.8%",
    minHeight: 132,
    backgroundColor: "#f7f8fa",
    borderWidth: 1,
    borderColor: "#dde2e8",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  buttonSmall: {
    width: "100%",
    minHeight: 110,
    backgroundColor: "#f7f8fa",
    borderWidth: 1,
    borderColor: "#dde2e8",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  buttonInner: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  textBox: {
    flex: 1,
    gap: 6,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconIncome: {
    backgroundColor: "#2db39a",
  },
  iconExpense: {
    backgroundColor: "#ee635d",
  },
  iconInfo: {
    backgroundColor: "#43b8d5",
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#101620",
  },
  buttonDescription: {
    fontSize: 13,
    color: "#585f6d",
    lineHeight: 18,
  },
});
