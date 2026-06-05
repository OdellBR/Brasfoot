// ============================================================
// WORLD GENERATOR
//
// Gera o "mundo" completo de um novo save:
//   - todos os clubes (a partir dos templates estáticos)
//   - todos os elencos (22 jogadores × 20 clubes)
//
// Determinístico: mesmo saveId → mesmo mundo.
// ============================================================

import { CLUBS_DATA, type ClubTemplate } from '@/data/clubs'
import { generateSquad } from './playerGenerator'
import type { Club, Player } from '@/types'

export interface GeneratedWorld {
  clubs:   Club[]
  players: Player[]   // Todos os jogadores (440 no MVP: 22 × 20)
}

/**
 * Converte um template de clube em entidade Club para o banco.
 */
function templateToClub(template: ClubTemplate, saveId: string): Club {
  return {
    id:           crypto.randomUUID(),
    saveId,
    name:         template.name,
    shortName:    template.shortName,
    fullName:     template.fullName,
    city:         template.city,
    uf:           template.uf,
    colors:       template.colors,
    division:     template.division,
    reputation:   template.reputation,
    finances:     { ...template.finances },
    dynamicState: { ...template.dynamicState },
    boardObjectives: [],
    managerId:    null,
    squadIds:     [],   // Preenchido após geração de jogadores
    youthIds:     [],
  }
}

/**
 * Gera o mundo completo de um save.
 * @param saveId  UUID do save — usado como base para seeds
 * @param year    Ano da temporada
 */
export function generateWorld(saveId: string, year: number): GeneratedWorld {
  // Seed base derivado do saveId para determinismo
  const baseSeed = saveId
    .replace(/-/g, '')
    .slice(0, 8)
    .split('')
    .reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0)

  const clubs:   Club[]   = []
  const players: Player[] = []

  for (const template of CLUBS_DATA) {
    const club = templateToClub(template, saveId)

    // repBonus: clubes de elite têm jogadores melhores (0–3)
    const repBonus = Math.floor((template.reputation.national / 20) * 3)

    const squad = generateSquad(
      saveId,
      club.id,
      year,
      repBonus,
      baseSeed,
    )

    // Vincula elenco ao clube
    club.squadIds = squad.map(p => p.id)

    clubs.push(club)
    players.push(...squad)
  }

  return { clubs, players }
}
