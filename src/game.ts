export type Terrain = 'desert' | 'forest' | 'mountain' | 'water' | 'any'
export type Letter = 'A' | 'B' | 'C' | 'D' | 'E'
export type PlayerMode = 'solo' | 'small' | 'large'

export const LETTERS: Letter[] = ['A', 'B', 'C', 'D', 'E']
export const DECK_COUNTS: Record<Terrain, number> = { desert: 8, forest: 7, mountain: 6, water: 4, any: 2 }
export const TURNS_PER_ROUND = 13
export const DECK_SIZE = Object.values(DECK_COUNTS).reduce((a, b) => a + b, 0)
export type Rounds = 2 | 3

/** Bonus values per letter: [#1 card, #2 card] */
export const BONUS: Record<Letter, [number, number]> = {
  A: [3, 2],
  B: [4, 2],
  C: [5, 3],
  D: [6, 4],
  E: [7, 5],
}

export const MODE_LABEL: Record<PlayerMode, string> = { solo: 'Solo', small: '2–4', large: '5–8' }

export interface Game {
  id: number
  mode: PlayerMode
  decks: Terrain[][] // one shuffled deck per round (length = number of rounds)
  step: number // 0..totalTurns(game) (totalTurns = game over)
  claimed: Record<Letter, number> // bonus cards taken per letter
  villages: Letter[] // set-up card: 10 letters, read clockwise from the top
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function fullDeck(): Terrain[] {
  return (Object.keys(DECK_COUNTS) as Terrain[]).flatMap((t) => Array(DECK_COUNTS[t]).fill(t))
}

/** Random set-up card: two of each letter, no identical letters next to each other (circularly). */
export function setupCard(): Letter[] {
  for (;;) {
    const c = shuffle([...LETTERS, ...LETTERS])
    if (c.every((l, i) => l !== c[(i + 1) % c.length])) return c
  }
}

export const totalTurns = (game: Game) => game.decks.length * TURNS_PER_ROUND

export function newGame(mode: PlayerMode, rounds: Rounds): Game {
  return {
    id: Date.now(),
    mode,
    decks: Array.from({ length: rounds }, () => shuffle(fullDeck())),
    step: 0,
    claimed: { A: 0, B: 0, C: 0, D: 0, E: 0 },
    villages: setupCard(),
  }
}

export function turnInfo(step: number) {
  const round = Math.floor(step / TURNS_PER_ROUND)
  const turn = step % TURNS_PER_ROUND
  return { round, turn }
}

export function cardsAt(game: Game, step: number): [Terrain, Terrain] {
  const { round, turn } = turnInfo(step)
  const deck = game.decks[round]
  return [deck[turn * 2], deck[turn * 2 + 1]]
}

/** Values of the bonus stack for a letter, top first. */
export function bonusStack(mode: PlayerMode, letter: Letter): { value: number; label: string }[] {
  const [one, two] = BONUS[letter]
  if (mode === 'solo') return [{ value: two, label: '#2' }]
  if (mode === 'small') return [{ value: one, label: '#1' }]
  return [
    { value: one, label: '#1' },
    { value: two, label: '#2' },
  ]
}

const KEY = 'toucana:v1'

export function load(): Game | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Game) : null
  } catch {
    return null
  }
}

export function save(game: Game | null) {
  try {
    if (game) localStorage.setItem(KEY, JSON.stringify(game))
    else localStorage.removeItem(KEY)
  } catch {
    /* storage unavailable */
  }
}
