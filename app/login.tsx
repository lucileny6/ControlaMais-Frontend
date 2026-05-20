import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiService } from "../src/services/api";

type LoginResponse = {
  token?: string;
  accessToken?: string;
  access_token?: string;
  tokenAcesso?: string;
  authorization?: string;
  jwt?: string;
  message?: string;
  user?: unknown;
  usuario?: unknown;
  data?: {
    token?: string;
    accessToken?: string;
    access_token?: string;
    tokenAcesso?: string;
    authorization?: string;
    jwt?: string;
    message?: string;
    user?: unknown;
    usuario?: unknown;
  };
};

type LoginUser = {
  name?: string;
  nome?: string;
  nomeCompleto?: string;
  displayName?: string;
  fullName?: string;
  firstName?: string;
  given_name?: string;
  username?: string;
  userName?: string;
  user_name?: string;
};

const formatNameFromEmail = (email: string) => {
  const localPart = String(email ?? "").trim().split("@")[0] ?? "";
  if (!localPart) return "";

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const resolveDisplayNameFromLogin = (user: unknown, email: string) => {
  if (!user || typeof user !== "object") return formatNameFromEmail(email);
  const u = user as LoginUser;

  const preferredName = [
    u.name,
    u.nome,
    u.nomeCompleto,
    u.displayName,
    u.fullName,
    u.firstName,
    u.given_name,
  ]
    .map((value) => String(value ?? "").trim())
    .find(Boolean);

  if (preferredName) return preferredName;

  const usernameCandidate = String(u.username ?? u.userName ?? u.user_name ?? "").trim();
  const emailPrefix = email.includes("@") ? email.split("@")[0].trim().toLowerCase() : "";
  if (usernameCandidate && usernameCandidate.toLowerCase() !== emailPrefix) {
    return usernameCandidate;
  }

  return formatNameFromEmail(email);
};

const resolveLoginErrorMessage = (message: string) => {
  const normalizedMessage = message.toLowerCase();
  const isPendingApproval =
    normalizedMessage.includes("aprov") ||
    normalizedMessage.includes("pendente") ||
    normalizedMessage.includes("bloque");

  if (isPendingApproval) {
    return "Usuário ainda não aprovado. Aguarde aprovação do administrador.";
  }

  if (normalizedMessage.includes("401") || normalizedMessage.includes("sessao") || normalizedMessage.includes("sem permissao")) {
    return "Usuário não aprovado ou credenciais inválidas";
  }

  return message || "Não foi possível realizar login.";
};

const PENDING_REGISTRATION_EMAIL_KEY = "pendingRegistrationEmail";

const getPendingRegistrationEmail = async () => {
  const storedEmail = await AsyncStorage.getItem(PENDING_REGISTRATION_EMAIL_KEY);
  return String(storedEmail ?? "").trim().toLowerCase();
};

const clearPendingRegistrationEmail = async () => {
  await AsyncStorage.removeItem(PENDING_REGISTRATION_EMAIL_KEY);
};

const saveAuthSession = async (token: string, user: Record<string, unknown>) => {
  await AsyncStorage.multiSet([
    ["authToken", token],
    ["@authToken", token],
    ["user", JSON.stringify(user)],
    ["@user", JSON.stringify(user)],
  ]);
};

const saveDisplayName = async (displayName: string) => {
  await AsyncStorage.multiSet([
    ["displayName", displayName],
    ["@displayName", displayName],
  ]);
};

const getLoginToken = (response: LoginResponse) =>
  normalizeLoginToken(
    response.data?.token ??
      response.data?.accessToken ??
      response.data?.access_token ??
      response.data?.tokenAcesso ??
      response.data?.authorization ??
      response.data?.jwt ??
      response.token ??
      response.accessToken ??
      response.access_token ??
      response.tokenAcesso ??
      response.authorization ??
      response.jwt ??
      "",
  );

const normalizeLoginToken = (token: string) =>
  String(token ?? "")
    .trim()
    .replace(/^Bearer\s+/i, "");

const getLoginUser = (response: LoginResponse) =>
  response.data?.user ??
  response.data?.usuario ??
  response.user ??
  response.usuario;

const getLoginMessage = (response: LoginResponse) =>
  response.data?.message ?? response.message;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    setIsLoading(true);

    try {
      await apiService.clearAuthSession();

      const response = (await apiService.login(email, password)) as LoginResponse;
      const token = getLoginToken(response);
      const responseUser = getLoginUser(response);

      if (!token) {
        throw new Error("Token de autenticação não retornado pelo backend");
      }

      const resolvedName = resolveDisplayNameFromLogin(responseUser, email);
      const userToPersist =
        responseUser && typeof responseUser === "object"
          ? {
              ...(responseUser as Record<string, unknown>),
              ...(resolvedName ? { displayName: resolvedName } : {}),
              email,
            }
          : {
              email,
              ...(resolvedName ? { displayName: resolvedName } : {}),
            };

      await saveAuthSession(token, userToPersist);
      if (resolvedName) {
        await saveDisplayName(resolvedName);
      }

      await clearPendingRegistrationEmail();
      Alert.alert("Sucesso!", getLoginMessage(response) ?? "Login realizado com sucesso");
      router.replace("/(tabs)/dashboard");
    } catch (error) {
      await apiService.clearAuthSession();
      const rawMessage = error instanceof Error ? error.message : String(error);
      const pendingRegistrationEmail = await getPendingRegistrationEmail();
      const normalizedEmail = email.trim().toLowerCase();
      const message =
        pendingRegistrationEmail && pendingRegistrationEmail === normalizedEmail
          ? "Cadastro realizado. Aguarde aprovação do administrador"
          : resolveLoginErrorMessage(rawMessage);
      Alert.alert("Erro", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#0B1624", "#12354A", "#178A86", "#7FE7D0"]}
      locations={[0, 0.3, 0.57, 0.82, 1]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle style={styles.title}>Login</CardTitle>
                <Text style={styles.subtitle}>Seu controle Financeiro começa aqui.</Text>
              </CardHeader>

              <CardContent>
                <View>
                  <Label>Email</Label>
                  <Input
                    style={styles.input}
                    placeholder="Digite seu email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>

                <View>
                  <Label>Senha</Label>
                  <Input
                    style={styles.input}
                    placeholder="Digite sua senha"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="password"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? "Entrando..." : "Acesse a sua conta"}
                  </Text>
                </TouchableOpacity>

                <View style={styles.loginContainer}>
                  <Link href="/register" asChild>
                    <TouchableOpacity disabled={isLoading}>
                      <Text
                        style={[
                          styles.loginLink,
                          isLoading && styles.linkDisabled,
                        ]}
                      >
                        Novo por aqui? Crie sua conta agora.
                      </Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </CardContent>
            </Card>
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
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "transparent",
  },
  content: {
    padding: 24,
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
  },
  card: {
    width: 400,
    maxWidth: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderColor: "rgba(214, 252, 244, 0.4)",
    borderWidth: 1,
    borderRadius: 24,
    shadowColor: "#0B1624",
    shadowOpacity: 0.14,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#10233F",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    color: "#4D6176",
  },
  input: {
    backgroundColor: "rgba(244, 249, 251, 0.98)",
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(154, 176, 194, 0.42)",
    color: "#10233F",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#10233F",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#5C6B7D",
  },
  buttonText: {
    color: "#F4FFFC",
    fontSize: 16,
    fontWeight: "700",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  loginLink: {
    color: "#10233F",
    fontSize: 14,
    fontWeight: "600",
  },
  linkDisabled: {
    color: "#43556A",
    opacity: 0.6,
  },
});
