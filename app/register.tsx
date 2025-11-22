import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiService } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
      // ✅ Mantém a lógica original do back-end
      const res = await apiService.register(name, email, password);

      // ✅ Salvar token e info do usuário no AsyncStorage
      if (res.token) {
        await AsyncStorage.setItem("authToken", res.token);
      }
      if (res.user) {
        await AsyncStorage.setItem("user", JSON.stringify(res.user));
      }

      // ✅ Mantém o redirecionamento original
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Controla+</Text>
          </View>

          <Card style={{width: 400}}>
            <CardHeader>
              <CardTitle>Criar Conta</CardTitle>
              <CardDescription>
                Preencha os dados para criar sua conta
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <View style={styles.inputContainer}>
                <Label>Nome</Label>
                <Input
                  placeholder="Seu nome completo"
                  placeholderTextColor="#9ca3af"
                  value={name}
                  onChangeText={setName}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Label>Email</Label>
                <Input
                  placeholder="seu@email.com"
                  placeholderTextColor="#9ca3af"
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
                  placeholder="Sua senha"
                  placeholderTextColor="#9ca3af"
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

              <Button
                variant="primary"
                size="large"
                onPress={handleSubmit}
                loading={isLoading}
                disabled={!name || !email || !password || isLoading}
              >
                {isLoading ? "Criando conta..." : "Criar Conta"}
              </Button>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>
                  Já tem conta?{" "}
                </Text>
                <Link href="/login" asChild>
                  <TouchableOpacity disabled={isLoading}>
                    <Text style={[
                      styles.loginLink,
                      isLoading && styles.linkDisabled
                    ]}>
                      Entrar
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    padding: 24,
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
    marginBottom: 16,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    textAlign: "center",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  loginText: {
    color: "#6b7280",
    fontSize: 14,
  },
  loginLink: {
    color: "#3b82f6",
    fontSize: 14,
    fontWeight: "600",
  },
  linkDisabled: {
    color: "#9ca3af",
    opacity: 0.6,
  },
});
