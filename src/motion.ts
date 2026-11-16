// Shared motion tokens (after Emil Kowalski's guidance): fast UI, strong custom
// ease-out curves instead of the built-in ones, springs without much bounce.
export const EASE_OUT = [0.23, 1, 0.32, 1] as const
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const
/** Only for things flipping/flying away right before something replaces them. */
export const EASE_IN = [0.55, 0, 1, 0.45] as const

/** Frequent UI (pickers, swaps, HUD): quick and settled. */
export const SPRING_UI = { type: 'spring' as const, duration: 0.3, bounce: 0 }
/** Physical cards: a touch of overshoot so they feel tossed, not slid. */
export const SPRING_CARD = { type: 'spring' as const, duration: 0.7, bounce: 0.2 }

export const fadeIn = (duration = 0.2, delay = 0) => ({ duration, delay, ease: EASE_OUT })
