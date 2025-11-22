import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "../lib/types";
import { apiService } from "../services/api";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        checkAuthState();
    }, []);

    const checkAuthState = async () => {
        try {
            const token = await AsyncStorage.getItem('@authToken');
            const savedUser = await AsyncStorage.getItem('@user');

            if (token && savedUser) {
                setUser(JSON.parse(savedUser));
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        
        try {
            const response = await apiService.login(email, password);
            
            // ✅ CORREÇÃO: A API retorna { success, message, user, token } diretamente
            if (response.success && response.user && response.token) {
                const { user: userData, token } = response;
                
                await AsyncStorage.setItem('@authToken', token);
                await AsyncStorage.setItem('@user', JSON.stringify(userData));
                
                setUser(userData);
                
                router.push('/(tabs)/dashboard');
            } else {
                throw new Error(response.message || 'Login failed');
            }

        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name: string, email: string, password: string) => {
        setIsLoading(true);
        
        try {
            const response = await apiService.register(name, email, password);
            
            // ✅ CORREÇÃO: Mesma estrutura do login
            if (response.success && response.user && response.token) {
                const { user: userData, token } = response;

                await AsyncStorage.setItem('@authToken', token);
                await AsyncStorage.setItem('@user', JSON.stringify(userData));
                
                setUser(userData);
                
                router.push('/(tabs)/dashboard');
            } else {
                throw new Error(response.message || 'Registration failed');
            }

        } catch (error) {
            console.error("Registration failed:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await apiService.logout();
            
            await AsyncStorage.multiRemove(['@authToken', '@user']);
            
            setUser(null);
            
            router.replace('/login');

        } catch (error) {
            console.error("Logout error:", error);
            
            await AsyncStorage.multiRemove(['@authToken', '@user']);
            setUser(null);
            router.replace('/login');
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            login,
            register,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
    }

    return context;
}