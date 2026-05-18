import { AIResponse, AITransactionAction } from "@/lib/types";
import { apiService } from "@/services/api";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export const chatIAService = {
  async sendMessage(message: string): Promise<AIResponse> {
    return sendViaBackend(message);
  },
};

async function sendViaBackend(message: string): Promise<AIResponse> {
  const response = await apiService.sendChatIA(message);

  return normalizeAIResponse(response as JsonValue);
}

function normalizeAIResponse(payload: JsonValue): AIResponse {
  const unwrapped = unwrapPayload(payload);

  if (typeof unwrapped === "string" && unwrapped.trim()) {
    return {
      tipo: "TEXTO",
      mensagem: unwrapped.trim(),
    };
  }

  const record = asRecord(unwrapped);
  if (!record) {
    return {
      tipo: "TEXTO",
      mensagem: "O backend respondeu sem uma mensagem valida.",
    };
  }

  const explicitType = pickString(record, ["tipo"]);
  const dados = extractDataRecord(record);
  const actionRecord = extractActionRecord(record, dados);
  const action = actionRecord ? normalizeAction(actionRecord) ?? undefined : undefined;
  const inferredType = action ? "CONFIRMACAO" : "TEXTO";
  const tipo = normalizeResponseType(explicitType, inferredType);
  const mensagem =
    pickString(record, ["mensagem"]) ??
    (tipo === "CONFIRMACAO"
      ? "Encontrei dados para confirmar. Deseja continuar?"
      : "Recebi sua mensagem, mas o backend nao retornou um texto de resposta.");

  return dados || action
    ? {
        tipo,
        mensagem,
        ...(dados ? { dados: dados as Record<string, unknown> } : {}),
        ...(action ? { acao: action } : {}),
      }
    : {
        tipo,
        mensagem,
      };
}

function unwrapPayload(value: JsonValue, depth = 0): JsonValue {
  if (depth > 5 || value == null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.length === 1 ? unwrapPayload(value[0], depth + 1) : value;
  }

  if (typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, JsonValue>;
  const directMessage = pickString(record, [
    "mensagem",
    "message",
    "resposta",
    "reply",
    "response",
    "output",
    "text",
    "texto",
    "answer",
  ]);
  if (directMessage) {
    return {
      ...record,
      mensagem: directMessage,
    };
  }

  const wrapperKeys = ["body", "data", "json", "payload", "result"];
  for (const key of wrapperKeys) {
    const candidate = record[key];
    if (candidate !== undefined) {
      const nested = unwrapPayload(candidate, depth + 1);
      if (nested != null) {
        return nested;
      }
    }
  }

  return value;
}

function extractDataRecord(record: Record<string, JsonValue>): Record<string, JsonValue> | undefined {
  const dadosRecord = asRecord(record.dados);
  if (dadosRecord) {
    return dadosRecord;
  }

  const dataRecord = asRecord(record.data);
  if (dataRecord) {
    return dataRecord;
  }

  return undefined;
}

function extractActionRecord(
  record: Record<string, JsonValue>,
  dados: Record<string, JsonValue> | undefined,
): Record<string, JsonValue> | undefined {
  const nestedCandidates = [
    asRecord(record.acao),
    asRecord(record.action),
    asRecord(record.transacao),
    asRecord(record.transaction),
    dados,
  ];

  for (const candidate of nestedCandidates) {
    if (candidate && hasActionShape(candidate)) {
      return candidate;
    }
  }

  return hasActionShape(record) ? record : undefined;
}

function hasActionShape(record: Record<string, JsonValue>) {
  return [
    "valor",
    "amount",
    "categoria",
    "category",
    "descricao",
    "description",
    "data",
    "date",
    "recorrente",
    "recurring",
    "transactionType",
    "natureza",
  ].some((key) => record[key] !== undefined);
}

function normalizeAction(record: Record<string, JsonValue>): AITransactionAction | null {
  const tipo = pickString(record, ["tipo", "type", "transactionType", "natureza"]);
  const valor = pickNumberLike(record, ["valor", "amount", "valorFormatado", "formattedAmount"]);
  const categoria = pickString(record, ["categoria", "category", "grupo", "classificacao"]);
  const descricao = pickString(record, [
    "descricao",
    "description",
    "titulo",
    "title",
    "nome",
    "name",
  ]);
  const data = pickString(record, ["data", "date", "dataLancamento", "transactionDate"]);
  const recorrente = pickBooleanLike(record, ["recorrente", "recurring", "isRecurring"]);

  const hasMeaningfulAction =
    Boolean(tipo) ||
    valor !== undefined ||
    Boolean(categoria) ||
    Boolean(descricao) ||
    Boolean(data) ||
    recorrente !== undefined;

  if (!hasMeaningfulAction) {
    return null;
  }

  return {
    ...(tipo ? { tipo: tipo as AITransactionAction["tipo"] } : {}),
    ...(valor !== undefined ? { valor } : {}),
    ...(categoria ? { categoria } : {}),
    ...(descricao ? { descricao } : {}),
    ...(data ? { data } : {}),
    ...(recorrente !== undefined ? { recorrente } : {}),
  };
}

function normalizeResponseType(
  value: string | undefined,
  fallback: AIResponse["tipo"],
): AIResponse["tipo"] {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return fallback;

  if (["confirmacao", "confirm", "confirmation"].includes(normalized)) {
    return "CONFIRMACAO";
  }

  return "TEXTO";
}

function asRecord(value: JsonValue | undefined): Record<string, JsonValue> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, JsonValue>;
}

function pickString(record: Record<string, JsonValue>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function pickNumberLike(record: Record<string, JsonValue>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function pickBoolean(record: Record<string, JsonValue>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") {
      return value;
    }
  }

  return undefined;
}

function pickBooleanLike(record: Record<string, JsonValue>, keys: string[]) {
  const exactBoolean = pickBoolean(record, keys);
  if (exactBoolean !== undefined) {
    return exactBoolean;
  }

  for (const key of keys) {
    const value = record[key];
    if (typeof value !== "string") continue;

    const normalized = value.trim().toLowerCase();
    if (["true", "1", "sim", "yes"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "nao", "no"].includes(normalized)) {
      return false;
    }
  }

  return undefined;
}
