import { motion } from 'framer-motion'
import { Mountain, Sparkles, Sun, Trees, Waves, Check } from 'lucide-react'
import type { ComponentType } from 'react'
import { bonusStack, type Letter, type PlayerMode, type Terrain } from './game'

const TERRAIN: Record<Terrain, { name: string; Icon: ComponentType<{ size?: number; strokeWidth?: number }> }> = {
  desert: { name: 'Desert', Icon: Sun },
  forest: { name: 'Forest', Icon: Trees },
  mountain: { name: 'Mountain', Icon: Mountain },
  water: { name: 'Water', Icon: Waves },
  any: { name: 'Any', Icon: Sparkles },
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
  const { name, Icon } = TERRAIN[terrain]
  return (
    <div className={`face front terrain-${terrain}`}>
      <span className="corner tl">{name}</span>
      <div className="terrain-icon">
        <Icon size={72} strokeWidth={1.6} />
      </div>
      <span className="terrain-name">{name}</span>
      <span className="corner br">{name}</span>
    </div>
  )
}

export type Dir = 1 | -1

/** A terrain card that flies in from the deck (next) or back from the discard (undo), flipping face-up. */
const DECK_POS = { x: 170, y: -260, rotateY: 180, rotateZ: 14, opacity: 0, scale: 0.8 }
const DISCARD_POS = { x: -190, y: 200, rotateY: 0, rotateZ: -16, opacity: 0, scale: 0.8 }

export function TerrainCard({ terrain, index, dir }: { terrain: Terrain; index: number; dir: Dir }) {
  // `custom` (dir) is supplied by AnimatePresence so exiting cards use the latest direction.
  const variants = {
    enter: (d: Dir) => (d === 1 ? DECK_POS : DISCARD_POS),
    center: {
      x: 0,
      y: 0,
      rotateY: 0,
      rotateZ: index === 0 ? -3 : 3,
      opacity: 1,
      scale: 1,
      transition: { type: 'spring' as const, stiffness: 160, damping: 19, delay: 0.12 + index * 0.16 },
    },
    exit: (d: Dir) => ({
      ...(d === 1 ? DISCARD_POS : DECK_POS),
      transition: { duration: 0.32, ease: 'easeIn' as const, delay: index * 0.05 },
    }),
  }
  return (
    <motion.div
      className="card terrain-card"
      custom={dir}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <TerrainFace terrain={terrain} />
      <CardBack />
    </motion.div>
  )
}

/** Bonus card for a letter pair. Tap = a player connected it; the card flips to the next value (or claimed). */
export function BonusCard({
  letter,
  mode,
  claimed,
  onTap,
}: {
  letter: Letter
  mode: PlayerMode
  claimed: number
  onTap: () => void
}) {
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

  return (
    <button className="bonus-slot" onClick={onTap} aria-label={`Bonus ${letter}-${letter}`}>
      <motion.div
        className={`card bonus-card ${done ? 'done' : ''}`}
        animate={{ rotateY: claimed * 180 }}
        whileTap={{ scale: 0.93 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className={`face front bonus-face ${even >= stack.length ? 'claimed' : ''}`}>{content(even)}</div>
        <div className={`face front flipped bonus-face ${odd >= stack.length ? 'claimed' : ''}`}>{content(odd)}</div>
      </motion.div>
    </button>
  )
}
