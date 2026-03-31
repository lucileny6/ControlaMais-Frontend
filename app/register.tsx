import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiService } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RegisterResponse = {
  token?: string;
  user?: unknown;
};

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    setError("");
    setIsLoading(true);

    if (!name || !email || !password) {
      setError("Por favor, preencha todos os campos");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      setIsLoading(false);
      return;
    }

    try {
      const res = (await apiService.register(name, email, password)) as RegisterResponse;
      await AsyncStorage.multiSet([
        ["displayName", name.trim()],
        ["@displayName", name.trim()],
      ]);

      if (res.token) {
        await AsyncStorage.multiSet([
          ["authToken", res.token],
          ["@authToken", res.token],
        ]);
      }
      if (res.user) {
        const serializedUser = JSON.stringify(res.user);
        await AsyncStorage.multiSet([
          ["user", serializedUser],
          ["@user", serializedUser],
        ]);
      }

      router.replace("/(tabs)/dashboard");
    } catch (err: any) {
      console.log("Erro no cadastro:", err);
      setError(err.message || "Falha no cadastro");
      Alert.alert("Erro", err.message || "Falha no cadastro");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#0B1624", "#12354A", "#178A86", "#7FE7D0"]}
      locations={[0, 0.3, 0.57, 0.82]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle style={styles.cardTitle}>Criar Conta</CardTitle>
                <CardDescription style={styles.cardSubtitle}>
                  Seu controle financeiro comeca aqui.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <View style={styles.inputContainer}>
                  <Label>Nome</Label>
                  <Input
                    style={styles.input}
                    placeholder="Seu nome completo"
                    placeholderTextColor="#9CA3AF"
                    value={name}
                    onChangeText={setName}
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Label>Email</Label>
                  <Input
                    style={styles.input}
                    placeholder="seu@email.com"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Label>Senha</Label>
                  <Input
                    style={styles.input}
                    placeholder="Sua senha"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>

                {error ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.button, (isLoading || !name || !email || !password) && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={!name || !email || !password || isLoading}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? "Criando conta..." : "Criar Conta"}
                  </Text>
                </TouchableOpacity>

                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>Ja tem conta? </Text>
                  <Link href="/login" asChild>
                    <TouchableOpacity disabled={isLoading}>
                      <Text style={[styles.loginLink, isLoading && styles.linkDisabled]}>Entrar</Text>
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
    flexGrow: 1,
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
  cardTitle: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#10233F",
  },
  cardSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    color: "#4D6176",
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: "rgba(244, 249, 251, 0.98)",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(154, 176, 194, 0.42)",
    color: "#10233F",
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: "rgba(254, 242, 242, 0.95)",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 16,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
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
  loginText: {
    color: "#4D6176",
    fontSize: 14,
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
