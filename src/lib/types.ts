export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updateAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
  updateAt: string;
}

export interface CreateTransactionDTO {
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
  notes?: string;
}

export interface LoginResponse {
  token: string;
  message: string;
  sucess: boolean;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  status: "active" | "completed" | "paused";
  createdAt: string;
  updateAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  response: string;
  timestamp: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
}

export interface ApiResponse<T> {
  success: boolean;
  date: T;
  message?: string;
  error?: string;
  user?: User;
  token: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  date: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ResponsiveStyles {
  cardPadding: number;
  cardMargin: number;
  gridGap: number;
  columnMinWidth: number;
  cardMinHeight: number;
}
// ===================================
// CHAT IA
// ===================================

export type ChatState = "NORMAL" | "AGUARDANDO_CONFIRMACAO";

export interface AcaoFinanceira {
  tipo: "RECEITA" | "DESPESA";
  valor: number;
  categoria: string;
  descricao: string;
  data: string;
}

export interface AIResponse {
  tipo: "TEXTO" | "CONFIRMACAO";
  mensagem: string;
  acao?: AcaoFinanceira;
}

