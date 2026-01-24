import { AIResponse } from "@/lib/types";

export const mockIA = (mensagem: string): AIResponse => {
  const texto = mensagem.toLowerCase();

  // Exemplo: despesa
  if (texto.includes("comprei") || texto.includes("gastei") || texto.includes("paguei")) {
    return {
      tipo: "CONFIRMACAO",
      mensagem: "Entendi que você quer cadastrar uma despesa. Confirma?",
      acao: {
        tipo: "DESPESA",
        valor: 20,
        categoria: "Lanche",
        descricao: "Compra informada pelo chat",
        data: new Date().toISOString().split("T")[0],
      },
    };
  }

  // Exemplo: receita
  if (texto.includes("recebi") || texto.includes("salário")) {
    return {
      tipo: "CONFIRMACAO",
      mensagem: "Entendi que você quer cadastrar uma receita. Confirma?",
      acao: {
        tipo: "RECEITA",
        valor: 1200,
        categoria: "Salário",
        descricao: "Receita informada pelo chat",
        data: new Date().toISOString().split("T")[0],
      },
    };
  }

  // Resposta padrão
  return {
    tipo: "TEXTO",
    mensagem:
      "Posso te ajudar a cadastrar receitas ou despesas. Exemplo: 'Paguei 20 de lanche hoje'.",
  };
};
