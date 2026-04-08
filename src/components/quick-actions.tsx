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
      href: "/(tabs)/transactions?new=1&type=income&source=dashboard",
      title: "Adicionar Receita",
      description: "Registre uma nova entrada de dinheiro",
      icon: (
        <View style={[styles.iconBadge, styles.iconIncome]}>
          <Plus size={24} color="#ffffff" strokeWidth={2.4} />
        </View>
      ),
    },
    {
      href: "/(tabs)/transactions?new=1&type=expense&source=dashboard",
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
      href: "/(tabs)/graphs",
      title: "Graficos",
      description: "Veja a evolucao de receitas, despesas, investimentos e saldo",
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
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(197, 210, 223, 0.42)",
    backgroundColor: "rgba(255,255,255,0.96)",
    maxWidth: "100%",
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#10233f",
  },
  description: {
    fontSize: 13,
    color: "#718198",
    marginTop: 5,
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
    minHeight: 112,
    backgroundColor: "#f6fafc",
    borderWidth: 1,
    borderColor: "rgba(197, 210, 223, 0.48)",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  buttonSmall: {
    width: "100%",
    minHeight: 96,
    backgroundColor: "#f6fafc",
    borderWidth: 1,
    borderColor: "rgba(197, 210, 223, 0.48)",
    borderRadius: 22,
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
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconIncome: {
    backgroundColor: "#0d8a67",
  },
  iconExpense: {
    backgroundColor: "#c44747",
  },
  iconInfo: {
    backgroundColor: "#10233f",
  },
  buttonTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#11243f",
  },
  buttonDescription: {
    fontSize: 12,
    color: "#718198",
    lineHeight: 17,
  },
});
