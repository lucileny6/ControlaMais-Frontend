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
  data: string; // yyyy-MM-dd
  categoria: string;
  descricao: string;
  observacao?: string;
}

// ===== DESPESA =====

export interface CreateDespesaDTO {
  valor: number;
  data: string; // yyyy-MM-dd
  categoria: string;
  descricao: string;
  observacao?: string;
}

// ===== DASHBOARD =====

export interface DashboardDTO {
  saldo: number;
  totalReceitas: number;
  totalDespesas: number;
  transacoesRecentes: string[];
  acoesRapidas: string[];
}


export interface TransacaoRecenteDTO {
  id: number;
  tipo: "RECEITA" | "DESPESA";
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
}

/* =====================================================
   API SERVICE
===================================================== */

export class ApiService {
  private baseUrl: string;

  constructor() {
    // 🔹 BASE GLOBAL DO BACKEND
    this.baseUrl = "http://192.168.1.116:8080/api";

  }

  // ===== MÉTODO BASE =====
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = await AsyncStorage.getItem("authToken");

    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers || {}),
      },
    };

    try {
      console.log("API Request:", url, config);

      const response = await fetch(url, config);

      if (!response.ok) {
        const errorBody: any = await response.json().catch(() => null);
        throw new Error(
          errorBody?.message || `Erro HTTP ${response.status}`,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      console.error("Erro na API:", error);
      throw error;
    }
  }

  /* =====================================================
     AUTH / USER
  ===================================================== */

  async login(
    email: string,
    password: string,
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request("/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request("/users/register", {
      method: "POST",
      body: JSON.stringify({
        username: name,
        email,
        password,
      }),
    });
  }

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove(["authToken", "user"]);
  }

  async getCurrentUser(): Promise<User> {
    return this.request("/me");
  }

  async updateUser(userData: Partial<User>): Promise<User> {
    return this.request("/profile", {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  /* =====================================================
     RECEITA
  ===================================================== */

  async createReceita(dto: CreateReceitaDTO) {
    return this.request("/receitas", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  }

  /* =====================================================
     DESPESA
  ===================================================== */

  async createDespesa(dto: CreateDespesaDTO) {
    return this.request("/despesas", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  }

  /* =====================================================
     DASHBOARD
  ===================================================== */

  async getDashboard(): Promise<DashboardDTO> {
  return this.request("/dashboard");
}

}
/* =====================================================
   INSTÂNCIA ÚNICA
===================================================== */

export const apiService = new ApiService();
