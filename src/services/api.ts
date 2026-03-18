import AsyncStorage from "@react-native-async-storage/async-storage";
import { AIResponse, LoginResponse, User as AuthUser } from "@/lib/types";


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

export interface AuthResponse extends Omit<LoginResponse, "user"> {
  user?: AuthUser;
}

// ===== RECEITA =====

export interface CreateReceitaDTO {
  valor: number;
  data: string;
  categoria: string;
  descricao: string;
  observacao?: string;
  recorrente?: boolean;
  recurring?: boolean;
}

// ===== DESPESA =====

export interface CreateDespesaDTO {
  valor: number;
  data: string;
  categoria: string;
  descricao: string;
  observacao?: string;
  recorrente?: boolean;
  recurring?: boolean;
}

export interface UpdateTransactionDTO {
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
  observacao?: string;
  recorrente?: boolean;
  recurring?: boolean;
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

export interface CategoryBudgetDTO {
  category: string;
  amount: number;
}

export interface GoalDTO {
  id?: string | number;
  _id?: string | number;
  nome?: string;
  titulo?: string;
  title?: string;
  descricao?: string;
  description?: string;
  valorMeta?: number | string;
  targetAmount?: number | string;
  valorAtual?: number | string;
  currentAmount?: number | string;
  prazo?: string;
  deadline?: string;
  categoria?: string;
  category?: string;
}

export interface CreateMetaDTO {
  nome: string;
  valorMeta: number;
  descricao?: string;
  prazo?: string;
}

export interface UpdateMetaDTO {
  nome: string;
  valorMeta: number;
  descricao?: string;
  prazo?: string;
}

/* =====================================================
   API SERVICE (INFRA HTTP)
===================================================== */

export class ApiService {
  private baseUrl = "http://localhost:8080/api";

  private typeSafeRequestOptions(options: RequestInit & { preserveSessionOnAuthError?: boolean }) {
    const { preserveSessionOnAuthError, ...requestOptions } = options;
    return { preserveSessionOnAuthError: Boolean(preserveSessionOnAuthError), requestOptions };
  }

  /* ======================
     MÉTODO BASE (PRIVADO)
  ====================== */
  private async request<T>(
    endpoint: string,
    options: (RequestInit & { preserveSessionOnAuthError?: boolean }) = {}
  ): Promise<T> {
    const { preserveSessionOnAuthError, requestOptions } = this.typeSafeRequestOptions(options);
    const [plainToken, scopedToken] = await Promise.all([
      AsyncStorage.getItem("authToken"),
      AsyncStorage.getItem("@authToken"),
    ]);
    const authToken = plainToken || scopedToken;
    const method = requestOptions.method ?? "GET";
    console.log(`[API] ${method} ${endpoint} auth token present:`, Boolean(authToken));

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...requestOptions,
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          ...(requestOptions.headers || {}),
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

      if (response.status === 401 || response.status === 403) {
        if (preserveSessionOnAuthError) {
          throw new Error(error?.message || `Erro ${response.status} em ${method} ${endpoint}`);
        }

        await AsyncStorage.multiRemove([
          "authToken",
          "user",
          "displayName",
          "@authToken",
          "@user",
          "@displayName",
        ]);

        const webEnv = globalThis as { location?: { pathname?: string; assign?: (url: string) => void } };
        if (webEnv.location && webEnv.location.pathname !== "/login") {
          webEnv.location.assign?.("/login");
        }

        throw new Error(error?.message || "Sessao expirada ou sem permissao. Faça login novamente.");
      }

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

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/users/register", {
      method: "POST",
      body: JSON.stringify({ username: name, email, password }),
    });
  }

  async logout() {
    await AsyncStorage.multiRemove([
      "authToken",
      "user",
      "displayName",
      "@authToken",
      "@user",
      "@displayName",
    ]);
  }

  /* ======================
     RECEITA / DESPESA
  ====================== */

  async createReceita(dto: CreateReceitaDTO) {
    console.log("[API] createReceita payload:", dto);
    return this.request("/receitas", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  }

  async createDespesa(dto: CreateDespesaDTO) {
    console.log("[API] createDespesa payload:", dto);
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
        console.log("[API] updateTransaction payload:", { endpoint, dto, transactionType });
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

      const directCandidates = [
        payload?.transacoes,
        payload?.transactions,
        payload?.content,
        payload?.items,
      ];
      for (const candidate of directCandidates) {
        if (Array.isArray(candidate)) return candidate;
      }

      // Some backends split transactions by type.
      const groupedCandidates = [
        payload?.receitas,
        payload?.despesas,
        payload?.incomes,
        payload?.expenses,
      ];
      const mergedGrouped = groupedCandidates.flatMap((group) =>
        Array.isArray(group) ? group : [],
      );
      if (mergedGrouped.length > 0) return mergedGrouped;

      return [];
    };

    try {
      const response = await this.request<any>("/transacoes");
      console.log("[API] GET /transacoes raw:", response);
      const extracted = extractList(response);
      console.log("[API] GET /transacoes extracted recurring fields:", extracted.map((item: any) => ({
        id: item?.id ?? item?._id ?? item?.transactionId,
        descricao: item?.descricao ?? item?.description,
        recorrente: item?.recorrente,
        recurring: item?.recurring,
        isRecurring: item?.isRecurring,
        recorrencia: item?.recorrencia,
      })));
      return extracted;
    } catch (error) {
      const message = String((error as any)?.message ?? "");
      if (message.includes("403") || message.includes("401") || message.toLowerCase().includes("sessao")) {
        throw error;
      }
      console.log("[API] GET /transacoes failed, trying /transaction:", error);
      const response = await this.request<any>("/transaction");
      console.log("[API] GET /transaction raw:", response);
      const extracted = extractList(response);
      console.log("[API] GET /transaction extracted recurring fields:", extracted.map((item: any) => ({
        id: item?.id ?? item?._id ?? item?.transactionId,
        descricao: item?.descricao ?? item?.description,
        recorrente: item?.recorrente,
        recurring: item?.recurring,
        isRecurring: item?.isRecurring,
        recorrencia: item?.recorrencia,
      })));
      return extracted;
    }
  }

  async getCategoryBudgets(): Promise<CategoryBudgetDTO[]> {
    const extractList = (response: any): CategoryBudgetDTO[] => {
      const payload = response?.data ?? response;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.orcamentos)
          ? payload.orcamentos
          : Array.isArray(payload?.budgets)
            ? payload.budgets
            : Array.isArray(payload?.items)
              ? payload.items
              : [];

      return list
        .map((item: any) => ({
          category: String(item?.category ?? item?.categoria ?? item?.nomeCategoria ?? "").trim(),
          amount: Number(item?.amount ?? item?.valor ?? item?.budget ?? 0),
        }))
        .filter((item: CategoryBudgetDTO) => item.category.length > 0 && Number.isFinite(item.amount));
    };

    const endpoints = ["/orcamentos", "/budgets", "/orcamentos/categorias"];
    let lastError: Error | null = null;

    for (const endpoint of endpoints) {
      try {
        const response = await this.request<any>(endpoint);
        return extractList(response);
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    if (lastError) {
      console.log("[API] Nenhum endpoint de orcamento disponivel:", lastError.message);
    }
    return [];
  }

  async getMetas(): Promise<GoalDTO[]> {
    const response = await this.request<any>("/metas", { preserveSessionOnAuthError: true });
    console.log("[API] GET /metas raw:", response);

    const isLikelyGoal = (value: unknown) => {
      if (!value || typeof value !== "object") return false;
      const item = value as Record<string, unknown>;

      const hasGoalName =
        typeof item.nome === "string" ||
        typeof item.titulo === "string" ||
        typeof item.title === "string";

      const hasGoalAmount =
        item.valorMeta !== undefined ||
        item.targetAmount !== undefined ||
        item.valorAtual !== undefined ||
        item.currentAmount !== undefined;

      const hasGoalDate =
        typeof item.prazo === "string" ||
        typeof item.deadline === "string";

      return hasGoalName || hasGoalAmount || hasGoalDate;
    };

    const findGoalArray = (value: unknown, depth = 0): GoalDTO[] | null => {
      if (depth > 4 || value == null) return null;

      if (Array.isArray(value)) {
        if (value.length === 0) return value as GoalDTO[];

        const looksLikeGoalList = value.every((item) => isLikelyGoal(item));
        if (looksLikeGoalList) return value as GoalDTO[];
        return null;
      }

      if (typeof value !== "object") return null;

      const record = value as Record<string, unknown>;
      const priorityKeys = ["data", "metas", "items", "content", "goals", "result", "payload"];

      for (const key of priorityKeys) {
        if (!(key in record)) continue;
        const found = findGoalArray(record[key], depth + 1);
        if (found) return found;
      }

      for (const nestedValue of Object.values(record)) {
        const found = findGoalArray(nestedValue, depth + 1);
        if (found) return found;
      }

      return null;
    };

    const extracted = findGoalArray(response) ?? findGoalArray(response?.data) ?? [];
    console.log("[API] GET /metas extracted list:", extracted);
    return extracted;
  }

  async createMeta(dto: CreateMetaDTO): Promise<GoalDTO> {
    return this.request<GoalDTO>("/metas", {
      method: "POST",
      body: JSON.stringify(dto),
      preserveSessionOnAuthError: true,
    });
  }

  async updateMeta(id: string, dto: UpdateMetaDTO): Promise<GoalDTO> {
    return this.request<GoalDTO>(`/metas/${id}`, {
      method: "PUT",
      body: JSON.stringify(dto),
      preserveSessionOnAuthError: true,
    });
  }

  async deleteMeta(id: string): Promise<void> {
    return this.request<void>(`/metas/${id}`, {
      method: "DELETE",
      preserveSessionOnAuthError: true,
    });
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

