import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../src/services/api';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos');
            return;
        }

        setIsLoading(true);

        try {
            const loginResponse = await apiService.login(email, password);

            await AsyncStorage.multiSet([
                ['authToken', loginResponse.token]
            ]);

            Alert.alert('Sucesso!', loginResponse.message);
            router.replace('/(tabs)/dashboard');
        } catch (error) {
            Alert.alert('Erro', error as string);
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
                    <Card style={{width: 400}}>
                        <CardHeader>
                            <CardTitle style={styles.title}>Login</CardTitle>
                            <Text style={styles.subtitle}>Seja bem-vindo(a)</Text>
                        </CardHeader>
                    
                        <CardContent>
                            <View>
                                <Label>Email</Label>
                                <Input
                                    style={styles.input}
                                    placeholder="Digite seu email"
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
                                    {isLoading ? 'Entrando...' : 'Entrar'}
                                </Text>
                            </TouchableOpacity>
                            <View style={styles.loginContainer}>
                                <Link href="/register" asChild>
                                    <TouchableOpacity disabled={isLoading}>
                                        <Text style={[
                                            styles.loginLink,
                                            isLoading && styles.linkDisabled
                                        ]}>
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
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },

    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
        backgroundColor: '#f5f5f5',
    },

    content: {
        padding: 24,
        maxWidth: 400,
        width: "100%",
        alignSelf: "center",
    },

    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        color: '#111827',
    },

    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
        color: '#666',
    },

    input: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#666',
        fontSize: 16,
    },

    button: {
        backgroundColor: '#000',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },

    buttonDisabled: {
        backgroundColor: '#666',
    },

    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },

    loginContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 16,
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