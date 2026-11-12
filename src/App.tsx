import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Flag, Hourglass, MapPin, RotateCcw, Undo2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BonusCard, CardBack, RedBonusCard, SetupCard, TerrainCard, type Dir } from './Cards'
import {
  cardsAt,
  DECK_SIZE,
  LETTERS,
  load,
  MODE_LABEL,
  newGame,
  save,
  setupCard,
  totalTurns,
  TURNS_PER_ROUND,
  turnInfo,
  type Game,
  type Letter,
  type PlayerMode,
  type Rounds,
} from './game'
import { playDraw, playFlip, playGameEnd, playRoundEnd, playUndo } from './sound'
import { useWakeLock } from './useWakeLock'

export default function App() {
  const [game, setGame] = useState<Game | null>(() => load())
  const [playing, setPlaying] = useState(false)
  const [fresh, setFresh] = useState(false)

  useWakeLock(playing)
  useEffect(() => save(game), [game])

  const start = (mode: PlayerMode, rounds: Rounds) => {
    playDraw()
    setGame(newGame(mode, rounds))
    setFresh(true)
    setPlaying(true)
  }

  return (
    <AnimatePresence mode="wait">
      {playing && game ? (
        <Table
          key="table"
          game={game}
          setGame={setGame}
          showSetupFirst={fresh}
          onNewGame={() => {
            setGame(null)
            setPlaying(false)
          }}
        />
      ) : (
        <Splash
          key="splash"
          saved={game}
          onStart={start}
          onContinue={() => {
            setFresh(false)
            setPlaying(true)
          }}
        />
      )}
    </AnimatePresence>
  )
}

/* ---------------- Splash ---------------- */

/** Pause before the splash animation starts (seconds). */
const SPLASH_DELAY = 0.5

function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; text: string; sub?: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} role="radio" aria-checked={value === o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.text}
          {o.sub && <small> {o.sub}</small>}
        </button>
      ))}
    </div>
  )
}

function Splash({
  saved,
  onStart,
  onContinue,
}: {
  saved: Game | null
  onStart: (m: PlayerMode, r: Rounds) => void
  onContinue: () => void
}) {
  const [mode, setMode] = useState<PlayerMode>(saved?.mode ?? 'small')
  const [rounds, setRounds] = useState<Rounds>((saved?.decks.length as Rounds) ?? 2)
  const canContinue = !!saved && saved.step < totalTurns(saved)
  const [setupOpen, setSetupOpen] = useState(!canContinue)
  // Pulsing ring: animates only transform/opacity so it stays on the GPU.
  const ring = (
    <motion.span
      className="pulse-ring"
      aria-hidden
      animate={{ scale: [1, 1.25], opacity: [0.6, 0] }}
      transition={{ repeat: Infinity, duration: 1.6, ease: 'easeOut' }}
    />
  )

  return (
    <motion.main
      className="splash"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.08, transition: { duration: 0.35 } }}
    >
      <div className="splash-cards" aria-hidden>
        {[-24, -8, 8, 24].map((r, i) => (
          <motion.div
            key={r}
            className="card splash-card"
            initial={{ y: 300, rotate: 0, opacity: 0 }}
            animate={{ y: 0, rotate: r, x: r * 2.5, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 90, damping: 14, delay: SPLASH_DELAY + 0.15 + i * 0.1 }}
          >
            <CardBack standalone />
          </motion.div>
        ))}
      </div>

      <motion.h1
        className="title"
        initial={{ y: 40, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 12, delay: SPLASH_DELAY + 0.6 }}
      >
        Toucana
      </motion.h1>

      <motion.div
        className="splash-controls"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: SPLASH_DELAY + 0.9 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {setupOpen ? (
            <motion.div key="setup" className="splash-controls" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Segmented
                label="Players"
                value={mode}
                onChange={setMode}
                options={(['solo', 'small', 'large'] as PlayerMode[]).map((m) => ({
                  value: m,
                  text: MODE_LABEL[m],
                  sub: m === 'solo' ? undefined : 'players',
                }))}
              />
              <Segmented
                label="Rounds"
                value={rounds}
                onChange={setRounds}
                options={[
                  { value: 2 as Rounds, text: '2', sub: 'rounds' },
                  { value: 3 as Rounds, text: '3', sub: 'rounds' },
                ]}
              />
              <motion.button className="start-btn" whileTap={{ scale: 0.94 }} onClick={() => onStart(mode, rounds)}>
                {ring}
                Start
              </motion.button>
              {canContinue && (
                <button className="link-btn" onClick={() => setSetupOpen(false)}>
                  Back
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div key="continue" className="splash-controls" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <motion.button className="start-btn continue-btn" whileTap={{ scale: 0.94 }} onClick={onContinue}>
                {ring}
                Continue
                <span className="resume-info">
                  Round {turnInfo(saved!.step).round + 1}/{saved!.decks.length} · Turn {turnInfo(saved!.step).turn + 1}
                </span>
              </motion.button>
              <button className="link-btn" onClick={() => setSetupOpen(true)}>
                New game
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.main>
  )
}

/* ---------------- Table ---------------- */

function Table({
  game,
  setGame,
  showSetupFirst,
  onNewGame,
}: {
  game: Game
  setGame: (g: Game) => void
  showSetupFirst: boolean
  onNewGame: () => void
}) {
  const [dir, setDir] = useState<Dir>(1)
  const [confirmNew, setConfirmNew] = useState(false)
  const [showVillages, setShowVillages] = useState(showSetupFirst)

  const total = totalTurns(game)
  const over = game.step >= total
  const { round, turn } = turnInfo(Math.min(game.step, total - 1))
  const cards = over ? null : cardsAt(game, game.step)
  const leftInDeck = over ? 0 : DECK_SIZE - (turn + 1) * 2

  const lastTurnOfRound = !over && turn === TURNS_PER_ROUND - 1
  const finalRound = round === game.decks.length - 1
  const [roundEnd, setRoundEnd] = useState(false)

  const go = (d: Dir, confirmed = false) => {
    const step = game.step + d
    if (step < 0 || step > total) return
    // Leaving the last turn of a round needs an explicit confirm (scoring happens here).
    if (d === 1 && lastTurnOfRound && !confirmed) {
      navigator.vibrate?.([20, 60, 20])
      if (finalRound) playGameEnd()
      else playRoundEnd()
      setRoundEnd(true)
      return
    }
    setRoundEnd(false)
    setDir(d)
    navigator.vibrate?.(12)
    if (d === -1) playUndo()
    else if (step < total) playDraw()
    setGame({ ...game, step })
  }

  const tapBonus = (l: Letter) => {
    const max = game.mode === 'large' ? 2 : 1
    const next = game.claimed[l] >= max ? 0 : game.claimed[l] + 1
    playFlip()
    setGame({ ...game, claimed: { ...game.claimed, [l]: next } })
  }

  // Position of a bonus card among the claimed ones to its left (drives the load-time flip order).
  const claimedFlags = [...LETTERS.map((l) => game.claimed[l] > 0), ...(game.red ?? []).map((_, i) => !!game.redClaimed?.[i])]
  const claimedBefore = (pos: number) => claimedFlags.slice(0, pos).filter(Boolean).length

  const tapRed = (i: number) => {
    const redClaimed = [...(game.redClaimed ?? [false, false])]
    redClaimed[i] = !redClaimed[i]
    playFlip()
    setGame({ ...game, redClaimed })
  }

  return (
    <motion.main className="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <header className="topbar">
        <div className="status">
          <span className="round">
            Round {round + 1}/{game.decks.length}
          </span>
          <span className="turn">
            Turn {over ? TURNS_PER_ROUND : turn + 1}/{TURNS_PER_ROUND}
          </span>
        </div>
        <div className="deck-pile" aria-label={`${leftInDeck} cards left`}>
          <div className="card mini">
            <CardBack small standalone />
          </div>
          <span>{leftInDeck}</span>
        </div>
        <motion.button
          className="card mini setup-mini"
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowVillages(true)}
          aria-label="Village set-up card"
        >
          <MapPin size={18} />
        </motion.button>
        <button className="icon-btn new-game" onClick={() => setConfirmNew(true)} aria-label="New game">
          <RotateCcw size={20} />
        </button>
      </header>

      <section className="play-area">

        <div className="terrain-row">
          {!over && (
            <>
              <div className="card-shadow" style={{ gridColumn: 1 }} />
              <div className="card-shadow" style={{ gridColumn: 2 }} />
            </>
          )}
          <AnimatePresence custom={dir} initial={true}>
            {cards?.map((t, i) => <TerrainCard key={`${game.step}-${i}`} terrain={t} index={i} dir={dir} />)}
          </AnimatePresence>
          <AnimatePresence>
            {over && (
              <motion.div className="game-over" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}>
                <h2>Game over</h2>
                <p>Score sights, villages & bonuses.</p>
                <button className="start-btn small" onClick={onNewGame}>
                  New game
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {lastTurnOfRound && (
            <motion.div
              key={round}
              className="last-turn"
              initial={{ y: -12, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: [1, 1.04, 1] }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ scale: { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } }}
            >
              <Hourglass size={18} strokeWidth={2.5} />
              Last card left — {finalRound ? 'game' : 'round'} end in sight
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="bonus-row" aria-label="Connection bonuses">
        <h3>First to connect</h3>
        <div className="bonus-cards">
          {LETTERS.map((l, i) => (
            <BonusCard key={l} order={claimedBefore(i)} letter={l} mode={game.mode} claimed={game.claimed[l]} onTap={() => tapBonus(l)} />
          ))}
          {game.red?.map((r, i) => (
            <RedBonusCard key={`red-${r}`} order={claimedBefore(LETTERS.length + i)} index={r} claimed={!!game.redClaimed?.[i]} onTap={() => tapRed(i)} />
          ))}
        </div>
      </section>

      <div className="fabs">
        <motion.button className="fab undo" whileTap={{ scale: 0.88 }} onClick={() => go(-1)} disabled={game.step === 0} aria-label="Undo">
          <Undo2 size={24} />
        </motion.button>
        <motion.button className="fab next" whileTap={{ scale: 0.9 }} onClick={() => go(1)} disabled={over} aria-label="Next">
          <ArrowRight size={30} strokeWidth={2.5} />
        </motion.button>
      </div>

      <AnimatePresence>
        {roundEnd && (
          <Modal key="round-end" onClose={() => setRoundEnd(false)}>
            <div className="round-end-icon">
              <Flag size={34} strokeWidth={2.4} />
            </div>
            <h2>{finalRound ? 'Game over!' : `Round ${round + 1} over!`}</h2>
            <p>
              {finalRound
                ? 'Final scoring: sights, villages & bonuses.'
                : `Everyone scores their sights now. The deck gets reshuffled for round ${round + 2}.`}
            </p>
            <div className="modal-actions">
              <button className="link-btn" onClick={() => setRoundEnd(false)}>
                Not yet
              </button>
              <button className="start-btn small" onClick={() => go(1, true)}>
                {finalRound ? 'Finish' : `Start round ${round + 2}`}
              </button>
            </div>
          </Modal>
        )}
        {confirmNew && (
          <Modal key="confirm" onClose={() => setConfirmNew(false)}>
            <h2>Start a new game?</h2>
            <p>The current game will be lost.</p>
            <div className="modal-actions">
              <button className="link-btn" onClick={() => setConfirmNew(false)}>
                Cancel
              </button>
              <button className="start-btn small" onClick={onNewGame}>
                New game
              </button>
            </div>
          </Modal>
        )}
        {showVillages && (
          <Modal key="villages" onClose={() => setShowVillages(false)}>
            <h2>Set-up card</h2>
            <p>Read clockwise from the top. Mayor starts at village 1, the next player at village 2…</p>
            <SetupCard key={game.villages.join('')} letters={game.villages} />
            <div className="modal-actions">
              {game.step === 0 && (
                <button className="link-btn" onClick={() => setGame({ ...game, villages: setupCard(game.villages) })}>
                  Draw another
                </button>
              )}
              <button className="start-btn small" onClick={() => setShowVillages(false)}>
                Done
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.main>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div className="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="modal"
        initial={{ y: 40, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 40, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="icon-btn close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        {children}
      </motion.div>
    </motion.div>
  )
}
