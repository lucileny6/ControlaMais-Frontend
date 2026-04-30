import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  BarChart3,
  Bot,
  CircleDollarSign,
  Goal,
  LayoutDashboard,
  Lightbulb,
  Wallet,
} from "lucide-react-native";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HELP_SECTIONS = [
  {
    title: "Painel",
    description: "Acompanhe seu saldo, receitas, despesas e ultimos lancamentos em um so lugar.",
    icon: LayoutDashboard,
  },
  {
    title: "Transacoes",
    description: "Cadastre entradas e gastos informando valor, categoria, data e descricao.",
    icon: Wallet,
  },
  {
    title: "IA",
    description: "Converse com o assistente para tirar duvidas financeiras ou registrar lancamentos pelo chat.",
    icon: Bot,
  },
  {
    title: "Metas",
    description: "Defina e acompanhe objetivos financeiros, como economizar ou planejar compras.",
    icon: Goal,
  },
  {
    title: "Graficos",
    description: "Visualize seus gastos e receitas de forma clara e organizada.",
    icon: BarChart3,
  },
  {
    title: "Economia",
    description: "Use ferramentas para simular compras, analisar dividas e receber sugestoes.",
    icon: CircleDollarSign,
  },
] as const;

const HELP_GRADIENT = ["#F8FBFD", "#EEF4F7", "#E8F0F4", "#E2EBF1"] as const;

export default function HelpPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompactScreen = width < 430;

  return (
    <LinearGradient colors={HELP_GRADIENT} locations={[0, 0.32, 0.66, 1]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button">
            <ArrowLeft size={20} color="#10233f" strokeWidth={2.4} />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Controla</Text>
            <Text style={styles.logoPlus}>+</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, isCompactScreen && styles.scrollContentCompact]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.contentCard, isCompactScreen && styles.contentCardCompact]}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>Como usar o ControlaMais</Text>
              <Text style={styles.subtitle}>Guia rapido das funcoes basicas do sistema.</Text>
            </View>

            <View style={styles.sectionList}>
              {HELP_SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <View key={section.title} style={styles.helpSection}>
                    <View style={styles.iconBox}>
                      <Icon size={20} color="#0f766e" strokeWidth={2.2} />
                    </View>

                    <View style={styles.sectionText}>
                      <Text style={styles.sectionTitle}>{section.title}</Text>
                      <Text style={styles.sectionDescription}>{section.description}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.tipBox}>
              <View style={styles.tipIconBox}>
                <Lightbulb size={20} color="#10233f" strokeWidth={2.2} />
              </View>

              <View style={styles.sectionText}>
                <Text style={styles.tipTitle}>Dica importante</Text>
                <Text style={styles.tipDescription}>
                  Mantenha suas transacoes atualizadas para que o painel, graficos e a IA fornecam informacoes mais precisas.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.dashboardButton}
              onPress={() => router.replace("/(tabs)/dashboard")}
              accessibilityRole="button"
            >
              <LayoutDashboard size={18} color="#ffffff" strokeWidth={2.2} />
              <Text style={styles.dashboardButtonText}>Voltar ao painel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    height: 72,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(197, 210, 223, 0.45)",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(197, 210, 223, 0.55)",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 14,
  },
  logoText: {
    fontSize: 30,
    fontWeight: "800",
    color: "#10233f",
  },
  logoPlus: {
    fontSize: 30,
    fontWeight: "800",
    color: "#15a087",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    width: "100%",
    maxWidth: 980,
    alignSelf: "center",
  },
  scrollContentCompact: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  contentCard: {
    backgroundColor: "rgba(255, 255, 255, 0.76)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#0f172a",
    shadowOpacity: 0.07,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 5,
  },
  contentCardCompact: {
    borderRadius: 22,
    padding: 14,
  },
  titleSection: {
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.14)",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#10233f",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#5f7087",
  },
  sectionList: {
    marginTop: 18,
    gap: 12,
  },
  helpSection: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(197, 210, 223, 0.38)",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(20, 184, 166, 0.12)",
  },
  sectionText: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#10233f",
  },
  sectionDescription: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 21,
    color: "#5f7087",
  },
  tipBox: {
    marginTop: 16,
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "rgba(127, 231, 208, 0.22)",
    borderWidth: 1,
    borderColor: "rgba(21, 160, 135, 0.22)",
  },
  tipIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.68)",
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#10233f",
  },
  tipDescription: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 21,
    color: "#43556a",
  },
  dashboardButton: {
    marginTop: 18,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#10233f",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  dashboardButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
});
