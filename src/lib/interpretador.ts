import { detectCurrentMonthFinanceIntent } from "@/lib/monthly-finance";

export type ChatIntent =
  | "create_expense"
  | "create_income"
  | "create_transaction"
  | "get_balance"
  | "get_expenses"
  | "get_income"
  | "get_summary"
  | "get_top_expense"
  | "cancel"
  | "unknown";

export interface InterpretedEntities {
  amount?: number;
  category?: string;
  date?: string;
}

export interface InterpretedMessage {
  intent: ChatIntent;
  entities: InterpretedEntities;
}

const CANCEL_KEYWORDS = ["cancelar", "cancela", "nao", "não", "parar", "deixa"];
const QUESTION_KEYWORDS = ["quanto", "qual", "quais", "como", "onde", "saldo", "resumo", "mostra", "me mostre"];
const GENERIC_CREATE_KEYWORDS = ["registrar", "cadastrar", "lancar", "lançar", "adicionar", "incluir", "fazer"];
const EXPENSE_KEYWORDS = ["despesa", "despesas", "gasto", "gastos", "saida", "saída", "pagamento", "pagar"];
const EXPENSE_ACTION_KEYWORDS = ["gastei", "paguei", "comprei", "desembolsei"];
const INCOME_KEYWORDS = ["receita", "receitas", "entrada", "entradas", "recebimento", "receber"];
const INCOME_ACTION_KEYWORDS = ["recebi", "ganhei", "entrou"];
const RELATIVE_DATE_KEYWORDS = ["hoje", "ontem", "amanha", "amanhã", "agora", "esse mes", "este mes", "neste mes", "no mes"];

export function interpretUserMessage(content: string): InterpretedMessage {
  return {
    intent: detectIntent(content),
    entities: extractEntities(content),
  };
}

export function detectIntent(text: string): ChatIntent {
  const normalized = normalizeText(text);
  if (!normalized) return "unknown";

  if (CANCEL_KEYWORDS.includes(normalized)) {
    return "cancel";
  }

  const amount = extractAmount(text);
  const hasQuestionIntent = isQuestionText(normalized);
  const hasExpenseKeyword = hasAnyKeyword(normalized, [...EXPENSE_KEYWORDS, ...EXPENSE_ACTION_KEYWORDS]);
  const hasIncomeKeyword = hasAnyKeyword(normalized, [...INCOME_KEYWORDS, ...INCOME_ACTION_KEYWORDS, "salario", "salário"]);
  const hasGenericCreateKeyword = hasAnyKeyword(normalized, GENERIC_CREATE_KEYWORDS);
  const hasExpenseCreateCue =
    hasAnyKeyword(normalized, EXPENSE_ACTION_KEYWORDS) || (hasGenericCreateKeyword && hasExpenseKeyword);
  const hasIncomeCreateCue =
    hasAnyKeyword(normalized, INCOME_ACTION_KEYWORDS) || (hasGenericCreateKeyword && hasIncomeKeyword);

  if (!hasQuestionIntent) {
    if (hasExpenseCreateCue || (amount !== undefined && hasExpenseKeyword)) {
      return "create_expense";
    }

    if (hasIncomeCreateCue || (amount !== undefined && hasIncomeKeyword)) {
      return "create_income";
    }

    if (normalized.includes("movimentacao") && hasGenericCreateKeyword) {
      return "create_transaction";
    }
  }

  const monthlyIntent = detectCurrentMonthFinanceIntent(text);
  if (monthlyIntent) {
    switch (monthlyIntent) {
      case "balance":
        return "get_balance";
      case "expenses":
        return "get_expenses";
      case "income":
        return "get_income";
      case "summary":
        return "get_summary";
      case "top_expense":
        return "get_top_expense";
      default:
        break;
    }
  }

  if (hasQuestionIntent) {
    if (normalized.includes("movimentacao")) {
      return "create_transaction";
    }

    if (normalized.includes("saldo")) {
      return "get_balance";
    }

    if (hasExpenseKeyword) {
      return "get_expenses";
    }

    if (hasIncomeKeyword) {
      return "get_income";
    }
  }

  if (hasExpenseCreateCue) return "create_expense";
  if (hasIncomeCreateCue) return "create_income";

  return "unknown";
}

export function extractEntities(text: string): InterpretedEntities {
  const amount = extractAmount(text);
  const category = extractCategory(text);
  const date = extractDate(text);

  return {
    ...(amount !== undefined ? { amount } : {}),
    ...(category ? { category } : {}),
    ...(date ? { date } : {}),
  };
}

export function extractAmount(text: string): number | undefined {
  const sanitized = text
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ")
    .replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, " ");

  const matches = sanitized.match(
    /(?:r\$\s*)?-?\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|(?:r\$\s*)?-?\d+(?:[.,]\d{1,2})?/gi,
  );
  if (!matches) return undefined;

  for (const match of matches) {
    const parsed = parseCurrency(match);
    if (parsed > 0) {
      return parsed;
    }
  }

  return undefined;
}

export function extractCategory(text: string): string | undefined {
  const normalized = normalizeText(text);
  if (!normalized || isQuestionText(normalized)) {
    return undefined;
  }

  const directPrepositionMatch = normalized.match(/\b(?:com|de|do|da|no|na|para|por|em)\s+(.+)$/);
  if (directPrepositionMatch?.[1]) {
    const cleaned = cleanupCategory(directPrepositionMatch[1]);
    if (cleaned) return cleaned;
  }

  let subject = normalized
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ")
    .replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, " ")
    .replace(/r\$\s*\d+(?:[.,]\d+)?/g, " ")
    .replace(/\b\d+(?:[.,]\d+)?\b/g, " ")
    .replace(/\b(reais?|real)\b/g, " ");

  const leadingPatterns = [
    /^(?:quero\s+)?(?:registrar|cadastrar|lancar|lançar|adicionar|incluir|fazer)\s+(?:uma\s+|um\s+)?(?:nova\s+)?(?:despesa|gasto|saida|saída|pagamento|receita|entrada|ganho|recebimento|movimentacao|movimentação)\s*/i,
    /^(?:despesa|gasto|saida|saída|pagamento|receita|entrada|ganho|recebimento)\s*/i,
    /^(?:gastei|paguei|comprei|desembolsei|recebi|ganhei|entrou)\s*/i,
  ];

  for (const pattern of leadingPatterns) {
    subject = subject.replace(pattern, "").trim();
  }

  subject = subject
    .replace(/\b(?:hoje|ontem|amanha|amanhã|agora|esse mes|este mes|neste mes|no mes)\b/g, " ")
    .replace(/^(?:com|de|do|da|no|na|para|por|em|referente a)\s+/i, "")
    .replace(/[?.!,;:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const cleaned = cleanupCategory(subject);
  return cleaned || undefined;
}

export function extractDate(text: string): string | undefined {
  const normalized = normalizeText(text);
  if (!normalized) return undefined;

  if (normalized.includes("hoje")) return formatDateOffset(0);
  if (normalized.includes("ontem")) return formatDateOffset(-1);
  if (normalized.includes("amanha") || normalized.includes("amanhã")) return formatDateOffset(1);

  const isoMatch = normalized.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (isoMatch) return isoMatch[0];

  const brazilianDateMatch = normalized.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (!brazilianDateMatch) return undefined;

  const day = Number(brazilianDateMatch[1]);
  const month = Number(brazilianDateMatch[2]);
  const year = Number(
    brazilianDateMatch[3]
      ? brazilianDateMatch[3].length === 2
        ? `20${brazilianDateMatch[3]}`
        : brazilianDateMatch[3]
      : new Date().getFullYear(),
  );

  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return undefined;
  }

  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function hasAnyKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(normalizeText(keyword)));
}

function isQuestionText(text: string) {
  return text.includes("?") || hasAnyKeyword(text, QUESTION_KEYWORDS);
}

function parseCurrency(value: string) {
  const cleaned = value.replace(/[^\d,.-]/g, "");
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
}

function cleanupCategory(value: string) {
  const cleaned = value
    .replace(/\b(?:e|uma|um|o|a)\b$/g, "")
    .replace(/\b(?:ontem|hoje|amanha|amanhã|agora)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "";
  if (RELATIVE_DATE_KEYWORDS.includes(cleaned)) return "";

  return cleaned;
}

function formatDateOffset(offsetDays: number) {
  const reference = new Date();
  reference.setDate(reference.getDate() + offsetDays);
  return [
    reference.getFullYear(),
    String(reference.getMonth() + 1).padStart(2, "0"),
    String(reference.getDate()).padStart(2, "0"),
  ].join("-");
}
