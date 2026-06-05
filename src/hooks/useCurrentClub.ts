// ============================================================
// useCurrentClub
//
// Hook que expõe o clube do jogador com seletores granulares.
// Evitar importar o store inteiro em componentes que precisam
// apenas de um campo.
// ============================================================

import { useGameStore } from '@/store/useGameStore'

export function useCurrentClub() {
  return useGameStore(s => s.playerClub)
}

export function useCurrentClubId() {
  return useGameStore(s => s.playerClub?.id)
}

export function useCurrentClubName() {
  return useGameStore(s => s.playerClub?.name)
}

export function useCurrentClubFinances() {
  return useGameStore(s => s.playerClub?.finances)
}

export function useCurrentClubDynamicState() {
  return useGameStore(s => s.playerClub?.dynamicState)
}
