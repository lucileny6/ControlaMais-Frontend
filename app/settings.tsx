import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Save,
  Settings,
  UserRound,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type StoredUser = {
  name?: string;
  nome?: string;
  nomeCompleto?: string;
  displayName?: string;
  username?: string;
  userName?: string;
  user_name?: string;
  email?: string;
};

const SETTINGS_GRADIENT = ["#F8FBFD", "#EEF4F7", "#E8F0F4", "#E2EBF1"] as const;

function formatNameFromEmail(email?: string) {
  const localPart = String(email ?? "").trim().split("@")[0] ?? "";
  if (!localPart) return "";

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveUserName(user: StoredUser | null) {
  if (!user) return "";

  const emailPrefix = user.email?.includes("@") ? user.email.split("@")[0].trim().toLowerCase() : "";
  const candidates = [
    user.displayName,
    user.nomeCompleto,
    user.nome,
    user.name,
    user.userName,
    user.user_name,
    user.username,
  ];

  for (const candidate of candidates) {
    const value = String(candidate ?? "").trim();
    if (!value) continue;
    if (emailPrefix && value.toLowerCase() === emailPrefix) continue;
    return value;
  }

  return formatNameFromEmail(user.email);
}

export default function SettingsPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompactScreen = width < 430;

  const [user, setUser] = useState<StoredUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const [storedUser, legacyStoredUser, storedDisplayName, legacyDisplayName] = await Promise.all([
          AsyncStorage.getItem("user"),
          AsyncStorage.getItem("@user"),
          AsyncStorage.getItem("displayName"),
          AsyncStorage.getItem("@displayName"),
        ]);

        const rawUser = storedUser || legacyStoredUser;
        const parsedUser = rawUser ? (JSON.parse(rawUser) as StoredUser) : null;
        const displayName = String(storedDisplayName || legacyDisplayName || "").trim();
        const mergedUser = {
          ...(parsedUser ?? {}),
          ...(displayName ? { displayName } : {}),
        };

        setUser(mergedUser);
        setName(resolveUserName(mergedUser));
        setEmail(String(mergedUser.email ?? "").trim());
      } catch {
        setUser(null);
        setName("");
        setEmail("");
      }
    };

    void loadUser();
  }, []);

  const passwordButtonDisabled = useMemo(
    () => !newPassword.trim() || !confirmPassword.trim(),
    [newPassword, confirmPassword],
  );

  const handleSaveProfile = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert("Erro", "Informe um nome para salvar.");
      return;
    }

    const nextUser = {
      ...(user ?? {}),
      name: trimmedName,
      displayName: trimmedName,
      email,
    };

    await AsyncStorage.multiSet([
      ["user", JSON.stringify(nextUser)],
      ["@user", JSON.stringify(nextUser)],
      ["displayName", trimmedName],
      ["@displayName", trimmedName],
    ]);

    setUser(nextUser);
    Alert.alert("Perfil atualizado", "Seu nome foi atualizado neste dispositivo.");
  };

  const handleChangePassword = () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Erro", "Preencha a nova senha e a confirmacao.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Erro", "As senhas informadas nao conferem.");
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    Alert.alert("Alterar senha", "Funcao visual por enquanto. Nenhuma chamada ao backend foi feita.");
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove([
      "authToken",
      "user",
      "displayName",
      "@authToken",
      "@user",
      "@displayName",
    ]);

    router.replace("/login");
  };

  return (
    <LinearGradient colors={SETTINGS_GRADIENT} locations={[0, 0.32, 0.66, 1]} style={styles.gradient}>
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
              <View style={styles.titleIcon}>
                <Settings size={22} color="#0f766e" strokeWidth={2.3} />
              </View>
              <View style={styles.titleText}>
                <Text style={styles.title}>Configuracoes</Text>
                <Text style={styles.subtitle}>Gerencie seu perfil e opcoes basicas da conta.</Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <UserRound size={20} color="#10233f" strokeWidth={2.2} />
                <Text style={styles.sectionTitle}>Perfil</Text>
              </View>

              <Text style={styles.label}>Nome do usuario</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Digite seu nome"
                placeholderTextColor="#8a9aab"
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, styles.readOnlyInput]}
                value={email || "Email nao informado"}
                editable={false}
                placeholderTextColor="#8a9aab"
              />

              <TouchableOpacity style={styles.primaryButton} onPress={handleSaveProfile} accessibilityRole="button">
                <Save size={18} color="#ffffff" strokeWidth={2.2} />
                <Text style={styles.primaryButtonText}>Salvar perfil</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Lock size={20} color="#10233f" strokeWidth={2.2} />
                <Text style={styles.sectionTitle}>Seguranca</Text>
              </View>

              <Text style={styles.label}>Nova senha</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Digite a nova senha"
                  placeholderTextColor="#8a9aab"
                />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword((value) => !value)}>
                  {showPassword ? (
                    <EyeOff size={18} color="#5f7087" strokeWidth={2.2} />
                  ) : (
                    <Eye size={18} color="#5f7087" strokeWidth={2.2} />
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Confirmar senha</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                placeholder="Confirme a nova senha"
                placeholderTextColor="#8a9aab"
              />

              <TouchableOpacity
                style={[styles.primaryButton, passwordButtonDisabled && styles.disabledButton]}
                onPress={handleChangePassword}
                disabled={passwordButtonDisabled}
                accessibilityRole="button"
              >
                <Lock size={18} color="#ffffff" strokeWidth={2.2} />
                <Text style={styles.primaryButtonText}>Alterar senha</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <LogOut size={20} color="#b84b5f" strokeWidth={2.2} />
                <Text style={styles.sectionTitle}>Conta</Text>
              </View>

              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} accessibilityRole="button">
                <LogOut size={18} color="#b84b5f" strokeWidth={2.2} />
                <Text style={styles.logoutButtonText}>Sair</Text>
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: 20,
    paddingVertical: 18,
    width: "100%",
    maxWidth: 820,
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
    borderRadius: 24,
    padding: 18,
    shadowColor: "#0f172a",
    shadowOpacity: 0.07,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 5,
    gap: 12,
  },
  contentCardCompact: {
    borderRadius: 22,
    padding: 14,
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.14)",
  },
  titleIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(20, 184, 166, 0.12)",
  },
  titleText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#10233f",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: "#5f7087",
  },
  section: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(197, 210, 223, 0.38)",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#10233f",
  },
  label: {
    marginBottom: 5,
    fontSize: 13,
    fontWeight: "700",
    color: "#43556a",
  },
  input: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(154, 176, 194, 0.42)",
    backgroundColor: "rgba(244, 249, 251, 0.98)",
    paddingHorizontal: 12,
    color: "#10233f",
    fontSize: 14,
    marginBottom: 10,
  },
  readOnlyInput: {
    color: "#6b7a8d",
    backgroundColor: "rgba(235, 241, 245, 0.92)",
  },
  passwordRow: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(154, 176, 194, 0.42)",
    backgroundColor: "rgba(244, 249, 251, 0.98)",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 12,
    color: "#10233f",
    fontSize: 14,
  },
  eyeButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: "#10233f",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  disabledButton: {
    backgroundColor: "#6f7f91",
    opacity: 0.72,
  },
  logoutButton: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(184, 75, 95, 0.28)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  logoutButtonText: {
    color: "#b84b5f",
    fontSize: 14,
    fontWeight: "800",
  },
});
