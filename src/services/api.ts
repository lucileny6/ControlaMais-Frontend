import AsyncStorage from "@react-native-async-storage/async-storage";

/* =====================================================
   DTOs DO FRONT (espelho do BACKEND)
===================================================== */

// ===== AUTH / USER =====

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
}

// ===== RECEITA =====

export interface CreateReceitaDTO {
  valor: number;
  data: string;
  categoria: string;
  descricao: string;
  observacao?: string;
}

// ===== DESPESA =====

export interface CreateDespesaDTO {
  valor: number;
  data: string;
  categoria: string;
  descricao: string;
  observacao?: string;
}

// ===== DASHBOARD =====

export interface DashboardDTO {
  saldo: number;
  totalReceitas: number;
  totalDespesas: number;
  transacoesRecentes: any[];
  acoesRapidas: string[];
}

/* =====================================================
   API SERVICE
===================================================== */

export class ApiService {
  private baseUrl = "http://192.168.1.116:8080/api";

  /* ======================
     MÉTODO BASE
  ====================== */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = await AsyncStorage.getItem("authToken");
console.log("TOKEN LIDO DO STORAGE:", token);

const response = await fetch(`${this.baseUrl}${endpoint}`, {
  ...options,
  headers: {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers || {}),
  },
});

    if (!response.ok) {
      const error:any = await response.json().catch(() => null);
      throw new Error(error?.message || "Erro na API");
    }

  return (await response.json()) as T;

  }

  /* ======================
     AUTH
  ====================== */

  async login(email: string, password: string) {
    return this.request("/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name: string, email: string, password: string) {
    return this.request("/users/register", {
      method: "POST",
      body: JSON.stringify({ username: name, email, password }),
    });
  }

  async logout() {
    await AsyncStorage.multiRemove(["authToken", "user"]);
  }

  /* ======================
     RECEITA / DESPESA
  ====================== */

  async createReceita(dto: CreateReceitaDTO) {
    return this.request("/receitas", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  }

  async createDespesa(dto: CreateDespesaDTO) {
    return this.request("/despesas", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  }

  /* ======================
     TRANSAÇÕES (CRUD)
  ====================== */

  async getTransactions() {
    return this.request<any[]>("/transactions");
  }

  async createTransaction(dto: any) {
    return this.request("/transactions", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  }

  async updateTransaction(id: string, dto: any) {
    return this.request(`/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(dto),
    });
  }

  async deleteTransaction(id: string) {
    return this.request(`/transactions/${id}`, {
      method: "DELETE",
    });
  }

  /* ======================
     DASHBOARD
  ====================== */

  async getDashboard(): Promise<DashboardDTO> {
  const response = await this.request<any>("/dashboard");

  console.log("DASHBOARD RAW DO BACKEND:", response);

  return {
    saldo: response.saldoTotal ??  0,
    totalReceitas: response.totalReceitas ?? 0,
    totalDespesas: response.totalDespesas ?? 0,
    transacoesRecentes: response.transacoesRecentes ?? [],
    acoesRapidas: response.acoesRapidas ?? [],
  };
}

}

/* =====================================================
   INSTÂNCIA ÚNICA
===================================================== */

export const apiService = new ApiService();
