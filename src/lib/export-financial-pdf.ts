import { isInvestmentCategory } from "@/lib/investments";
import { parseTransactionDate } from "@/lib/monthly-finance";
import { DashboardTransaction } from "@/lib/types";

type ExportFinancialPdfParams = {
  transactions: DashboardTransaction[];
  periodLabel: string;
  totalIncome: number;
  totalExpense: number;
  totalInvestment?: number;
  balance: number;
  title?: string;
  typeLabel?: string;
  categoryLabel?: string;
  filePrefix?: string;
};

type ExportFinancialPdfResult = {
  ok: boolean;
  status: string;
  alertMessage?: string;
};

const normalizeCategory = (value: string) => {
  const normalized = String(value ?? "").trim();
  return normalized || "Sem categoria";
};

const removeAccents = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const escapePdfText = (value: string) =>
  removeAccents(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, " ");

const fitCell = (value: string, width: number) => {
  const base = removeAccents(String(value ?? "")).replace(/[^\x20-\x7E]/g, " ").trim();
  if (base.length >= width) return `${base.slice(0, Math.max(0, width - 1))} `;
  return base.padEnd(width, " ");
};

const compactCurrency = (amount: number) =>
  Number(amount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

const sortByDateDesc = (transactions: DashboardTransaction[]) =>
  [...transactions].sort((a, b) => {
    const aTime = parseTransactionDate(a.date)?.getTime() ?? 0;
    const bTime = parseTransactionDate(b.date)?.getTime() ?? 0;
    return bTime - aTime;
  });

export function exportFinancialPdf({
  transactions,
  periodLabel,
  totalIncome,
  totalExpense,
  totalInvestment = 0,
  balance,
  title = "RELATORIO FINANCEIRO",
  typeLabel = "Todos",
  categoryLabel = "Todas",
  filePrefix = "relatorio",
}: ExportFinancialPdfParams): ExportFinancialPdfResult {
  if (typeof document === "undefined") {
    return {
      ok: false,
      status: "No app mobile, a exportacao em PDF fica disponivel na versao web.",
      alertMessage: "No app mobile, use a versao web para exportar PDF.",
    };
  }

  if (transactions.length === 0) {
    return {
      ok: false,
      status: "Nao ha dados no filtro selecionado para gerar o PDF.",
      alertMessage: "Nao ha dados neste periodo para exportar.",
    };
  }

  const webEnv = globalThis as {
    document?: {
      body?: { appendChild: (node: unknown) => void; removeChild: (node: unknown) => void };
      createElement?: (tag: string) => {
        href: string;
        download: string;
        click: () => void;
      };
    };
    URL?: { createObjectURL?: (obj: unknown) => string; revokeObjectURL?: (url: string) => void };
    Blob?: typeof Blob;
    TextEncoder?: typeof TextEncoder;
  };

  if (
    !webEnv.document?.createElement ||
    !webEnv.document?.body ||
    !webEnv.URL?.createObjectURL ||
    !webEnv.Blob ||
    !webEnv.TextEncoder
  ) {
    return {
      ok: false,
      status: "A exportacao em PDF nao esta disponivel neste ambiente.",
      alertMessage: "Exportacao PDF indisponivel neste ambiente.",
    };
  }

  const incomeTransactions = sortByDateDesc(
    transactions.filter((transaction) => transaction.type === "income"),
  );
  const expenseTransactions = sortByDateDesc(
    transactions.filter(
      (transaction) =>
        transaction.type === "expense" && !isInvestmentCategory(transaction.category),
    ),
  );
  const investmentTransactions = sortByDateDesc(
    transactions.filter(
      (transaction) =>
        transaction.type === "expense" && isInvestmentCategory(transaction.category),
    ),
  );

  const buildColumnRows = (rows: DashboardTransaction[]) =>
    rows.map((transaction) => {
      const label = transaction.description || normalizeCategory(transaction.category);
      return `${fitCell(label, 24)}${fitCell(`R$ ${compactCurrency(transaction.amount)}`, 16)}`;
    });

  const incomeColumnRows = buildColumnRows(incomeTransactions);
  const expenseColumnRows = buildColumnRows(expenseTransactions);
  const columnRowCount = Math.max(incomeColumnRows.length, expenseColumnRows.length);

  const detailRows = Array.from({ length: columnRowCount }, (_, index) => {
    const incomeRow = incomeColumnRows[index] ?? `${fitCell("", 24)}${fitCell("", 16)}`;
    const expenseRow = expenseColumnRows[index] ?? `${fitCell("", 24)}${fitCell("", 16)}`;
    return `${incomeRow}    ${expenseRow}`;
  });

  const investmentRows = investmentTransactions.map((transaction) => {
    const label = transaction.description || normalizeCategory(transaction.category);
    return `- ${label}: R$ ${compactCurrency(transaction.amount)}`;
  });

  const lines = [
    title,
    `Gerado em ${new Date().toLocaleDateString("pt-BR")}`,
    " ",
    `Periodo: ${periodLabel}`,
    `Tipo: ${typeLabel}`,
    `Categoria: ${categoryLabel}`,
    " ",
    `${fitCell("RECEITAS", 24)}${fitCell("VALOR", 16)}    ${fitCell("DESPESAS", 24)}${fitCell("VALOR", 16)}`,
    "-".repeat(88),
    ...detailRows,
    "-".repeat(88),
    `${fitCell("TOTAL RECEITAS", 24)}${fitCell(`R$ ${compactCurrency(totalIncome)}`, 16)}    ${fitCell("TOTAL DESPESAS", 24)}${fitCell(`R$ ${compactCurrency(totalExpense)}`, 16)}`,
    " ",
    `TOTAL DE INVESTIMENTOS: R$ ${compactCurrency(totalInvestment)}`,
    ...(investmentRows.length > 0 ? ["Investimentos no periodo:"] : []),
    ...investmentRows,
    " ",
    `SALDO FINAL: R$ ${compactCurrency(balance)}`,
  ].slice(0, 46);

  const textStream = [
    "BT",
    "/F1 10 Tf",
    "45 800 Td",
    ...lines.flatMap((line, index) => {
      const escaped = escapePdfText(line);
      if (index === 0) return [`(${escaped}) Tj`];
      return ["0 -15 Td", `(${escaped}) Tj`];
    }),
    "ET",
  ].join("\n");

  const objects: string[] = [];
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  objects.push(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
  );
  objects.push("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n");
  objects.push(`5 0 obj\n<< /Length ${textStream.length} >>\nstream\n${textStream}\nendstream\nendobj\n`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const encoder = new webEnv.TextEncoder();
  const bytes = encoder.encode(pdf);
  const blob = new webEnv.Blob([bytes], { type: "application/pdf" });
  const url = webEnv.URL.createObjectURL(blob);

  const link = webEnv.document.createElement("a");
  link.href = url;
  link.download = `${filePrefix}-${new Date().toISOString().slice(0, 10)}.pdf`;
  webEnv.document.body.appendChild(link);
  link.click();
  webEnv.document.body.removeChild(link);

  setTimeout(() => {
    webEnv.URL?.revokeObjectURL?.(url);
  }, 3000);

  return {
    ok: true,
    status: "PDF gerado com sucesso. Se quiser, voce pode gerar novamente com outros filtros.",
  };
}
