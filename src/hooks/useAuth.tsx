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

const getAuthResponseToken = (response: any) =>
    String(
        response?.data?.token ??
        response?.data?.accessToken ??
        response?.data?.access_token ??
        response?.data?.tokenAcesso ??
        response?.data?.authorization ??
        response?.token ??
        response?.accessToken ??
        response?.access_token ??
        response?.tokenAcesso ??
        response?.authorization ??
        "",
    )
        .trim()
        .replace(/^Bearer\s+/i, "");

const getAuthResponseUser = (response: any) =>
    response?.data?.user ??
    response?.data?.usuario ??
    response?.user ??
    response?.usuario ??
    null;

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        checkAuthState();
    }, []);

    const checkAuthState = async () => {
        try {
            const [token, legacyToken, savedUser, legacySavedUser] = await Promise.all([
                AsyncStorage.getItem("@authToken"),
                AsyncStorage.getItem("authToken"),
                AsyncStorage.getItem("@user"),
                AsyncStorage.getItem("user"),
            ]);
            const authToken = token || legacyToken;
            const userFromStorage = savedUser || legacySavedUser;

            if (authToken && userFromStorage) {
                setUser(JSON.parse(userFromStorage));
            }
        } catch (error) {
            console.error("Error checking auth state:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        setIsLoading(true);

        try {
            await apiService.clearAuthSession();
            const response = await apiService.login(email, password);

            const token = getAuthResponseToken(response);
            const userData = getAuthResponseUser(response);

            if (token) {
                const resolvedUser = userData ?? ({ email } as User);
                const serializedUser = JSON.stringify(resolvedUser);

                await AsyncStorage.multiSet([
                    ["@authToken", token],
                    ["authToken", token],
                    ["@user", serializedUser],
                    ["user", serializedUser],
                ]);

                setUser(resolvedUser);
                router.replace("/(tabs)/dashboard");
            } else {
                throw new Error(response.message || "Login failed");
            }
        } catch (error) {
            await apiService.clearAuthSession();
            setUser(null);
            console.error("Login failed:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name: string, email: string, password: string) => {
        setIsLoading(true);

        try {
            await apiService.clearAuthSession();
            await apiService.register(name, email, password);
            await apiService.clearAuthSession();
            setUser(null);
        } catch (error) {
            await apiService.clearAuthSession();
            setUser(null);
            console.error("Registration failed:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await apiService.logout();
            setUser(null);
            router.replace("/login");
        } catch (error) {
            console.error("Logout error:", error);
            await apiService.clearAuthSession();
            setUser(null);
            router.replace("/login");
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
