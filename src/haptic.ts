// Light haptic tap.
// Android/Chrome: Vibration API. iOS Safari (18+) has no Vibration API, but toggling a
// native "switch" checkbox inside a user gesture plays the system haptic, so we keep a
// hidden one around and click its label.

let label: HTMLLabelElement | null = null

function iosSwitch(): HTMLLabelElement | null {
  if (label) return label
  try {
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    input.id = 'haptic-switch'
    input.tabIndex = -1
    input.setAttribute('aria-hidden', 'true')
    label = document.createElement('label')
    label.htmlFor = input.id
    label.setAttribute('aria-hidden', 'true')
    label.style.cssText = 'position:fixed;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;left:-9999px'
    label.appendChild(input)
    document.body.appendChild(label)
    return label
  } catch {
    return null
  }
}

export function haptic(pattern: number | number[] = 8) {
  if (typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern)
      return
    } catch {
      /* fall through */
    }
  }
  iosSwitch()?.click()
}

/** Tap feedback for every button press in the app. */
export function installButtonHaptics() {
  document.addEventListener(
    'click',
    (e) => {
      const el = e.target as Element | null
      if (el?.closest?.('#haptic-switch')) return
      if (el?.closest?.('button:not(:disabled)')) haptic()
    },
    { capture: true },
  )
}
