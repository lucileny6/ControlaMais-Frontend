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
import { BrandColors } from "../constants/theme";

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
      colors={["#020305", "#03100E", "#052A24", "#11B99C", "#29E9CF"]}
      locations={[0, 0.3, 0.57, 0.82, 1]}
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
  cardTitle: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#000000",
  },
  cardSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 12,
    color: "#021416",
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(56, 255, 226, 0.3)",
    color: "#F8FAFC",
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 8,
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
    backgroundColor: BrandColors.primaryButton,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.65,
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
  loginText: {
    color: "#111827",
    fontSize: 14,
  },
  loginLink: {
    color: "#000506",
    fontSize: 14,
    fontWeight: "600",
  },
  linkDisabled: {
    color: "#9CA3AF",
    opacity: 0.6,
  },
});
