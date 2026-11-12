import { motion } from 'framer-motion'
import { Check, Crown, Flame, Gem, Mountain, Shell, Sparkles, Star, Sun, Trees, Waves } from 'lucide-react'
import type { ComponentType } from 'react'
import { bonusStack, RED_BONUS, type Letter, type PlayerMode, type Sight, type Terrain } from './game'

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

/** Village set-up card: deals in face down and flips, letters placed clockwise from the top. */
export function SetupCard({ letters }: { letters: Letter[] }) {
  return (
    <motion.div
      className="card setup-card"
      initial={{ rotateY: 180, scale: 0.7, y: 30 }}
      animate={{ rotateY: 0, scale: 1, y: 0 }}
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
              className={`setup-letter letter-${l}`}
              style={{ left: `${50 + 38 * Math.sin(a)}%`, top: `${50 - 38 * Math.cos(a)}%` }}
            >
              {l}
              <small>{i + 1}</small>
            </span>
          )
        })}
        <span className="setup-center">clockwise</span>
      </div>
      <CardBack />
    </motion.div>
  )
}

const SIGHT_ICON: Record<Sight, ComponentType<{ size?: number; strokeWidth?: number }>> = {
  gem: Gem,
  crown: Crown,
  shell: Shell,
  flame: Flame,
  star: Star,
}

/** Red special-bonus card: connect two of the shown sight. Tap = claimed (flip), tap again = undo. */
export function RedBonusCard({ index, claimed, onTap }: { index: number; claimed: boolean; onTap: () => void }) {
  const { sight, value } = RED_BONUS[index]
  const Icon = SIGHT_ICON[sight]
  return (
    <button className="bonus-slot" onClick={onTap} aria-label={`Special bonus ${sight}, ${value} points`}>
      <motion.div
        className="card bonus-card red-card"
        initial={{ rotateY: 180, y: 20, opacity: 0 }}
        animate={{ rotateY: claimed ? 180 : 0, y: 0, opacity: 1 }}
        whileTap={{ scale: 0.93 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="face front bonus-face red-face">
          <span className="sights">
            <Icon size={16} strokeWidth={2.4} />
            <Icon size={16} strokeWidth={2.4} />
          </span>
          <span className="value">{value}</span>
          <span className="label">bonus</span>
        </div>
        <div className="face front flipped bonus-face claimed">
          <span className="sights">
            <Icon size={16} strokeWidth={2.4} />
          </span>
          <Check size={26} strokeWidth={3} />
          <span className="label">claimed</span>
        </div>
      </motion.div>
    </button>
  )
}
