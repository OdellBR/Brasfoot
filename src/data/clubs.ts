// ============================================================
// DADOS ESTÁTICOS DE CLUBES
//
// 20 clubes fictícios inspirados no futebol brasileiro.
// Estes são TEMPLATES — ao criar um save, o gameService
// injeta o saveId e gera o id com uuid().
//
// A separação template/entidade evita ter dados estáticos
// poluídos com ids de save específicos.
// ============================================================

import type { ClubFinances, ClubReputation, ClubDynamicState, Division } from '@/types'

export interface ClubTemplate {
  name:        string
  shortName:   string
  fullName:    string
  city:        string
  uf:          string
  colors:      { primary: string; secondary: string }
  division:    Division
  reputation:  ClubReputation
  finances:    ClubFinances
  dynamicState:ClubDynamicState
}

// ── Helpers para reduzir repetição ──────────────────────────

function makeFinances(tier: 'elite' | 'grande' | 'medio' | 'pequeno'): ClubFinances {
  const map: Record<string, ClubFinances> = {
    elite:   { balance: 80_000_000, transferBudget: 30_000_000, wageBudget: 600_000, weeklyWages: 400_000, sponsorIncome: 300_000, matchdayIncome: 1_200_000, debt: 0 },
    grande:  { balance: 40_000_000, transferBudget: 15_000_000, wageBudget: 350_000, weeklyWages: 250_000, sponsorIncome: 150_000, matchdayIncome: 700_000,   debt: 5_000_000 },
    medio:   { balance: 15_000_000, transferBudget:  6_000_000, wageBudget: 180_000, weeklyWages: 130_000, sponsorIncome:  70_000, matchdayIncome: 350_000,   debt: 8_000_000 },
    pequeno: { balance:  5_000_000, transferBudget:  2_000_000, wageBudget:  80_000, weeklyWages:  60_000, sponsorIncome:  30_000, matchdayIncome: 150_000,   debt: 12_000_000 },
  }
  return map[tier]
}

function makeRep(national: number, regional: number, fanbase: number, stadiumSize: number): ClubReputation {
  return { national, regional, fanbase, stadiumSize }
}

function makeState(): ClubDynamicState {
  return { morale: 70, boardConfidence: 70, fanMood: 65, currentStreak: 0 }
}

// ── Série A ─────────────────────────────────────────────────

export const CLUBS_DATA: ClubTemplate[] = [
  {
    name: 'Atlético Vermelho',  shortName: 'AVE', fullName: 'Atlético Vermelho Esporte Clube',
    city: 'São Paulo',     uf: 'SP',
    colors: { primary: '#c0392b', secondary: '#ffffff' },
    division: 'primeira', reputation: makeRep(18, 20, 35000, 80000),
    finances: makeFinances('elite'), dynamicState: makeState(),
  },
  {
    name: 'Esporte Rio',       shortName: 'ERJ', fullName: 'Esporte Clube Rio',
    city: 'Rio de Janeiro', uf: 'RJ',
    colors: { primary: '#2980b9', secondary: '#e74c3c' },
    division: 'primeira', reputation: makeRep(17, 20, 30000, 70000),
    finances: makeFinances('elite'), dynamicState: makeState(),
  },
  {
    name: 'Mineiro FC',        shortName: 'MIN', fullName: 'Mineiro Futebol Clube',
    city: 'Belo Horizonte', uf: 'MG',
    colors: { primary: '#2c3e50', secondary: '#f1c40f' },
    division: 'primeira', reputation: makeRep(16, 20, 25000, 65000),
    finances: makeFinances('elite'), dynamicState: makeState(),
  },
  {
    name: 'Gaúcho Sport',      shortName: 'GAU', fullName: 'Gaúcho Sport Club',
    city: 'Porto Alegre',   uf: 'RS',
    colors: { primary: '#8e44ad', secondary: '#f39c12' },
    division: 'primeira', reputation: makeRep(15, 20, 22000, 60000),
    finances: makeFinances('grande'), dynamicState: makeState(),
  },
  {
    name: 'Nordestino Atlético', shortName: 'NOR', fullName: 'Nordestino Atlético Clube',
    city: 'Fortaleza',      uf: 'CE',
    colors: { primary: '#e74c3c', secondary: '#000000' },
    division: 'primeira', reputation: makeRep(14, 18, 18000, 55000),
    finances: makeFinances('grande'), dynamicState: makeState(),
  },
  {
    name: 'Carioca FC',        shortName: 'CAR', fullName: 'Carioca Futebol Clube',
    city: 'Rio de Janeiro', uf: 'RJ',
    colors: { primary: '#1abc9c', secondary: '#2c3e50' },
    division: 'primeira', reputation: makeRep(14, 18, 16000, 50000),
    finances: makeFinances('grande'), dynamicState: makeState(),
  },
  {
    name: 'Pantaneiro EC',     shortName: 'PAN', fullName: 'Pantaneiro Esporte Clube',
    city: 'Campo Grande',   uf: 'MS',
    colors: { primary: '#27ae60', secondary: '#f39c12' },
    division: 'primeira', reputation: makeRep(12, 16, 12000, 40000),
    finances: makeFinances('medio'), dynamicState: makeState(),
  },
  {
    name: 'Baiano Atlético',   shortName: 'BAI', fullName: 'Baiano Atlético Clube',
    city: 'Salvador',       uf: 'BA',
    colors: { primary: '#d35400', secondary: '#2c3e50' },
    division: 'primeira', reputation: makeRep(13, 17, 14000, 45000),
    finances: makeFinances('grande'), dynamicState: makeState(),
  },
  {
    name: 'Serra FC',          shortName: 'SER', fullName: 'Serra Futebol Clube',
    city: 'Curitiba',       uf: 'PR',
    colors: { primary: '#16a085', secondary: '#ffffff' },
    division: 'primeira', reputation: makeRep(11, 15, 10000, 35000),
    finances: makeFinances('medio'), dynamicState: makeState(),
  },
  {
    name: 'Paulistano EC',     shortName: 'PAU', fullName: 'Paulistano Esporte Clube',
    city: 'Campinas',       uf: 'SP',
    colors: { primary: '#2c3e50', secondary: '#e74c3c' },
    division: 'primeira', reputation: makeRep(12, 16, 11000, 38000),
    finances: makeFinances('medio'), dynamicState: makeState(),
  },
  {
    name: 'Capixaba SC',       shortName: 'CAP', fullName: 'Capixaba Sport Club',
    city: 'Vitória',        uf: 'ES',
    colors: { primary: '#8e44ad', secondary: '#ffffff' },
    division: 'primeira', reputation: makeRep(10, 13, 8000, 28000),
    finances: makeFinances('medio'), dynamicState: makeState(),
  },
  {
    name: 'Nortão FC',         shortName: 'NTC', fullName: 'Nortão Futebol Clube',
    city: 'Belém',          uf: 'PA',
    colors: { primary: '#2980b9', secondary: '#f1c40f' },
    division: 'primeira', reputation: makeRep(9, 13, 7000, 25000),
    finances: makeFinances('medio'), dynamicState: makeState(),
  },

  // ── Série B ───────────────────────────────────────────────
  {
    name: 'Fluminense do Norte', shortName: 'FLN', fullName: 'Fluminense do Norte Atlético',
    city: 'Manaus',         uf: 'AM',
    colors: { primary: '#27ae60', secondary: '#2c3e50' },
    division: 'segunda', reputation: makeRep(7, 12, 5000, 20000),
    finances: makeFinances('pequeno'), dynamicState: makeState(),
  },
  {
    name: 'Rio Grande EC',     shortName: 'RGE', fullName: 'Rio Grande Esporte Clube',
    city: 'Natal',          uf: 'RN',
    colors: { primary: '#e74c3c', secondary: '#f1c40f' },
    division: 'segunda', reputation: makeRep(6, 11, 4000, 18000),
    finances: makeFinances('pequeno'), dynamicState: makeState(),
  },
  {
    name: 'Catarinense FC',    shortName: 'CAT', fullName: 'Catarinense Futebol Clube',
    city: 'Florianópolis',  uf: 'SC',
    colors: { primary: '#3498db', secondary: '#ffffff' },
    division: 'segunda', reputation: makeRep(8, 13, 6000, 22000),
    finances: makeFinances('pequeno'), dynamicState: makeState(),
  },
  {
    name: 'Cerrado Atlético',  shortName: 'CER', fullName: 'Cerrado Atlético Clube',
    city: 'Brasília',       uf: 'DF',
    colors: { primary: '#1abc9c', secondary: '#8e44ad' },
    division: 'segunda', reputation: makeRep(7, 10, 4500, 18000),
    finances: makeFinances('pequeno'), dynamicState: makeState(),
  },
  {
    name: 'Sertanejo SC',      shortName: 'SET', fullName: 'Sertanejo Sport Club',
    city: 'Feira de Santana', uf: 'BA',
    colors: { primary: '#d35400', secondary: '#f1c40f' },
    division: 'segunda', reputation: makeRep(5, 9, 3000, 15000),
    finances: makeFinances('pequeno'), dynamicState: makeState(),
  },
  {
    name: 'Tocantins EC',      shortName: 'TOC', fullName: 'Tocantins Esporte Clube',
    city: 'Palmas',         uf: 'TO',
    colors: { primary: '#2c3e50', secondary: '#27ae60' },
    division: 'segunda', reputation: makeRep(4, 8, 2500, 12000),
    finances: makeFinances('pequeno'), dynamicState: makeState(),
  },
  {
    name: 'Rondônia FC',       shortName: 'RON', fullName: 'Rondônia Futebol Clube',
    city: 'Porto Velho',    uf: 'RO',
    colors: { primary: '#8e44ad', secondary: '#f39c12' },
    division: 'segunda', reputation: makeRep(3, 7, 2000, 10000),
    finances: makeFinances('pequeno'), dynamicState: makeState(),
  },
  {
    name: 'Pernambuco EC',     shortName: 'PER', fullName: 'Pernambuco Esporte Clube',
    city: 'Recife',         uf: 'PE',
    colors: { primary: '#c0392b', secondary: '#f1c40f' },
    division: 'segunda', reputation: makeRep(9, 14, 7000, 25000),
    finances: makeFinances('medio'), dynamicState: makeState(),
  },
]
