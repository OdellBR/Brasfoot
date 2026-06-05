// ============================================================
// UTILS — Funções puras utilitárias
// Sem dependências de React ou estado global
// ============================================================

/**
 * Gera UUID v4 simples usando crypto API
 */
export function uuid(): string {
  return crypto.randomUUID()
}

/**
 * Clamp um valor entre min e max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Número aleatório inteiro entre min e max (inclusive)
 */
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Número aleatório float entre min e max
 */
export function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

/**
 * Escolhe um elemento aleatório de um array
 */
export function sample<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Embaralha um array (Fisher-Yates)
 */
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Formata valor monetário em reais
 */
export function formatMoney(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `R$ ${(value / 1_000).toFixed(0)}K`
  return `R$ ${value.toFixed(0)}`
}

/**
 * Calcula a média de um array de números
 */
export function average(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

/**
 * Retorna a força geral de um jogador (média ponderada por posição)
 * Usado pela match engine
 */
export function playerOverall(
  attrs: {
    finishing: number
    passing: number
    speed: number
    marking: number
    physicality: number
    technique: number
    mental: number
  },
  position: string
): number {
  const { finishing, passing, speed, marking, physicality, technique, mental } = attrs

  if (position === 'GK') {
    return average([marking, physicality, mental, technique])
  }
  if (['CB', 'LB', 'RB'].includes(position)) {
    return average([marking * 1.5, physicality, speed, mental, technique]) / 1.1
  }
  if (['CDM', 'CM'].includes(position)) {
    return average([passing, marking, mental, technique, physicality])
  }
  if (['CAM', 'LM', 'RM', 'LW', 'RW'].includes(position)) {
    return average([passing, technique, speed, mental, finishing * 0.8]) / 0.96
  }
  // ST, CF
  return average([finishing * 1.5, speed, technique, mental, passing * 0.6]) / 1.1
}

/**
 * Adiciona variação aleatória a um valor base (para simular consistência)
 */
export function withVariance(base: number, consistency: number): number {
  // consistency 1–20: alta = menos variação
  const variance = (20 - consistency) / 20 * 0.15  // máximo 15% de variação
  const noise = (Math.random() * 2 - 1) * variance
  return clamp(base * (1 + noise), 1, 20)
}

// Re-export SeededRandom for convenience
export { SeededRandom } from './SeededRandom'
