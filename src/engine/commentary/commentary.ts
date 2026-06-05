// ============================================================
// COMMENTARY — Geração de narrativa textual
// Função pura: recebe contexto + RNG, retorna string.
// ============================================================

import type { SeededRandom } from '@/utils/SeededRandom'
import type { Tactics } from '@/types'

export interface CommentaryCtx {
  teamName:      string
  minute:        number
  scoreHome:     number
  scoreAway:     number
  attackerName?: string
  defenderName?: string
  assistName?:   string
  keeperName?:   string
  tactics:       Tactics
}

type Template = (ctx: CommentaryCtx) => string

// ── Templates ────────────────────────────────────────────────

const GOAL: Template[] = [
  c => `${c.attackerName} recebe na área e não perdoa. GOL ${c.teamName.toUpperCase()}!`,
  c => `${c.assistName ? `${c.assistName} lança ` : ''}${c.attackerName} em profundidade. Finalização precisa. GOL!`,
  c => {
    const press = c.tactics.pressIntensity === 'very_high' || c.tactics.pressIntensity === 'high'
    return `${press ? 'A pressão alta funciona. ' : ''}${c.attackerName} finaliza com categoria. GOL!`
  },
  c => `Contra-ataque rápido. ${c.attackerName} entra cara a cara e converte. GOL ${c.teamName}!`,
  c => `Cruzamento na medida. ${c.attackerName} aparece no segundo pau. GOL!`,
]

const MISSED: Template[] = [
  c => `${c.attackerName} cara a cara com o goleiro — chuta para fora! Chance desperdiçada.`,
  c => `Finalização de ${c.attackerName} raspou a trave. Por muito pouco!`,
  c => `${c.attackerName} domina e bate — na trave! O ${c.teamName} fica no quase.`,
  c => `A bola sobrou para ${c.attackerName}, mas o chute saiu fraco. Goleiro faz fácil.`,
]

const SAVE: Template[] = [
  c => `${c.keeperName ?? 'O goleiro'} voa no canto e salva! Defesa espetacular.`,
  c => `Chute forte de ${c.attackerName ?? 'um jogador'}, mas ${c.keeperName ?? 'o goleiro'} espalma.`,
  c => `${c.keeperName ?? 'O goleiro'} estava bem posicionado. Defesa sem chances de gol.`,
]

const PRESSURE: Template[] = [
  c => `O ${c.teamName} pressiona. A bola circula no campo adversário.`,
  c => {
    const highPress = c.tactics.pressIntensity === 'very_high' || c.tactics.pressIntensity === 'high'
    return highPress
      ? `Pressão alta do ${c.teamName}. Recuperação de bola no campo de ataque.`
      : `${c.teamName} troca passes e espera o momento certo.`
  },
  c => `${c.attackerName ?? 'O ataque'} tenta a jogada, mas a marcação fecha bem.`,
]

const YELLOW: Template[] = [
  c => `Falta dura de ${c.defenderName ?? 'um jogador'}. Cartão amarelo mostrado.`,
  c => `${c.defenderName ?? 'Jogador'} reclama demais e leva amarelo do árbitro.`,
]

// ── Funções exportadas ───────────────────────────────────────

function pick(templates: Template[], ctx: CommentaryCtx, rng: SeededRandom): string {
  return rng.pick(templates)(ctx)
}

export const generateGoal     = (ctx: CommentaryCtx, rng: SeededRandom) => pick(GOAL,     ctx, rng)
export const generateMissed   = (ctx: CommentaryCtx, rng: SeededRandom) => pick(MISSED,   ctx, rng)
export const generateSave     = (ctx: CommentaryCtx, rng: SeededRandom) => pick(SAVE,     ctx, rng)
export const generatePressure = (ctx: CommentaryCtx, rng: SeededRandom) => pick(PRESSURE, ctx, rng)
export const generateYellow   = (ctx: CommentaryCtx, rng: SeededRandom) => pick(YELLOW,   ctx, rng)

export function generateHalfTime(scoreH: number, scoreA: number, home: string, away: string): string {
  if (scoreH === scoreA) return `Intervalo: ${home} ${scoreH}–${scoreA} ${away}. Equilíbrio em campo.`
  const leader = scoreH > scoreA ? home : away
  return `Intervalo: ${home} ${scoreH}–${scoreA} ${away}. ${leader} vai na frente para o segundo tempo.`
}

export function generateFullTime(scoreH: number, scoreA: number, home: string, away: string): string {
  if (scoreH === scoreA) return `Fim de jogo! ${home} ${scoreH}–${scoreA} ${away}. Empate.`
  const winner = scoreH > scoreA ? home : away
  return `Fim de jogo! ${home} ${scoreH}–${scoreA} ${away}. Vitória do ${winner}!`
}
