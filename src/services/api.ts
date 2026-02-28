import AsyncStorage from "@react-native-async-storage/async-storage";
import { AIResponse } from "@/lib/types";


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

export interface UpdateTransactionDTO {
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
  observacao?: string;
  type?: "income" | "expense";
  tipo?: "income" | "expense" | "receita" | "despesa";
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
   API SERVICE (INFRA HTTP)
===================================================== */

export class ApiService {
  private baseUrl = "http://localhost:8080/api";

  /* ======================
     MÉTODO BASE (PRIVADO)
  ====================== */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const [plainToken, scopedToken] = await Promise.all([
      AsyncStorage.getItem("authToken"),
      AsyncStorage.getItem("@authToken"),
    ]);
    const authToken = plainToken || scopedToken;
    const method = options.method ?? "GET";
    console.log(`[API] ${method} ${endpoint} auth token present:`, Boolean(authToken));

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          ...(options.headers || {}),
        },
      });
    } catch (error: any) {
      console.log(`[API] ${method} ${endpoint} network error:`, error);
      throw new Error(`Falha de conexao em ${method} ${endpoint}`);
    }

    console.log(`[API] ${method} ${endpoint} status:`, response.status);

    if (!response.ok) {
      const error: any = await response.json().catch(() => null);
      console.log(`[API] ${method} ${endpoint} error body:`, error);
      throw new Error(error?.message || `Erro ${response.status} em ${method} ${endpoint}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const rawBody = await response.text();
    if (!rawBody) {
      return undefined as T;
    }

    try {
      return JSON.parse(rawBody) as T;
    } catch {
      return rawBody as T;
    }
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
    await AsyncStorage.multiRemove(["authToken", "user", "@authToken", "@user"]);
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

  async updateTransaction(
    id: string,
    dto: UpdateTransactionDTO,
    transactionType?: "income" | "expense"
  ) {
    const isIncome =
      transactionType === "income" ||
      dto.type === "income" ||
      dto.tipo === "income" ||
      dto.tipo === "receita";
    const preferredTypePath = isIncome ? "/receitas" : "/despesas";
    const endpoints = [`${preferredTypePath}/${id}`];

    let lastError: Error | null = null;
    for (const endpoint of endpoints) {
      try {
        return await this.request(endpoint, {
          method: "PUT",
          body: JSON.stringify(dto),
        });
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    throw lastError ?? new Error("Nao foi possivel atualizar a transacao");
  }

  async deleteTransaction(id: string, transactionType?: "income" | "expense") {
    const endpoints =
      transactionType === "income"
        ? [`/receitas/${id}`]
        : transactionType === "expense"
          ? [`/despesas/${id}`]
          : [`/receitas/${id}`, `/despesas/${id}`];

    let lastError: Error | null = null;
    for (const endpoint of endpoints) {
      try {
        return await this.request(endpoint, {
          method: "DELETE",
        });
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    throw lastError ?? new Error("Nao foi possivel excluir a transacao");
  }

  /* ======================
     DASHBOARD
  ====================== */

  async getDashboard(): Promise<DashboardDTO> {
    const response = await this.request<any>("/dashboard");
    console.log("[API] GET /dashboard raw:", response);

    const payload = response?.data ?? response ?? {};
    const parseMonetaryValue = (value: unknown): number => {
      if (typeof value === "number") return Number.isFinite(value) ? value : 0;
      if (typeof value !== "string") return 0;

      const raw = value.trim();
      if (!raw) return 0;

      const cleaned = raw.replace(/[^\d,.-]/g, "");
      const hasComma = cleaned.includes(",");
      const hasDot = cleaned.includes(".");

      if (hasComma && hasDot) {
        const lastComma = cleaned.lastIndexOf(",");
        const lastDot = cleaned.lastIndexOf(".");
        const normalized =
          lastComma > lastDot
            ? cleaned.replace(/\./g, "").replace(",", ".")
            : cleaned.replace(/,/g, "");
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
      }

      if (hasComma) {
        const parsed = Number(cleaned.replace(/\./g, "").replace(",", "."));
        return Number.isFinite(parsed) ? parsed : 0;
      }

      const parsed = Number(cleaned);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    return {
      saldo: parseMonetaryValue(payload.saldoTotal ?? payload.saldo ?? payload.balance ?? 0),
      totalReceitas: parseMonetaryValue(payload.totalReceitas ?? payload.receitas ?? payload.totalIncome ?? 0),
      totalDespesas: parseMonetaryValue(payload.totalDespesas ?? payload.despesas ?? payload.totalExpense ?? 0),
      transacoesRecentes:
        payload.transacoesRecentes ?? payload.transacoes ?? payload.transactions ?? [],
      acoesRapidas: payload.acoesRapidas ?? payload.quickActions ?? [],
    };
  }

  /* ======================
     CHAT IA ✅ (AQUI ESTAVA FALTANDO)
  ====================== */
  async getTransactions(): Promise<any[]> {
    const extractList = (response: any) => {
      const payload = response?.data ?? response;
      if (Array.isArray(payload)) return payload;
      return payload?.transacoes ?? payload?.transactions ?? payload?.content ?? payload?.items ?? [];
    };

    try {
      const response = await this.request<any>("/transacoes");
      console.log("[API] GET /transacoes raw:", response);
      return extractList(response);
    } catch (error) {
      console.log("[API] GET /transacoes failed, trying /transaction:", error);
      const response = await this.request<any>("/transaction");
      console.log("[API] GET /transaction raw:", response);
      return extractList(response);
    }
  }
  async sendChatIA(message: string): Promise<AIResponse> {
  return this.request<AIResponse>("/chat-ia", {
    method: "POST",
    body: JSON.stringify({
      mensagem: message,
      }),
    });
  }
}

/* =====================================================
   INSTÂNCIA ÚNICA
===================================================== */

export const apiService = new ApiService();

