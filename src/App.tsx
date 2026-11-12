import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, MapPin, RotateCcw, Undo2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BonusCard, CardBack, TerrainCard, type Dir } from './Cards'
import {
  cardsAt,
  LETTERS,
  load,
  MODE_LABEL,
  newGame,
  save,
  TOTAL_TURNS,
  TURNS_PER_ROUND,
  turnInfo,
  type Game,
  type Letter,
  type PlayerMode,
} from './game'
import { useWakeLock } from './useWakeLock'

export default function App() {
  const [game, setGame] = useState<Game | null>(() => load())
  const [playing, setPlaying] = useState(false)

  useWakeLock(playing)
  useEffect(() => save(game), [game])

  const start = (mode: PlayerMode) => {
    setGame(newGame(mode))
    setPlaying(true)
  }

  return (
    <AnimatePresence mode="wait">
      {playing && game ? (
        <Table
          key="table"
          game={game}
          setGame={setGame}
          onNewGame={() => {
            setGame(null)
            setPlaying(false)
          }}
        />
      ) : (
        <Splash key="splash" saved={game} onStart={start} onContinue={() => setPlaying(true)} />
      )}
    </AnimatePresence>
  )
}

/* ---------------- Splash ---------------- */

function Splash({
  saved,
  onStart,
  onContinue,
}: {
  saved: Game | null
  onStart: (m: PlayerMode) => void
  onContinue: () => void
}) {
  const [mode, setMode] = useState<PlayerMode>(saved?.mode ?? 'small')
  const canContinue = saved && saved.step < TOTAL_TURNS

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
            animate={{ y: 0, rotate: r, x: r * 4, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 90, damping: 14, delay: 0.15 + i * 0.1 }}
          >
            <CardBack standalone />
          </motion.div>
        ))}
      </div>

      <motion.h1
        className="title"
        initial={{ y: 40, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 12, delay: 0.6 }}
      >
        Toucana
      </motion.h1>

      <motion.div
        className="splash-controls"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <div className="segmented" role="radiogroup" aria-label="Players">
          {(['solo', 'small', 'large'] as PlayerMode[]).map((m) => (
            <button key={m} role="radio" aria-checked={mode === m} className={mode === m ? 'on' : ''} onClick={() => setMode(m)}>
              {MODE_LABEL[m]}
              {m !== 'solo' && <small> players</small>}
            </button>
          ))}
        </div>

        <motion.button
          className="start-btn"
          whileTap={{ scale: 0.94 }}
          animate={{ boxShadow: ['0 0 0 0 rgba(255,196,61,.6)', '0 0 0 18px rgba(255,196,61,0)'] }}
          transition={{ boxShadow: { repeat: Infinity, duration: 1.6 } }}
          onClick={() => onStart(mode)}
        >
          {canContinue ? 'New game' : 'Start'}
        </motion.button>

        {canContinue && (
          <button className="link-btn" onClick={onContinue}>
            Continue round {turnInfo(saved.step).round + 1}, turn {turnInfo(saved.step).turn + 1}
          </button>
        )}
      </motion.div>
    </motion.main>
  )
}

/* ---------------- Table ---------------- */

function Table({
  game,
  setGame,
  onNewGame,
}: {
  game: Game
  setGame: (g: Game) => void
  onNewGame: () => void
}) {
  const [dir, setDir] = useState<Dir>(1)
  const [confirmNew, setConfirmNew] = useState(false)
  const [showVillages, setShowVillages] = useState(false)

  const over = game.step >= TOTAL_TURNS
  const { round, turn } = turnInfo(Math.min(game.step, TOTAL_TURNS - 1))
  const cards = over ? null : cardsAt(game, game.step)
  const leftInDeck = over ? 0 : 27 - (turn + 1) * 2

  const go = (d: Dir) => {
    const step = game.step + d
    if (step < 0 || step > TOTAL_TURNS) return
    setDir(d)
    navigator.vibrate?.(12)
    setGame({ ...game, step })
  }

  const tapBonus = (l: Letter) => {
    const max = game.mode === 'large' ? 2 : 1
    const next = game.claimed[l] >= max ? 0 : game.claimed[l] + 1
    setGame({ ...game, claimed: { ...game.claimed, [l]: next } })
  }

  return (
    <motion.main className="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <header className="topbar">
        <div className="status">
          <span className="round">Round {round + 1}</span>
          <span className="turn">
            Turn {over ? TURNS_PER_ROUND : turn + 1}/{TURNS_PER_ROUND}
          </span>
        </div>
        <div className="top-actions">
          <button className="icon-btn" onClick={() => setShowVillages(true)} aria-label="Village letters">
            <MapPin size={20} />
          </button>
          <button className="icon-btn" onClick={() => setConfirmNew(true)} aria-label="New game">
            <RotateCcw size={20} />
          </button>
        </div>
      </header>

      <section className="play-area">
        <div className="deck-pile" aria-label={`${leftInDeck} cards left`}>
          <div className="card mini">
            <CardBack small standalone />
          </div>
          <span>{leftInDeck}</span>
        </div>

        <div className="terrain-row">
          <AnimatePresence custom={dir} initial={true} mode="popLayout">
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
          {!over && turn === 0 && round === 1 && (
            <motion.div
              className="toast"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Round 2 — deck reshuffled. Score sights!
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="bonus-row" aria-label="Connection bonuses">
        <h3>First to connect</h3>
        <div className="bonus-cards">
          {LETTERS.map((l) => (
            <BonusCard key={l} letter={l} mode={game.mode} claimed={game.claimed[l]} onTap={() => tapBonus(l)} />
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
        {confirmNew && (
          <Modal onClose={() => setConfirmNew(false)}>
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
          <Modal onClose={() => setShowVillages(false)}>
            <h2>Village letters</h2>
            <p>Clockwise from village 1.</p>
            <ol className="villages">
              {game.villages.map((l, i) => (
                <li key={i}>
                  <small>{i + 1}</small>
                  {l}
                </li>
              ))}
            </ol>
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
