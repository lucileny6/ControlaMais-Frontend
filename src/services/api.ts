import type {
    ApiResponse,
    ChatMessage,
    CreateTransactionDTO,
    FinancialSummary,
    Goal,
    PaginatedResponse,
    Transaction,
    User,
} from "@/lib/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

export class ApiService {
  private baseUrl: string;
  private token?: string;

  constructor() {
    this.baseUrl = "http://localhost:8080/api/users";
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const token = await AsyncStorage.getItem("authToken");
    console.log("Token enviado para API:", token);

    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options?.headers || {}),
      },
    };

    try {
      console.log(`API Request: ${url}`, config);

      const response = await fetch(url, config);

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(
          errorBody?.message ?? `HTTP error! status: ${response.status}`,
        );
      }

      const data = (await response.json()) as T;
      console.log(`API Response: ${url}`, data);
      return data;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  async login(
    email: string,
    password: string,
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request(`/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request(`/register`, {
      method: "POST",
      body: JSON.stringify({ username: name, email, password }),
    });
  }

  async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(["authToken", "user"]);
      console.log("Logout realizado com sucesso");
    } catch (error) {
      console.error("Erro ao realizar o logout:", error);
      throw error;
    }
  }

  async getTransactions(): Promise<PaginatedResponse<Transaction>> {
    return this.request(`/transactions`);
  }

  async createTransection(dto: CreateTransactionDTO): Promise<Transaction> {
    return this.request("/transactions", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  }

  async updateTransaction(
    id: string,
    transactionData: Partial<Transaction>,
  ): Promise<Transaction> {
    return this.request(`/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(transactionData),
    });
  }

  async deleteTransaction(id: string): Promise<void> {
    return this.request(`/transactions/${id}`, {
      method: "DELETE",
    });
  }

  async getFinancialSummary(): Promise<FinancialSummary> {
    return this.request("/financial-summary");
  }

  async getGoals(): Promise<Goal[]> {
    return this.request("/goals");
  }

  async createdGoal(
    goalData: Omit<Goal, "id" | "createdAt" | "updatedAt">,
  ): Promise<Goal> {
    return this.request(`/goals`, {
      method: "POST",
      body: JSON.stringify(goalData),
    });
  }

  async updateGoal(id: string, goalData: Partial<Goal>): Promise<Goal> {
    return this.request(`/goals/${id}`, {
      method: "PUT",
      body: JSON.stringify(goalData),
    });
  }

  async deletegoal(id: string): Promise<void> {
    return this.request(`/goals/${id}`, {
      method: "DELETE",
    });
  }

  async sendChatMessage(message: string): Promise<ChatMessage> {
    return this.request("/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request(`/me`);
  }

  async updateUser(userData: Partial<User>): Promise<User> {
    return this.request(`/profile`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }
}

export const apiService = new ApiService();
