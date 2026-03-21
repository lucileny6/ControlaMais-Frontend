import { AIResponse, AITransactionAction } from "@/lib/types";
import { apiService } from "@/services/api";

const DEFAULT_CHAT_WEBHOOK_URL = "http://localhost:5678/webhook/chat-financeiro";

const CHAT_WEBHOOK_URL =
  process.env.EXPO_PUBLIC_CHAT_FINANCEIRO_WEBHOOK_URL ??
  process.env.EXPO_PUBLIC_CHAT_WEBHOOK_URL ??
  process.env.EXPO_PUBLIC_N8N_CHAT_WEBHOOK_URL ??
  process.env.EXPO_PUBLIC_N8N_WEBHOOK_URL ??
  DEFAULT_CHAT_WEBHOOK_URL;
const CHAT_PROVIDER = (process.env.EXPO_PUBLIC_CHAT_PROVIDER ?? "webhook").trim().toLowerCase();

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export const chatIAService = {
  async sendMessage(message: string): Promise<AIResponse> {
    if (CHAT_PROVIDER === "backend") {
      return sendViaBackend(message);
    }

    if (CHAT_PROVIDER === "webhook") {
      return sendViaWebhook(message);
    }

    return sendWithFallback(message);
  },
};

async function sendWithFallback(message: string): Promise<AIResponse> {
  try {
    return await sendViaWebhook(message);
  } catch (webhookError: any) {
    try {
      return await sendViaBackend(message);
    } catch (backendError: any) {
      const webhookMessage = String(webhookError?.message ?? "Falha no webhook");
      const backendMessage = String(backendError?.message ?? "Falha no backend");
      throw new Error(`Nao foi possivel consultar o chat pelo workflow nem pelo backend. Workflow: ${webhookMessage}. Backend: ${backendMessage}.`);
    }
  }
}

async function sendViaBackend(message: string): Promise<AIResponse> {
  return apiService.sendChatIA(message);
}

async function sendViaWebhook(message: string): Promise<AIResponse> {
  const payload = JSON.stringify({
    texto: message,
  });

  const candidateUrls = buildWebhookCandidates(CHAT_WEBHOOK_URL);
  const attemptErrors: string[] = [];

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: payload,
      });

      const responseText = await response.text();
      const parsedResponse = responseText ? safeParseJson(responseText) : null;

      if (!response.ok) {
        const message = extractErrorMessage(parsedResponse, response.status);

        if (response.status === 404 && candidateUrls.length > 1) {
          attemptErrors.push(`${url} -> ${message}`);
          continue;
        }

        throw new Error(message);
      }

      return normalizeAIResponse(parsedResponse);
    } catch (error: any) {
      const message = formatWebhookFetchError(url, error);
      attemptErrors.push(`${url} -> ${message}`);

      if (url !== candidateUrls[candidateUrls.length - 1]) {
        continue;
      }
    }
  }

  throw new Error(buildWebhookFailureMessage(candidateUrls, attemptErrors));
}

function buildWebhookCandidates(primaryUrl: string) {
  const candidates = [primaryUrl];

  if (primaryUrl.includes("/webhook-test/")) {
    candidates.push(primaryUrl.replace("/webhook-test/", "/webhook/"));
  } else if (primaryUrl.includes("/webhook/")) {
    candidates.push(primaryUrl.replace("/webhook/", "/webhook-test/"));
  }

  return Array.from(new Set(candidates));
}

function buildWebhookFailureMessage(candidateUrls: string[], errors: string[]) {
  const triedTestWebhook = candidateUrls.some((url) => url.includes("/webhook-test/"));
  const hasLocalhostUrl = candidateUrls.some((url) => url.includes("localhost") || url.includes("127.0.0.1"));
  const missingTestListener = errors.some((item) => item.includes("/webhook-test/") && item.includes("erro 404"));
  const networkFetchFailed = errors.some((item) => {
    const normalized = item.toLowerCase();
    return normalized.includes("failed to fetch") || normalized.includes("network request failed");
  });

  if (missingTestListener) {
    return "O endpoint de teste do n8n nao estava ouvindo. No n8n, /webhook-test so responde enquanto o workflow estiver em 'Listen for Test Event'.";
  }

  if (networkFetchFailed && hasLocalhostUrl) {
    return "Nao foi possivel acessar o workflow em localhost. Se voce estiver testando no celular ou emulador, troque 'localhost' pelo IP da maquina que roda o n8n.";
  }

  if (triedTestWebhook && errors.length > 0) {
    return `Nao foi possivel consultar o workflow do chat. Tentativas: ${errors.join(" | ")}`;
  }

  return "Nao foi possivel consultar o workflow do chat.";
}

function formatWebhookFetchError(url: string, error: unknown) {
  const message = String((error as any)?.message ?? error ?? "Falha ao acessar o webhook");
  if (
    (message.toLowerCase().includes("failed to fetch") ||
      message.toLowerCase().includes("network request failed")) &&
    (url.includes("localhost") || url.includes("127.0.0.1"))
  ) {
    return "falha de rede ao acessar localhost";
  }

  return message;
}

function safeParseJson(value: string): JsonValue {
  try {
    return JSON.parse(value) as JsonValue;
  } catch {
    return value;
  }
}

function extractErrorMessage(payload: JsonValue, status: number) {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  const record = asRecord(unwrapPayload(payload));
  if (record) {
    const candidate = pickString(record, ["message", "mensagem", "error", "erro", "detail"]);
    if (candidate) {
      return candidate;
    }
  }

  return `O webhook respondeu com erro ${status}.`;
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
      mensagem: "O workflow respondeu sem uma mensagem valida.",
    };
  }

  const explicitType = pickString(record, ["tipo"]);
  const dados = extractDataRecord(record);
  const action = dados ? normalizeAction(dados) ?? undefined : undefined;
  const inferredType = dados ? "CONFIRMACAO" : "TEXTO";
  const tipo = normalizeResponseType(explicitType, inferredType);
  const mensagem = pickString(record, ["mensagem"]) ??
    (tipo === "CONFIRMACAO"
      ? "Encontrei dados para confirmar. Deseja continuar?"
      : "Recebi sua mensagem, mas o workflow nao retornou um texto de resposta.");

  return dados
    ? {
        tipo,
        mensagem,
        dados: dados as Record<string, unknown>,
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

  return undefined;
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

  if (["confirmacao", "confirmação", "confirm", "confirmation"].includes(normalized)) {
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

    if (["false", "0", "nao", "não", "no"].includes(normalized)) {
      return false;
    }
  }

  return undefined;
}
