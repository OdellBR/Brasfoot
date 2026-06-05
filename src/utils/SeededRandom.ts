// ============================================================
// SEEDED RANDOM — PRNG Determinístico
//
// Implementa o algoritmo Mulberry32 — simples, rápido,
// suficientemente bom para simulações de jogos.
//
// Por que não Math.random()?
//   - Math.random() não é seedável na Web API
//   - Sem seed = simulação irreproduzível = impossível debugar
//   - Com seed = mesmo input → mesmo output → testável e balanceável
//
// Uso:
//   const rng = new SeededRandom(42)
//   rng.next()        // 0–1 float
//   rng.int(1, 20)    // int entre 1 e 20 (inclusive)
//   rng.pick(array)   // elemento aleatório
//   rng.shuffle(arr)  // embaralha (retorna novo array)
//
// A engine recebe um SeededRandom e o usa para TODA aleatoriedade.
// Nenhum módulo da engine chama Math.random() diretamente.
// ============================================================

export class SeededRandom {
  private state: number
  readonly seed: number

  constructor(seed?: number) {
    // Se não passar seed, gera um baseado no timestamp
    this.seed  = seed ?? (Date.now() ^ (Math.random() * 0x100000000))
    this.state = this.seed >>> 0  // uint32
  }

  /** Retorna float em [0, 1) */
  next(): number {
    // Mulberry32
    let z = (this.state += 0x6d2b79f5)
    z = Math.imul(z ^ (z >>> 15), z | 1)
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61)
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000
  }

  /** Inteiro em [min, max] inclusive */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  /** Float em [min, max) */
  float(min: number, max: number): number {
    return this.next() * (max - min) + min
  }

  /** Escolhe um elemento aleatório do array */
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)]
  }

  /** Embaralha (Fisher-Yates) — retorna novo array */
  shuffle<T>(arr: T[]): T[] {
    const result = [...arr]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }

  /** Retorna true com probabilidade p (0–1) */
  chance(p: number): boolean {
    return this.next() < p
  }

  /**
   * Cria um sub-RNG derivado do seed atual.
   * Útil para gerar dados de jogadores independentes
   * do estado da partida, sem afetar a sequência principal.
   */
  derive(offset: number): SeededRandom {
    return new SeededRandom(this.seed ^ (offset * 0x9e3779b9))
  }
}
