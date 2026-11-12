import { motion } from 'framer-motion'
import { Check, Mountain, Sparkles, Sun, Trees, Waves } from 'lucide-react'
import { SIGHT_ICON, SIGHT_NAME } from './SightIcons'
import { TerrainArt } from './TerrainArt'
import { useEffect, useState, type ComponentType } from 'react'
import { bonusStack, RED_BONUS, type Letter, type PlayerMode, type Terrain } from './game'

const TERRAIN: Record<Terrain, { name: string; Icon: ComponentType<{ size?: number; strokeWidth?: number }> }> = {
  desert: { name: 'Desert', Icon: Sun },
  forest: { name: 'Forest', Icon: Trees },
  mountain: { name: 'Mountain', Icon: Mountain },
  water: { name: 'Water', Icon: Waves },
  any: { name: 'Joker', Icon: Sparkles },
}

export function CardBack({ small, standalone }: { small?: boolean; standalone?: boolean }) {
  return (
    <div className={`face back ${small ? "small" : ""} ${standalone ? "standalone" : ""}`}>
      <div className="back-inner">
        <span>{small ? 'T' : 'Toucana'}</span>
      </div>
    </div>
  )
}

function TerrainFace({ terrain }: { terrain: Terrain }) {
  return (
    <div className="face front terrain-face">
      <TerrainArt terrain={terrain} name={TERRAIN[terrain].name} />
    </div>
  )
}

export type Dir = 1 | -1

const BONUS_SPRING = { type: 'spring' as const, stiffness: 220, damping: 18 }

/**
 * On load every bonus card shows its fresh side; saved claims are then replayed as flips,
 * one card after another (`order` = position among claimed cards), one step at a time.
 * After that the value is followed directly so taps flip immediately.
 */
function useReplayed(value: number, order: number) {
  const [shown, setShown] = useState(0)
  const [live, setLive] = useState(value === 0)
  useEffect(() => {
    if (live) return
    if (shown >= value) {
      setLive(true)
      return
    }
    const t = setTimeout(() => setShown((s) => s + 1), shown === 0 ? 450 + order * 110 : 180)
    return () => clearTimeout(t)
  }, [live, shown, value, order])
  return live ? value : shown
}

/** A terrain card that flies in from the deck (next) or back from the discard (undo), flipping face-up. */
const DECK_POS = { x: 170, y: -260, rotateZ: 14, opacity: 0, scale: 0.8 }
const DISCARD_POS = { x: -190, y: 200, rotateZ: -16, opacity: 0, scale: 0.8 }

/**
 * Soft card shadow as a pre-blurred image: it moves and tilts with the card but is
 * rasterised once, so animating it costs nothing extra.
 */
const SHADOW_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 185" width="280" height="370">
    <filter id="b" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter>
    <rect x="20" y="26" width="100" height="145" rx="10" fill="#000" opacity="0.55" filter="url(#b)"/>
  </svg>`,
)}`

export function TerrainCard({ terrain, index, dir }: { terrain: Terrain; index: number; dir: Dir }) {
  // `custom` (dir, or 0 on game over) is supplied by AnimatePresence so exiting cards use the latest value.
  const spring = { type: 'spring' as const, stiffness: 160, damping: 19, delay: 0.12 + index * 0.16 }
  const leave = { duration: 0.32, ease: 'easeIn' as const, delay: index * 0.05 }
  const fade = { duration: 0.45, ease: 'easeInOut' as const }

  // Outer layer: position / tilt / fade (2D only) — carries the shadow.
  const move = {
    enter: (d: Dir) => (d === 1 ? DECK_POS : DISCARD_POS),
    center: { x: 0, y: 0, rotateZ: index === 0 ? -3 : 3, opacity: 1, scale: 1, transition: spring },
    // 0 = game over: fade and shrink in place, matching the HUD
    exit: (d: Dir | 0) =>
      d === 0 ? { opacity: 0, scale: 0.9, transition: fade } : { ...(d === 1 ? DISCARD_POS : DECK_POS), transition: leave },
  }
  // Inner layer: the 3D flip only — the shadow is not part of it.
  const flip = {
    enter: (d: Dir) => ({ rotateY: d === 1 ? 180 : 0 }),
    center: { rotateY: 0, transition: spring },
    exit: (d: Dir | 0) => (d === 0 ? { rotateY: 0, transition: fade } : { rotateY: d === 1 ? 0 : 180, transition: leave }),
  }
  return (
    <motion.div
      className="terrain-card"
      style={{ gridColumn: index + 1 }}
      custom={dir}
      variants={move}
      initial="enter"
      animate="center"
      exit="exit"
    >
      <img className="card-shadow-img" src={SHADOW_URL} alt="" aria-hidden draggable={false} />
      <motion.div className="card terrain-flip" custom={dir} variants={flip} style={{ transformStyle: 'preserve-3d' }}>
        <TerrainFace terrain={terrain} />
        <CardBack />
      </motion.div>
    </motion.div>
  )
}

/** Bonus card for a letter pair. Tap = a player connected it; the card flips to the next value (or claimed). */
export function BonusCard({
  letter,
  mode,
  claimed: savedClaimed,
  onTap,
  order,
}: {
  letter: Letter
  mode: PlayerMode
  claimed: number
  onTap: () => void
  order: number
}) {
  const claimed = useReplayed(savedClaimed, order)
  const stack = bonusStack(mode, letter)
  const content = (i: number) =>
    i < 0 ? null : i < stack.length ? (
      <>
        <span className="pair">
          {letter}–{letter}
        </span>
        <span className="value">{stack[i].value}</span>
        <span className="label">{mode === 'large' ? stack[i].label : 'bonus'}</span>
      </>
    ) : (
      <>
        <span className="pair">
          {letter}–{letter}
        </span>
        <Check size={26} strokeWidth={3} />
        <span className="label">claimed</span>
      </>
    )

  // Face with parity of `claimed` shows the current content, the other shows the previous one (seen mid-flip).
  const even = claimed % 2 === 0 ? claimed : claimed - 1
  const odd = claimed % 2 === 1 ? claimed : claimed - 1
  const done = claimed >= stack.length
  // #2 cards (second to connect) use a paler blue
  const tone = (i: number) => (i >= stack.length ? 'claimed' : i === 1 ? 'second' : '')

  return (
    <button className="bonus-slot" onClick={onTap} aria-label={`Bonus ${letter}-${letter}`}>
      <motion.div
        className={`card bonus-card ${done ? 'done' : ''}`}
        initial={false}
        animate={{ rotateY: claimed * 180 }}
        whileTap={{ scale: 0.93 }}
        transition={BONUS_SPRING}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className={`face front bonus-face ${tone(even)}`}>{content(even)}</div>
        <div className={`face front flipped bonus-face ${tone(odd)}`}>{content(odd)}</div>
      </motion.div>
    </button>
  )
}

/** Village set-up card: deals in face down and flips, letters placed clockwise from the top. */
export function SetupCard({ letters }: { letters: Letter[] }) {
  return (
    <motion.div
      className="card setup-card"
      initial={{ rotateY: 180 }}
      animate={{ rotateY: 0 }}
      exit={{ rotateY: -180, transition: { duration: 0.3, ease: 'easeIn' } }}
      transition={{ type: 'spring', stiffness: 140, damping: 16, delay: 0.15 }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="face front setup-face">
        <span className="setup-start" aria-hidden>
          ▼
        </span>
        {letters.map((l, i) => {
          const a = (i / letters.length) * 2 * Math.PI
          return (
            <span
              key={i}
              className={`setup-letter ${i === 0 ? 'first' : ''}`}
              style={{ left: `${50 + 38 * Math.sin(a)}%`, top: `${50 - 38 * Math.cos(a)}%` }}
            >
              {l}
            </span>
          )
        })}
        <span className="setup-center">clockwise</span>
      </div>
      <CardBack />
    </motion.div>
  )
}


/** Red special-bonus card: connect two of the shown sight. Tap = claimed (flip), tap again = undo. */
export function RedBonusCard({ index, claimed: savedClaimed, onTap, order }: { index: number; claimed: boolean; onTap: () => void; order: number }) {
  const claimed = useReplayed(savedClaimed ? 1 : 0, order) === 1
  const { sight, value } = RED_BONUS[index]
  const Icon = SIGHT_ICON[sight]
  return (
    <button className="bonus-slot" onClick={onTap} aria-label={`Special bonus: two ${SIGHT_NAME[sight]}s, ${value} points`}>
      <motion.div
        className="card bonus-card red-card"
        initial={false}
        animate={{ rotateY: claimed ? 180 : 0 }}
        whileTap={{ scale: 0.93 }}
        transition={BONUS_SPRING}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="face front bonus-face red-face">
          <span className="sights">
            <Icon size={20} strokeWidth={2.2} />
            <Icon size={20} strokeWidth={2.2} />
          </span>
          <span className="value">{value}</span>
          <span className="label">bonus</span>
        </div>
        <div className="face front flipped bonus-face claimed">
          <span className="sights">
            <Icon size={20} strokeWidth={2.2} />
          </span>
          <Check size={26} strokeWidth={3} />
          <span className="label">claimed</span>
        </div>
      </motion.div>
    </button>
  )
}
