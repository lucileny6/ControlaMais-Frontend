import type { ApiResponse, ChatMessage, FinancialSummary, Goal, PaginatedResponse, Transaction, User } from "@/lib/types";
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080/api/users";

export class ApiService {
    private async request<T>(endpoint: string, options?: RequestInit): Promise<T>{
        const url = `${API_BASE_URL}${endpoint}`;

        const token = await AsyncStorage.getItem('authToken');

        const config: RequestInit = {
            headers: {
                "Content-Type": "application/json",
                ...(token && {Authorization: `Bearer ${token}`}),
                ...options?.headers,
            },
            ...options,
        };

        try {
            console.log(`API Request: ${url}`, config);

            const response = await fetch(url, config);

            if(!response.ok){
                
                const errorBody = await response.json().catch(() => null);
                throw new Error(
                    errorBody?.message || `HTTP error! status: ${response.status}`
                );
            }

            const data = await response.json();
            console.log(`API Response: ${url}`, data);
            return data;

        } catch (error) {
            console.error("API request failed:", error);
            throw error;
        }
    }

    async login(email: string, password: string): Promise<ApiResponse<{user: User; token: string}>>{
        return this.request(`/login`, {
            method: "POST",
            body: JSON.stringify({email, password}),
        });
    }

    async register(
        name: string,
        email: string,
        password: string
    ): Promise<ApiResponse<{ user: User; token: string }>> {
        return this.request(`/register`, {
        method: "POST",
        body: JSON.stringify({ username: name, email, password }),
        });
    }

    async logout(): Promise<void> {
        
        try{
            await AsyncStorage.multiRemove(['authToken', 'user']);
            console.log('Logout realizado com sucesso')
        } catch (error) {
            console.error('Erro ao realizar o logout:', error);
            throw error;
        }

    }

    async getTransactions(): Promise<PaginatedResponse<Transaction>> {
        return this.request(`/transactions`);
    }

    async createTransection(transaction: Omit<Transaction, "id" | "createdAt" | "updateAt" >): Promise<ApiResponse<Transaction>> {
        return this.request('/transactions', {
            method: 'POST',
            body: JSON.stringify(transaction),
        });
    }

    async updateTransaction(id: string, transactionData: Partial<Transaction>): Promise<ApiResponse<Transaction>>{
        return this.request(`/transactions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(transactionData) 
        })
    }

    async deleteTransaction(id: string): Promise<ApiResponse<void>> {
        return this.request(`/transactions/${id}`, {
            method: 'DELETE',
        });
    }

    async getFinancialSummary(): Promise<ApiResponse<FinancialSummary>> {
        return this.request('/financial-summary')
    }

    async getGoals(): Promise<ApiResponse<Goal[]>> {
        return this.request('/goals')
    }

    async createdGoal(goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Goal>>{
        return this.request(`/goals`, {
            method: "POST",
            body: JSON.stringify(goalData),
        })
    }

    async updateGoal(id: string, goalData: Partial<Goal>): Promise<ApiResponse<Goal>>{
        return this.request(`/goals/${id}`, {
            method: 'PUT',
            body: JSON.stringify(goalData) 
        })
    }

    async deletegoal(id: string): Promise<ApiResponse<void>> {
        return this.request(`/goals/${id}`, {
            method: 'DELETE',
        });
    }

    async sendChatMessage(message: string): Promise<ApiResponse<ChatMessage>> {
        return this.request('/chat', {
            method: 'POST',
            body: JSON.stringify({ message }) 
        })
    }

    async getCurrentUser(): Promise<User>{
        return this.request(`/me`);
    }

    async updateUser(userData: Partial<User>): Promise<ApiResponse<User>>{
        return this.request(`/profile`, {
            method: "PUT",
            body: JSON.stringify(userData),
        });
    }
}

export const apiService = new ApiService();