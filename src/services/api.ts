import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { LoginResponse, User as AuthUser } from "@/lib/types";


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

export interface PendingUser {
  id: string | number;
  name?: string;
  nome?: string;
  username: string;
  email: string;
  aprovado?: boolean;
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
  type?: "income" | "expense" | "ia";
  tipo?: "income" | "expense" | "ia" | "receita" | "despesa";
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
  private baseUrl = resolveApiBaseUrl();

  private typeSafeRequestOptions(
    options: RequestInit & {
      preserveSessionOnAuthError?: boolean;
      skipAuth?: boolean;
      suppressAuthRedirect?: boolean;
    },
  ) {
    const { preserveSessionOnAuthError, skipAuth, suppressAuthRedirect, ...requestOptions } = options;
    return {
      preserveSessionOnAuthError: Boolean(preserveSessionOnAuthError),
      skipAuth: Boolean(skipAuth),
      suppressAuthRedirect: Boolean(suppressAuthRedirect),
      requestOptions,
    };
  }

  private buildTransactionEndpoints(
    id: string,
    transactionType?: "income" | "expense" | "ia",
  ) {
    const genericEndpoint = transactionType ? `/transacoes/${id}/${transactionType}` : undefined;
    const legacyGenericEndpoint = transactionType ? `/transaction/${id}/${transactionType}` : undefined;
    const preferredEndpoint =
      transactionType === "income"
        ? `/receitas/${id}`
        : transactionType === "expense"
          ? `/despesas/${id}`
          : transactionType === "ia"
            ? `/acoes-financeiras/${id}`
            : undefined;

    return Array.from(
      new Set(
        [
          genericEndpoint,
          preferredEndpoint,
          `/receitas/${id}`,
          `/despesas/${id}`,
          `/acoes-financeiras/${id}`,
          legacyGenericEndpoint,
        ].filter((endpoint): endpoint is string => Boolean(endpoint)),
      ),
    );
  }

  private shouldTryAnotherTransactionEndpoint(error: unknown) {
    const message = String((error as any)?.message ?? "").toLowerCase();
    if (!message) return false;

    if (message.includes("401") || message.includes("403")) {
      return false;
    }

    return (
      message.includes("404") ||
      message.includes("nao encontrada") ||
      message.includes("nao encontrado") ||
      message.includes("não encontrada") ||
      message.includes("não encontrado") ||
      message.includes("not found")
    );
  }

  /* MÉTODO BASE (PRIVADO)*/
  
  private async request<T>(
    endpoint: string,
    options: (RequestInit & {
      preserveSessionOnAuthError?: boolean;
      skipAuth?: boolean;
      suppressAuthRedirect?: boolean;
    }) = {}
  ): Promise<T> {
    const { preserveSessionOnAuthError, skipAuth, suppressAuthRedirect, requestOptions } =
      this.typeSafeRequestOptions(options);
    const [plainToken, scopedToken] = await Promise.all([
      AsyncStorage.getItem("authToken"),
      AsyncStorage.getItem("@authToken"),
    ]);
    const authToken = skipAuth ? "" : plainToken || scopedToken;
    const method = requestOptions.method ?? "GET";
    console.log(`[API] ${method} ${endpoint} auth token present:`, Boolean(authToken));

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...requestOptions,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          ...(requestOptions.headers || {}),
        },
      });
    } catch (error: any) {
      console.log(`[API] ${method} ${endpoint} network error:`, error);
      throw new Error(`Falha de conexão em ${method} ${endpoint}`);
    }

    console.log(`[API] ${method} ${endpoint} status:`, response.status);

    if (!response.ok) {
      const error: any = await response.json().catch(() => null);
      console.log(`[API] ${method} ${endpoint} error body:`, error);

      if (response.status === 401 || response.status === 403) {
        if (skipAuth || preserveSessionOnAuthError) {
          throw new Error(error?.message || `Erro ${response.status} em ${method} ${endpoint}`);
        }

        await clearStoredAuthSession();

        const webEnv = globalThis as { location?: { pathname?: string; assign?: (url: string) => void } };
        if (!suppressAuthRedirect && webEnv.location && webEnv.location.pathname !== "/login") {
          webEnv.location.assign?.("/login");
        }

        throw new Error(error?.message || "Sessão expirada ou sem permissão. Faça login novamente.");
      }
      /*
        if (false && skipAuth && endpoint === "/users/login") {
          throw new Error(error?.message ? `Erro ${response.status}: ${error.message}` : `Erro ${response.status} em POST /users/login`);
        }

        const webEnv = globalThis as { location?: { pathname?: string; assign?: (url: string) => void } };
        if (false && !suppressAuthRedirect && webEnv.location && webEnv.location.pathname !== "/login") {
          webEnv.location.assign?.("/login");
        }

        throw new Error(error?.message || "Sessão expirada ou sem permissão. Faça login novamente.");
      
      */
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

  /* AUTH */

  async clearAuthSession() {
    await clearStoredAuthSession();
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      skipAuth: true,
      suppressAuthRedirect: true,
    });
  }

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/users/register", {
      method: "POST",
      body: JSON.stringify({ username: name, email, password }),
      skipAuth: true,
      suppressAuthRedirect: true,
    });
  }

  async logout() {
    await this.clearAuthSession();
  }

  async getPendingUsers(): Promise<PendingUser[]> {
    const response = await this.request<any>("/users/pendentes");
    const payload = response?.data ?? response;
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.pendentes)
        ? payload.pendentes
        : Array.isArray(payload?.users)
          ? payload.users
          : Array.isArray(payload?.usuarios)
            ? payload.usuarios
            : [];

    return list.filter((item: PendingUser) => item?.aprovado !== true);
  }

  async approveUser(id: string | number): Promise<void> {
    return this.request<void>(`/users/${id}/aprovar`, {
      method: "PUT",
    });
  }

  /* RECEITA / DESPESA */

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
    transactionType?: "income" | "expense" | "ia"
  ) {
    if (transactionType === "ia" || dto.type === "ia" || dto.tipo === "ia") {
      console.log("[API] updateTransaction payload:", { endpoint: `/acoes-financeiras/${id}`, dto, transactionType });
      return this.request(`/acoes-financeiras/${id}`, {
        method: "PUT",
        body: JSON.stringify(dto),
      });
    }

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

    throw lastError ?? new Error("Não foi possível atualizar a transação");
  }

  async deleteTransaction(id: string, transactionType?: "income" | "expense" | "ia") {
    const endpoints = this.buildTransactionEndpoints(id, transactionType);

    let lastError: Error | null = null;
    for (let index = 0; index < endpoints.length; index += 1) {
      const endpoint = endpoints[index];
      try {
        return await this.request(endpoint, {
          method: "DELETE",
        });
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const canRetryOnAnotherEndpoint = this.shouldTryAnotherTransactionEndpoint(error);
        if (!canRetryOnAnotherEndpoint || index === endpoints.length - 1) {
          throw lastError;
        }
      }
    }

    throw lastError ?? new Error("Não foi possível excluir a transação");
  }

  

  async getDashboard(): Promise<DashboardDTO> {
    const response = await this.request<any>("/dashboard", { preserveSessionOnAuthError: true });
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

  
  async getTransactions(options: { preserveSessionOnAuthError?: boolean } = {}): Promise<any[]> {
    const extractList = (response: any) => {
      const payload = response?.data ?? response;
      if (Array.isArray(payload)) return payload;

      const annotateGroupedItems = (group: any, transactionType: "income" | "expense" | "ia") => {
        if (!Array.isArray(group)) return [];

        return group.map((item: any) => {
          if (!item || typeof item !== "object") {
            return item;
          }

          const hasExplicitType =
            item?.type !== undefined ||
            item?.tipo !== undefined ||
            item?.transactionType !== undefined ||
            item?.natureza !== undefined;

          if (hasExplicitType) {
            return item;
          }

          return {
            ...item,
            type: transactionType,
            tipo:
              transactionType === "income"
                ? "receita"
                : transactionType === "expense"
                  ? "despesa"
                  : "ia",
          };
        });
      };

      const directCandidates = [
        payload?.transacoes,
        payload?.transactions,
        payload?.lancamentos,
        payload?.registros,
        payload?.acoesFinanceiras,
        payload?.acoes_financeiras,
        payload?.financialActions,
        payload?.content,
        payload?.items,
        payload?.results,
        payload?.result,
      ];
      for (const candidate of directCandidates) {
        if (Array.isArray(candidate)) return candidate;
      }

      // Some backends split transactions by type.
      const groupedCandidates = [
        annotateGroupedItems(payload?.receitas, "income"),
        annotateGroupedItems(payload?.despesas, "expense"),
        annotateGroupedItems(payload?.incomes, "income"),
        annotateGroupedItems(payload?.expenses, "expense"),
        annotateGroupedItems(payload?.acoesFinanceiras, "ia"),
        annotateGroupedItems(payload?.acoes, "ia"),
        annotateGroupedItems(payload?.ias, "ia"),
      ];
      const mergedGrouped = groupedCandidates.flat();
      if (mergedGrouped.length > 0) return mergedGrouped;

      return [];
    };

    const normalizeFinancialAction = (item: any) => {
      if (!item || typeof item !== "object") {
        return item;
      }

      const source = item?.acaoFinanceira ?? item?.acao ?? item?.transaction ?? item?.transacao ?? item;
      const rawType = String(
        source?.tipoTransacao ??
          source?.tipoLancamento ??
          source?.tipoMovimentacao ??
          source?.natureza ??
          source?.transactionType ??
          source?.type ??
          source?.tipo ??
          item?.tipoTransacao ??
          item?.tipoLancamento ??
          item?.tipoMovimentacao ??
          item?.natureza ??
          item?.transactionType ??
          item?.type ??
          item?.tipo ??
          "",
      )
        .toLowerCase()
        .trim();
      const normalizedType =
        rawType.includes("receita") ||
        rawType.includes("income") ||
        rawType.includes("entrada") ||
        rawType.includes("ganho")
          ? "income"
          : "expense";

      return {
        ...item,
        id:
          source?.id ??
          source?._id ??
          source?.acaoFinanceiraId ??
          source?.idAcaoFinanceira ??
          item?.id ??
          item?._id,
        type: normalizedType,
        tipo: normalizedType === "income" ? "receita" : "despesa",
        valor:
          source?.valor ??
          source?.amount ??
          source?.value ??
          source?.preco ??
          source?.valorTransacao ??
          source?.valorLancamento ??
          source?.valorEstimado ??
          item?.valor ??
          item?.amount,
        descricao:
          source?.descricao ??
          source?.description ??
          source?.titulo ??
          source?.nome ??
          source?.mensagem ??
          source?.texto ??
          item?.descricao ??
          item?.description,
        categoria:
          source?.categoria ??
          source?.category ??
          source?.grupo ??
          source?.classificacao ??
          item?.categoria ??
          item?.category,
        data:
          source?.data ??
          source?.date ??
          source?.dataTransacao ??
          source?.dataLancamento ??
          source?.dataDespesa ??
          source?.dataReceita ??
          source?.createdAt ??
          item?.data ??
          item?.date ??
          item?.createdAt,
        createdAt:
          source?.createdAt ??
          source?.created_at ??
          source?.criadoEm ??
          source?.dataCriacao ??
          item?.createdAt ??
          item?.created_at ??
          item?.criadoEm ??
          item?.dataCriacao,
        observacao:
          source?.observacao ??
          source?.notes ??
          item?.observacao ??
          item?.notes ??
          "[CHAT] Lancamento via chat",
      };
    };

    const mergeTransactions = (...groups: any[][]) => {
      const seen = new Set<string>();
      const merged: any[] = [];

      for (const group of groups) {
        for (const item of group) {
          const rawType = String(
            item?.type ??
              item?.tipo ??
              item?.transactionType ??
              item?.natureza ??
              item?.acaoFinanceira?.type ??
              item?.acaoFinanceira?.tipo ??
              "",
          )
            .toLowerCase()
            .trim();
          const rawId = String(
            item?.id ??
              item?._id ??
              item?.transactionId ??
              item?.transacaoId ??
              item?.acaoFinanceiraId ??
              item?.idAcaoFinanceira ??
              item?.acaoFinanceira?.id ??
              item?.acaoFinanceira?._id ??
              "",
          ).trim();
          const signature = rawId
            ? `${rawType || "unknown"}:${rawId}`
            : JSON.stringify({
                type: rawType,
                descricao: item?.descricao ?? item?.description,
                valor: item?.valor ?? item?.amount,
                data: item?.data ?? item?.date,
              });

          if (seen.has(signature)) continue;
          seen.add(signature);
          merged.push(item);
        }
      }

      return merged;
    };

    const getFinancialActions = async () => {
  try {
    const response = await this.request<any>("/transacoes", {
      preserveSessionOnAuthError:
        options.preserveSessionOnAuthError,
    });

    const extracted = extractList(response).map(
      normalizeFinancialAction
    );

    console.log(
      "[API] GET /acoes-financeiras extracted:",
      extracted
    );

    return extracted;
  } catch (error) {
    console.log(
      "[API] GET /acoes-financeiras error:",
      error
    );

    return [];
  }
  
};


    try {
      const response = await this.request<any>("/transacoes", {
        preserveSessionOnAuthError: options.preserveSessionOnAuthError,
      });
      console.log("[API] GET /transacoes raw:", response);
      const extracted = extractList(response);
      const financialActions = await getFinancialActions();
      const merged = mergeTransactions(extracted, financialActions);
      console.log("[API] GET /transacoes extracted recurring fields:", extracted.map((item: any) => ({
        id: item?.id ?? item?._id ?? item?.transactionId,
        descricao: item?.descricao ?? item?.description,
        recorrente: item?.recorrente,
        recurring: item?.recurring,
        isRecurring: item?.isRecurring,
        recorrencia: item?.recorrencia,
      })));
      return merged;
    } catch (error) {
      const message = String((error as any)?.message ?? "");
      if (message.includes("403") || message.includes("401") || message.toLowerCase().includes("sessao")) {
        throw error;
      }
      console.log("[API] GET /transacoes failed, trying /transaction:", error);
      const response = await this.request<any>("/transaction", {
        preserveSessionOnAuthError: options.preserveSessionOnAuthError,
      });
      console.log("[API] GET /transaction raw:", response);
      const extracted = extractList(response);
      const financialActions = await getFinancialActions();
      const merged = mergeTransactions(extracted, financialActions);
      console.log("[API] GET /transaction extracted recurring fields:", extracted.map((item: any) => ({
        id: item?.id ?? item?._id ?? item?.transactionId,
        descricao: item?.descricao ?? item?.description,
        recorrente: item?.recorrente,
        recurring: item?.recurring,
        isRecurring: item?.isRecurring,
        recorrencia: item?.recorrencia,
      })));
      return merged;
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

  async sendChatIA(message: string): Promise<unknown> {
    const payload = JSON.stringify({
      mensagem: message,
    });

    const configuredEndpoint = normalizeEndpointPath(process.env.EXPO_PUBLIC_CHAT_API_PATH);
    const endpoints = Array.from(
      new Set(
        [configuredEndpoint, "/chat-ia", "/chat"]
          .filter((endpoint): endpoint is string => Boolean(endpoint)),
      ),
    );

    let lastError: Error | null = null;

    for (const endpoint of endpoints) {
      try {
        return await this.request<unknown>(endpoint, {
          method: "POST",
          body: payload,
        });
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (!lastError.message.includes("404")) {
          throw lastError;
        }
      }
    }

    throw lastError ?? new Error("Não foi possível consultar o endpoint do chat no backend.");
  }
}

/* =====================================================
   INSTÂNCIA ÚNICA
===================================================== */

export const apiService = new ApiService();

const AUTH_STORAGE_KEYS = [
  "authToken",
  "user",
  "displayName",
  "@authToken",
  "@user",
  "@displayName",
];

async function clearStoredAuthSession() {
  await AsyncStorage.multiRemove(AUTH_STORAGE_KEYS);

  const webStorage = globalThis as {
    localStorage?: Storage;
    sessionStorage?: Storage;
  };

  for (const key of AUTH_STORAGE_KEYS) {
    try {
      webStorage.localStorage?.removeItem(key);
      webStorage.sessionStorage?.removeItem(key);
    } catch {
      // Web storage can be unavailable in private modes or native runtimes.
    }
  }
}

function resolveApiBaseUrl() {
  const webBaseUrl =
    process.env.EXPO_PUBLIC_API_URL_WEB ??
    process.env.EXPO_PUBLIC_WEB_API_URL;

  if (Platform.OS === "web" && webBaseUrl?.trim()) {
    const normalizedWebBaseUrl = webBaseUrl.trim().replace(/\/+$/, "");
    return /\/api$/i.test(normalizedWebBaseUrl)
      ? normalizedWebBaseUrl
      : `${normalizedWebBaseUrl}/api`;
  }

  const configuredBaseUrl =
    process.env.EXPO_PUBLIC_API_URL ??
    process.env.EXPO_PUBLIC_BACKEND_API_URL ??
    process.env.EXPO_PUBLIC_BACKEND_URL;

  if (!configuredBaseUrl) {
    return "https://controlamais.onrender.com/api";
  }

  const normalizedBaseUrl = configuredBaseUrl.trim().replace(/\/+$/, "");
  if (!normalizedBaseUrl) {
    return "https://controlamais.onrender.com/api";
  }

  return /\/api$/i.test(normalizedBaseUrl)
    ? normalizedBaseUrl
    : `${normalizedBaseUrl}/api`;
}

function normalizeEndpointPath(endpoint: string | undefined) {
  const normalizedEndpoint = endpoint?.trim();
  if (!normalizedEndpoint) {
    return undefined;
  }

  return normalizedEndpoint.startsWith("/") ? normalizedEndpoint : `/${normalizedEndpoint}`;
}
