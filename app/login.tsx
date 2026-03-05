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
import { BrandColors } from "../constants/theme";
import { apiService } from "../src/services/api";

type LoginResponse = {
  token: string;
  message: string;
  user?: unknown;
  data?: {
    token?: string;
    message?: string;
    user?: unknown;
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

const resolveDisplayNameFromLogin = (user: unknown, email: string) => {
  if (!user || typeof user !== "object") return "";
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

  return "";
};

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
      await AsyncStorage.multiRemove([
        "authToken",
        "user",
        "displayName",
        "@authToken",
        "@user",
        "@displayName",
      ]);

      const response = (await apiService.login(email, password)) as LoginResponse;
      const responseData = response.data ?? response;
      const token = responseData.token;

      if (!token) {
        throw new Error("Token de autenticacao nao retornado pelo backend");
      }

      const resolvedName = resolveDisplayNameFromLogin(responseData.user, email);

      await AsyncStorage.multiSet([
        ["authToken", token],
        ["@authToken", token],
      ]);
      if (resolvedName) {
        await AsyncStorage.multiSet([
          ["displayName", resolvedName],
          ["@displayName", resolvedName],
        ]);
      }

      Alert.alert("Sucesso!", responseData.message ?? response.message ?? "Login realizado com sucesso");
      router.replace("/(tabs)/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert("Erro", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#020305", "#03100E", "#052A24", "#11B99C", "#29E9CF"]}
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
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  card: {
    width: 400,
    maxWidth: "100%",
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(56, 255, 226, 0.35)",
    borderWidth: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#000000",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    color: "#021416",
  },
  input: {
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(56, 255, 226, 0.3)",
    color: "#F8FAFC",
    fontSize: 16,
  },
  button: {
    backgroundColor: BrandColors.primaryButton,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#4B5563",
  },
  buttonText: {
    color: "#ECFEFF",
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
    color: "#000506",
    fontSize: 14,
    fontWeight: "600",
  },
  linkDisabled: {
    color: "#010712",
    opacity: 0.6,
  },
});
