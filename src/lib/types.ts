/* =====================================================
   TIPOS GLOBAIS DO PROJETO
===================================================== */

/* =========================
   USER / AUTH
========================= */

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  message?: string;
  user?: User;
}

/* =========================
   API RESPONSE (GENÉRICO)
========================= */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

/* =========================
   TRANSAÇÕES FINANCEIRAS
========================= */

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionDTO {
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  notes?: string;
}

/* =========================
   DASHBOARD
========================= */

export interface DashboardTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
}

/* =========================
   METAS / GOALS
========================= */

export type GoalStatus = "active" | "completed" | "paused";

export interface Goal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

/* =========================
   CHAT IA
========================= */

/**
 * Estados possíveis do chat no FRONT
 * (o backend controla a lógica)
 */
export type ChatState = "NORMAL" | "AGUARDANDO_CONFIRMACAO";

export interface AITransactionAction {
  tipo?: "RECEITA" | "DESPESA" | "income" | "expense";
  type?: "RECEITA" | "DESPESA" | "income" | "expense";
  valor?: number | string;
  amount?: number | string;
  categoria?: string;
  category?: string;
  descricao?: string;
  description?: string;
  data?: string;
  date?: string;
  recorrente?: boolean;
  recurring?: boolean;
}

/**
 * Resposta da IA vinda do BACKEND
 * ⚠️ NÃO existe objeto de ação aqui
 */
export interface AIResponse {
  tipo: "TEXTO" | "CONFIRMACAO";
  mensagem: string;
  dados?: Record<string, unknown>;
  acao?: AITransactionAction;
  action?: AITransactionAction;
}
