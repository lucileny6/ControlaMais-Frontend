export type EstadoFinanceiro = Record<string, number>

export interface SugestaoFinanceira {
  categoria: string
  percentualReducao: number
  economia: number
}

const DEBUG_IA = false
const MAX_SUGESTOES = 3

export function analisarFinancas(
  estadoInicial: EstadoFinanceiro,
  renda: number,
  despesas: number
): SugestaoFinanceira[] {

  const LIMITE = renda * 0.6

  if (DEBUG_IA) {
    console.log('[IA] Inicio da analise', {
      estadoInicial,
      renda,
      despesas,
      limite: LIMITE,
      excesso: despesas - LIMITE,
    })
  }

  if (despesas <= LIMITE) {
    if (DEBUG_IA) {
      console.log('[IA] Despesas dentro do limite. Nenhuma sugestao necessaria.')
    }
    return []
  }

  const excesso = despesas - LIMITE
  const categoriasOrdenadas = Object.entries(estadoInicial)
    .filter(([, valor]) => valor > 0)
    .sort((a, b) => b[1] - a[1])

  const sugestoes: SugestaoFinanceira[] = []
  let economiaAcumulada = 0

  for (const [categoria, valor] of categoriasOrdenadas) {
    if (sugestoes.length >= MAX_SUGESTOES) break
    if (economiaAcumulada >= excesso) break

    const percentualReducao =
      economiaAcumulada + valor * 0.10 >= excesso ? 10 : 15
    const economia = valor * (percentualReducao / 100)

    sugestoes.push({
      categoria,
      percentualReducao,
      economia,
    })
    economiaAcumulada += economia
  }

  if (DEBUG_IA) {
    console.log('[IA] Sugestoes geradas', {
      excesso,
      economiaAcumulada,
      sugestoes,
    })
  }

  return sugestoes
}

export default analisarFinancas
