import { Cat } from 'lucide-react'
import type { ComponentType } from 'react'
import type { Sight } from './game'

type IconProps = { size?: number; strokeWidth?: number }

/** Simple line icons (lucide-style, 24×24) for the game's sights. */
function icon(paths: React.ReactNode) {
  return function SightIcon({ size = 24, strokeWidth = 2 }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {paths}
      </svg>
    )
  }
}

const Serpent = icon(
  <>
    {/* humps in the water + raised head */}
    <path d="M2 19c0-4 4-4 4 0" />
    <path d="M8 19c0-4 4-4 4 0" />
    <path d="M14 19V9a3 3 0 0 1 6 0l2 1-2 1" />
    <circle cx="17.5" cy="8.5" r="0.6" fill="currentColor" />
    <path d="M1 21h22" />
  </>,
)

const Obelisk = icon(
  <>
    <path d="M12 2l3 4v13H9V6z" />
    <path d="M9 6h6" />
    <path d="M12 2v17" />
    <path d="M6 22h12l-1.5-3h-9z" />
  </>,
)

const Book = icon(
  <>
    <path d="M5 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5z" />
    <path d="M8 3v18" />
    <path d="M19 10h-3v4h3" />
  </>,
)

const Toucan = icon(
  <>
    {/* head, oversized curved beak, body on a branch */}
    <circle cx="7" cy="7" r="3" />
    <path d="M9.5 5.5C14 3.5 19.5 4.5 22 8c-4 .8-8.5 1.2-12.5.5" />
    <path d="M4.5 9C3 12.5 3.5 17 7 20" />
    <path d="M9.5 9c1 4 .5 8-2.5 11" />
    <path d="M3 21h10" />
    <circle cx="6.3" cy="6.5" r="0.7" fill="currentColor" />
  </>,
)

export const SIGHT_ICON: Record<Sight, ComponentType<IconProps>> = {
  cat: Cat,
  serpent: Serpent,
  obelisk: Obelisk,
  book: Book,
  toucan: Toucan,
}

export const SIGHT_NAME: Record<Sight, string> = {
  cat: 'Cat',
  serpent: 'Sea serpent',
  obelisk: 'Obelisk',
  book: 'Book',
  toucan: 'Toucan',
}
