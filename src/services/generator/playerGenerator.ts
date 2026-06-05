// ============================================================
// PLAYER GENERATOR
//
// Gera jogadores fictícios com nomes brasileiros realistas.
// Usa SeededRandom: mesma seed → mesmo elenco sempre.
// Isso garante que saves sejam reproduzíveis.
// ============================================================

import { SeededRandom } from '@/utils/SeededRandom'
import { clamp } from '@/utils'
import type {
  Player, Position, Foot, PersonalityTrait,
  PlayerAttributes, PlayerHiddenAttributes,
  PlayerDynamicState, PlayerContract, ScoutingReveal,
} from '@/types'

// ── Dados para geração ───────────────────────────────────────

const FIRST_NAMES = [
  'Gabriel', 'Lucas', 'Mateus', 'Rafael', 'Felipe', 'Bruno', 'Diego',
  'Carlos', 'Anderson', 'Rodrigo', 'Thiago', 'Leandro', 'Vinícius',
  'Gustavo', 'Fernando', 'Marcelo', 'Patrick', 'Wesley', 'Caio',
  'Danilo', 'Éverton', 'Fabrício', 'Henrique', 'Igor', 'João',
  'Kevin', 'Leonardo', 'Murilo', 'Natan', 'Oscar', 'Paulo',
  'Renan', 'Samuel', 'Tiago', 'Ulisses', 'Vágner', 'William',
]

const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Ferreira',
  'Costa', 'Alves', 'Pereira', 'Rodrigues', 'Martins', 'Carvalho',
  'Gomes', 'Ribeiro', 'Barbosa', 'Nascimento', 'Araújo', 'Cardoso',
  'Dias', 'Mendes', 'Freitas', 'Teixeira', 'Lopes', 'Moreira',
  'Rocha', 'Correia', 'Pinto', 'Nunes', 'Campos', 'Machado',
]

const PERSONALITIES: PersonalityTrait[] = [
  'leader', 'professional', 'temperamental', 'ambitious', 'loyal', 'mercenary',
]

// Distribuição de personalidades (algumas mais raras)
const PERSONALITY_WEIGHTS = [10, 30, 15, 20, 15, 10]

// Posições por slot na escalação 4-3-3 base
const SQUAD_POSITIONS: Position[] = [
  'GK',                          // 1 goleiro
  'CB', 'CB', 'LB', 'RB',        // 4 defensores
  'CDM', 'CM', 'CM',             // 3 meios
  'LW', 'ST', 'RW',              // 3 atacantes
  // Reservas (11–22)
  'GK',
  'CB', 'LB',
  'CDM', 'CAM',
  'LW', 'RW', 'ST',
  'CM', 'CF',
]

// Faixas de atributos por posição (min, max base, peso de cada atributo)
interface AttrProfile {
  finishing:   [number, number]
  passing:     [number, number]
  speed:       [number, number]
  marking:     [number, number]
  physicality: [number, number]
  technique:   [number, number]
  mental:      [number, number]
}

const PROFILES: Record<string, AttrProfile> = {
  GK:  { finishing:[2,6],  passing:[5,11], speed:[5,11], marking:[10,17], physicality:[9,15], technique:[7,13], mental:[10,17] },
  CB:  { finishing:[2,7],  passing:[5,12], speed:[6,13], marking:[11,18], physicality:[11,17],technique:[6,13], mental:[9,16]  },
  LB:  { finishing:[3,8],  passing:[7,14], speed:[10,17],marking:[9,16],  physicality:[8,14], technique:[7,14], mental:[8,14]  },
  RB:  { finishing:[3,8],  passing:[7,14], speed:[10,17],marking:[9,16],  physicality:[8,14], technique:[7,14], mental:[8,14]  },
  CDM: { finishing:[3,9],  passing:[8,15], speed:[7,13], marking:[10,17], physicality:[10,16],technique:[8,15], mental:[10,16] },
  CM:  { finishing:[5,11], passing:[9,16], speed:[7,14], marking:[7,14],  physicality:[8,14], technique:[9,16], mental:[9,16]  },
  CAM: { finishing:[7,14], passing:[10,17],speed:[8,15], marking:[4,10],  physicality:[6,13], technique:[10,17],mental:[9,16]  },
  LM:  { finishing:[6,13], passing:[8,15], speed:[10,17],marking:[5,12],  physicality:[7,14], technique:[8,15], mental:[8,14]  },
  RM:  { finishing:[6,13], passing:[8,15], speed:[10,17],marking:[5,12],  physicality:[7,14], technique:[8,15], mental:[8,14]  },
  LW:  { finishing:[8,15], passing:[7,14], speed:[11,18],marking:[3,9],   physicality:[6,13], technique:[9,16], mental:[8,15]  },
  RW:  { finishing:[8,15], passing:[7,14], speed:[11,18],marking:[3,9],   physicality:[6,13], technique:[9,16], mental:[8,15]  },
  ST:  { finishing:[11,18],passing:[5,13], speed:[9,16], marking:[2,8],   physicality:[8,15], technique:[8,15], mental:[9,16]  },
  CF:  { finishing:[10,17],passing:[7,14], speed:[8,15], marking:[3,9],   physicality:[7,14], technique:[9,16], mental:[9,16]  },
}

// ── Helpers ──────────────────────────────────────────────────

function pickWeighted<T>(items: T[], weights: number[], rng: SeededRandom): T {
  const total  = weights.reduce((a, b) => a + b, 0)
  let   cursor = rng.next() * total
  for (let i = 0; i < items.length; i++) {
    cursor -= weights[i]
    if (cursor <= 0) return items[i]
  }
  return items[items.length - 1]
}

function genAttr(range: [number, number], repBonus: number, rng: SeededRandom): number {
  const [min, max] = range
  const base = rng.int(min, max) + Math.round(repBonus)
  return clamp(base, 1, 20)
}

function genAttributes(pos: Position, repBonus: number, rng: SeededRandom): PlayerAttributes {
  const profile = PROFILES[pos] ?? PROFILES['CM']
  return {
    finishing:   genAttr(profile.finishing,   repBonus, rng),
    passing:     genAttr(profile.passing,     repBonus, rng),
    speed:       genAttr(profile.speed,       repBonus, rng),
    marking:     genAttr(profile.marking,     repBonus, rng),
    physicality: genAttr(profile.physicality, repBonus, rng),
    technique:   genAttr(profile.technique,   repBonus, rng),
    mental:      genAttr(profile.mental,      repBonus, rng),
  }
}

function genHidden(rng: SeededRandom): PlayerHiddenAttributes {
  return {
    potential:   rng.int(8, 20),
    consistency: rng.int(5, 18),
    personality: pickWeighted(PERSONALITIES, PERSONALITY_WEIGHTS, rng),
  }
}

function genAge(rng: SeededRandom): number {
  // Distribuição realista: mais jogadores entre 20-30
  const roll = rng.next()
  if (roll < 0.15) return rng.int(17, 20)  // Jovens
  if (roll < 0.75) return rng.int(21, 28)  // Prime
  if (roll < 0.92) return rng.int(29, 32)  // Experientes
  return rng.int(33, 36)                    // Veteranos
}

function genSalary(ovr: number, repBonus: number, rng: SeededRandom): number {
  // Salário semanal baseado no overall geral
  const base = Math.pow(ovr, 2.2) * 80
  const variance = 0.8 + rng.next() * 0.4
  const repMultiplier = 1 + repBonus * 0.08
  return Math.round(base * variance * repMultiplier / 100) * 100
}

// Calcula overall simplificado para fins de salário
function simpleOverall(attrs: PlayerAttributes): number {
  const vals = Object.values(attrs) as number[]
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

// ── Gerador principal ─────────────────────────────────────────

export interface GeneratePlayerOptions {
  saveId:     string
  clubId:     string
  position:   Position
  number:     number
  seasonYear: number
  repBonus:   number   // 0–3: bônus de clube de reputação alta
  rng:        SeededRandom
}

export function generatePlayer(opts: GeneratePlayerOptions): Player {
  const { saveId, clubId, position, number, seasonYear, repBonus, rng } = opts

  const firstName = rng.pick(FIRST_NAMES)
  const lastName  = rng.pick(LAST_NAMES)
  const name      = `${firstName} ${lastName}`
  const age       = genAge(rng)
  const foot: Foot = rng.chance(0.8) ? 'right' : rng.chance(0.5) ? 'left' : 'both'

  const attributes = genAttributes(position, repBonus, rng)
  const hidden     = genHidden(rng)
  const ovr        = simpleOverall(attributes)
  const salary     = genSalary(ovr, repBonus, rng)

  const dynamicState: PlayerDynamicState = {
    morale:               70,
    stamina:              100,
    form:                 50 + rng.int(0, 30),
    injuryWeeksRemaining: 0,
  }

  const contract: PlayerContract = {
    clubId,
    salary,
    expiresAt: `${seasonYear + rng.int(0, 2)}-12-31`,
    signedAt:  `${seasonYear - rng.int(0, 2)}-01-01`,
  }

  const scoutingReveal: ScoutingReveal = {
    potential:   0,
    consistency: 0,
    personality: 0,
  }

  return {
    id:           crypto.randomUUID(),
    saveId,
    name,
    age,
    nationality:  'BR',
    position,
    foot,
    number,
    attributes,
    hidden,
    dynamicState,
    contract,
    scoutingReveal,
  }
}

/**
 * Gera os 22 jogadores de um clube.
 * Usa seed derivado do clubId para que cada clube
 * tenha sempre os mesmos jogadores com o mesmo save seed.
 */
export function generateSquad(
  saveId:     string,
  clubId:     string,
  seasonYear: number,
  repBonus:   number,
  baseSeed:   number,
): Player[] {
  // Seed derivado: mesmo baseSeed + clubId → sempre mesmo elenco
  const clubSeedOffset = clubId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const rng = new SeededRandom(baseSeed ^ clubSeedOffset)

  return SQUAD_POSITIONS.map((position, idx) =>
    generatePlayer({
      saveId,
      clubId,
      position,
      number: idx + 1,
      seasonYear,
      repBonus,
      rng,
    })
  )
}
