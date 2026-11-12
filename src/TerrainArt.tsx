import type { Terrain } from './game'

/*
 * Original illustrated card faces (cream card, root-and-vine frame, faceted
 * bronze hex, painted-style scene). Each terrain is built once as an SVG
 * string and used as an <img>, so the browser rasterises it once and the
 * flip animations only move a bitmap.
 *
 * Card viewBox: 100 × 145. Scenes are drawn in a 0–100 box and fitted into the hex.
 */

/* ---------- helpers ---------- */

const f = (n: number) => +n.toFixed(2)

function hexPoints(r: number, cx = 50, cy = 50): [number, number][] {
  const h = 0.866 * r
  return [
    [cx, cy - r],
    [cx + h, cy - r / 2],
    [cx + h, cy + r / 2],
    [cx, cy + r],
    [cx - h, cy + r / 2],
    [cx - h, cy - r / 2],
  ]
}
const pts = (p: [number, number][]) => p.map(([x, y]) => `${f(x)},${f(y)}`).join(' ')

/** Deterministic pseudo-random so every render of a card is identical. */
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/* ---------- frame ---------- */

function leaf(x: number, y: number, a: number, s: number, shade: number) {
  const fill = ['url(#leafA)', 'url(#leafB)', 'url(#leafC)'][shade]
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)}) scale(${f(s)})">
    <path d="M0 0C2.6-3.8 9.5-4.2 13 0C9.5 4.2 2.6 3.8 0 0Z" fill="${fill}" stroke="#4f7424" stroke-width="0.5"/>
    <path d="M0.6 0C4 -0.3 8 -0.2 12 0" stroke="#e9f7c4" stroke-width="0.45" fill="none" opacity="0.8"/>
    <path d="M4 0l1.6-1.5M7 0l1.6-1.4M5 0l1.5 1.4M8 0l1.4 1.3" stroke="#6f9a33" stroke-width="0.3" fill="none"/>
  </g>`
}

function twig(x: number, y: number, a: number, s: number) {
  const rad = (a * Math.PI) / 180
  return `<path d="M${f(x)} ${f(y)}l${f(Math.cos(rad) * 7 * s)} ${f(Math.sin(rad) * 7 * s)}" stroke="#7d7780" stroke-width="0.9" stroke-linecap="round"/>`
}

/** A rounded-looking vine/trunk: outline, shadow side, body, highlight. */
function vine(d: string, width: number) {
  const w = width * 0.85
  return `<path d="${d}" fill="none" stroke="#38333a" stroke-width="${f(w + 1)}" stroke-linecap="round"/>
  <path d="${d}" fill="none" stroke="#6f6a73" stroke-width="${f(w)}" stroke-linecap="round"/>
  <path d="${d}" fill="none" stroke="#a29da6" stroke-width="${f(w * 0.62)}" stroke-linecap="round" transform="translate(-${f(w * 0.12)} -${f(w * 0.08)})"/>
  <path d="${d}" fill="none" stroke="#dcd8de" stroke-width="${f(w * 0.18)}" stroke-linecap="round" opacity="0.8" transform="translate(-${f(w * 0.25)} -${f(w * 0.18)})"/>`
}

function frame() {
  const r = rng(7)

  // thick twisting trunks down both sides, with thinner vines wrapped around them
  const trunks = [
    vine('M5 2C8.5 22 2.5 40 6.5 58S2.5 96 6 116 3.5 136 6.5 146', 7.4),
    vine('M96.5 2C92.5 20 99 42 94.5 60S98.5 98 94.5 118 97.5 138 94.5 146', 7.4),
  ]
  const wraps = [
    vine('M11 4C3 18 12 30 4 44S12 70 3 86 11 112 4 128', 2.4),
    vine('M2 60C9 66 8 76 2 82', 1.5),
    vine('M7 96C12 102 11 110 6 116', 1.3),
    vine('M90 6C98 20 89 34 97 48S89 74 97 90 89 114 96 132', 2.4),
    vine('M99 28C92 34 92 42 98 48', 1.5),
    vine('M94 100C89 106 90 114 95 120', 1.3),
  ]
  // branches arching across the top, roots across the bottom
  const branches = [
    // edge vines hugging the very top and bottom so no paper shows above/below them
    vine('M-2 1C18 3 36 -0.5 54 2S84 0 102 1.5', 3.6),
    vine('M-2 3.5C16 1 34 5 52 2.5S82 5 102 3', 2.4),
    vine('M-2 144C18 142 36 145.5 54 143S84 145 102 143.5', 3.6),
    vine('M-2 141.5C16 144 34 140 52 142.5S82 140 102 142', 2.4),
    vine('M2 5C14 12 26 3 40 9S66 4 80 10 94 5 99 7', 2.6),
    vine('M10 10C18 6 26 13 34 8', 1.5),
    vine('M60 9C70 14 80 7 90 11', 1.5),
    vine('M1 140C14 134 26 143 40 137S64 142 78 135 92 141 99 138', 3),
    vine('M8 144C16 137 30 140 40 145', 2),
    vine('M58 144C68 138 80 141 92 144', 2),
    vine('M22 137C26 132 32 133 35 138', 1.5),
    vine('M64 136C68 131 74 132 77 137', 1.5),
    // extra tangles across the top
    vine('M0 2C12 7 22 0 34 4S56 1 68 5 88 1 100 3', 2),
    vine('M4 9C16 13 26 6 38 11S58 7 70 12 90 8 98 12', 1.8),
    vine('M20 1C24 6 30 7 34 12', 1.3),
    vine('M46 2C50 8 56 8 60 13', 1.3),
    vine('M74 1C78 6 84 6 88 11', 1.3),
    // extra roots across the bottom
    vine('M0 135C12 131 24 137 36 133S58 137 70 132 90 136 100 133', 2),
    vine('M2 142C14 138 28 144 42 139S66 144 80 139 94 143 100 141', 2.2),
    vine('M14 131C18 135 24 136 28 141', 1.3),
    vine('M44 132C48 137 54 137 58 142', 1.3),
    vine('M80 131C84 136 90 136 94 141', 1.3),
  ]
  // bark marks on the trunks
  const bark = [
    [2.7, 34],
    [1.9, 78],
    [3.1, 104],
    [98.1, 40],
    [98.9, 84],
    [97.7, 108],
  ]
    .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="0.9" ry="2.2" fill="#e6e2e8" opacity="0.85"/>`)
    .join('')

  // leaves scattered along the top and bottom bands (bigger than before), a few on the sides
  const leafList: string[] = []
  const twigs: string[] = []
  const band = (y0: number, y1: number, count: number, down: boolean) => {
    for (let i = 0; i < count; i++) {
      const x = 2 + (96 * (i + r() * 0.6)) / count
      const y = y0 + r() * (y1 - y0)
      const a = (down ? 90 : -90) + (r() - 0.5) * 140
      twigs.push(twig(x, y, a + 180, 0.5 + r() * 0.3))
      leafList.push(leaf(x, y, a, 0.95 + r() * 0.4, Math.floor(r() * 3)))
    }
  }
  band(3, 11, 13, true)
  band(134, 142, 13, false)
  // side leaves: deliberately uneven (different heights, counts, angles, sizes)
  ;[
    // left side
    [3, 24, 55, 0.95, 0],
    [4, 27, 15, 0.75, 2],
    [3, 58, -20, 1.05, 1],
    [4, 92, 30, 0.85, 2],
    [3, 118, -50, 1.1, 0],
    [4, 121, -5, 0.7, 1],
    // right side
    [97, 42, 150, 1.0, 1],
    [97, 78, -160, 0.9, 0],
    [96, 81, 175, 0.7, 2],
    [97, 104, 125, 1.1, 1],
  ].forEach(([x, y, a, sc, sh]) => leafList.push(leaf(x, y, a, sc, sh)))
  const leaves = twigs.join('') + leafList.join('')

  // side vines sit tight against the card edges so no paper shows outside them
  const left = `<g transform="translate(-2.5 0)">${trunks[0]}${wraps.slice(0, 3).join('')}</g>`
  const right = `<g transform="translate(2.5 0)">${trunks[1]}${wraps.slice(3).join('')}</g>`
  // vines go under the hex, leaves on top of it
  return { vines: `${branches.join('')}${left}${right}${bark}`, leaves }
}

/* ---------- bronze hex ---------- */

function bronzeHex() {
  const outer = hexPoints(42.5)
  const inner = hexPoints(37.3)
  // edges 0..5 start at the top vertex going clockwise; light comes from the top-left
  const shades = ['#d7b273', '#9a7444', '#3d2b1c', '#2c1f15', '#7c5a35', '#ecd099']
  const facets = shades
    .map((c, k) => {
      const n = (k + 1) % 6
      return `<polygon points="${pts([outer[k], outer[n], inner[n], inner[k]])}" fill="${c}"/>`
    })
    .join('')
  return `
  <polygon points="${pts(hexPoints(42.5, 51, 54))}" fill="#000" opacity="0.28" filter="url(#soft)"/>
  ${facets}
  <polygon points="${pts(outer)}" fill="none" stroke="#24180f" stroke-width="0.8"/>
  <polygon points="${pts(hexPoints(37.3))}" fill="url(#gold)"/>
  <polygon points="${pts(hexPoints(34.8))}" fill="#3a2a1b"/>`
}

/* ---------- scenes (0–100 box) ---------- */

function desert() {
  const r = rng(11)
  const cracks = [
    'M14 26l5 3 1 5 5 2 2 6',
    'M20 29l-3 6',
    'M74 18l-3 5 3 4-4 5 1 6',
    'M71 27l5 2',
    'M18 66l6 2 2 6 6 1',
    'M24 68l-2 6',
    'M70 64l5-2 2-6 6-2',
    'M77 60l2 5',
    'M40 84l5-2 6 2 5-1',
    'M44 16l4 2 5-1',
  ]
  const crackSvg = cracks
    .map(
      (d) => `<path d="${d}" fill="none" stroke="#fff8e6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(0.6 0.6)"/>
      <path d="${d}" fill="none" stroke="#b89a62" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>`,
    )
    .join('')
  const pebbles = Array.from({ length: 9 }, () => {
    const x = 15 + r() * 70
    const y = 15 + r() * 70
    const rad = 0.8 + r() * 1.1
    return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="#a596d6"/><circle cx="${f(x - rad * 0.3)}" cy="${f(y - rad * 0.3)}" r="${f(rad * 0.35)}" fill="#e7e0ff"/>`
  }).join('')
  const grains = Array.from({ length: 60 }, () => `<circle cx="${f(r() * 100)}" cy="${f(r() * 100)}" r="0.35" fill="#c9b285" opacity="0.6"/>`).join('')
  return `
  <rect width="100" height="100" fill="url(#sand)"/>
  <ellipse cx="50" cy="52" rx="36" ry="32" fill="#fbf5e4" opacity="0.8"/>
  <path d="M8 40C24 34 40 44 58 38S88 34 96 40" fill="none" stroke="#e3d2a8" stroke-width="3" opacity="0.6"/>
  <path d="M6 70C22 64 44 74 62 68S86 66 96 72" fill="none" stroke="#e3d2a8" stroke-width="3" opacity="0.6"/>
  ${grains}${crackSvg}${pebbles}`
}

function water() {
  const r = rng(5)
  const crest = (x: number, y: number, w: number) =>
    `<path d="M${f(x)} ${f(y)}c${f(w * 0.25)}-2.2 ${f(w * 0.5)} 2.2 ${f(w * 0.75)} 0s${f(w * 0.25)}-1.4 ${f(w * 0.4)} 0" fill="none" stroke="#f2fbff" stroke-width="1.5" stroke-linecap="round"/>
     <path d="M${f(x)} ${f(y + 1.6)}c${f(w * 0.25)}-2 ${f(w * 0.5)} 2 ${f(w * 0.75)} 0" fill="none" stroke="#2a78b6" stroke-width="0.9" stroke-linecap="round" opacity="0.6"/>`
  const crests = [
    [14, 24, 16],
    [56, 18, 18],
    [34, 36, 14],
    [70, 40, 14],
    [10, 54, 18],
    [46, 56, 16],
    [24, 74, 18],
    [62, 72, 18],
    [42, 86, 14],
  ]
    .map(([x, y, w]) => crest(x, y, w))
    .join('')
  const sparkles = Array.from({ length: 14 }, () => {
    const x = 12 + r() * 76
    const y = 12 + r() * 76
    return `<path d="M${f(x)} ${f(y - 1.2)}L${f(x + 0.4)} ${f(y)}L${f(x)} ${f(y + 1.2)}L${f(x - 0.4)} ${f(y)}Z" fill="#ffffff" opacity="0.85"/>`
  }).join('')
  return `
  <rect width="100" height="100" fill="url(#sea)"/>
  <ellipse cx="50" cy="52" rx="30" ry="28" fill="#1f6aa8" opacity="0.35" filter="url(#soft)"/>
  <path d="M8 30C30 22 70 22 92 30M6 66C30 58 70 58 94 66" fill="none" stroke="#9fdcf7" stroke-width="5" opacity="0.25"/>
  ${crests}${sparkles}`
}

function forest() {
  const r = rng(3)
  const tufts = Array.from({ length: 26 }, () => {
    const x = 6 + r() * 88
    const y = 66 + r() * 28
    return `<path d="M${f(x)} ${f(y)}l-1 -2.6M${f(x)} ${f(y)}l0.2 -3M${f(x)} ${f(y)}l1.2 -2.4" stroke="#6f9e34" stroke-width="0.6" stroke-linecap="round"/>`
  }).join('')

  // One big lumpy blue-green bush behind the tree: all lobes share a shadow
  // layer, a body layer and a speckled highlight layer so they read as one mass.
  const lobes: [number, number, number][] = [
    [20, 58, 11], [30, 46, 12], [44, 38, 13], [58, 36, 13], [72, 44, 12], [82, 56, 11],
    [26, 64, 10], [40, 56, 12], [60, 54, 12], [76, 64, 10], [50, 46, 12], [16, 70, 7], [86, 70, 7],
  ]
  const bushShadow = lobes.map(([x, y, rad]) => `<circle cx="${x}" cy="${y + 2}" r="${rad}" fill="#4f7397"/>`).join('')
  const bushBody = lobes.map(([x, y, rad]) => `<circle cx="${x}" cy="${y}" r="${rad - 0.6}" fill="#7fa7cf"/>`).join('')
  const bushSpecks = lobes
    .flatMap(([x, y, rad]) =>
      Array.from({ length: 7 }, () => {
        const a = Math.PI * (1.1 + r() * 0.8)
        const d = rad * (0.3 + r() * 0.55)
        return `<circle cx="${f(x + Math.cos(a) * d)}" cy="${f(y + Math.sin(a) * d)}" r="${f(0.7 + r() * 0.9)}" fill="#bcd8f0"/>`
      }),
    )
    .join('')
  // fern fronds at the base of the bush
  const frond = (x: number, y: number, a: number) =>
    `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 0C2-5 4-9 3-14" stroke="#6b93bd" stroke-width="1.6" fill="none" stroke-linecap="round"/>
     ${[3, 6, 9, 12].map((t) => `<path d="M${f(t * 0.22)} ${-t}l-3 -1.4M${f(t * 0.22)} ${-t}l3 -1.6" stroke="#8db3d9" stroke-width="1.2" stroke-linecap="round"/>`).join('')}</g>`
  const fronds = [frond(28, 76, -35), frond(34, 78, -10), frond(68, 78, 12), frond(74, 76, 38)].join('')

  // tree canopy: flattened leafy clumps, dark underside + light top + speckles
  const clumps: [number, number, number, number][] = [
    [36, 34, 11, 6], [64, 32, 11, 6], [50, 24, 12, 6.5], [30, 46, 8, 4.5], [70, 44, 8, 4.5], [44, 44, 9, 5], [58, 46, 8, 4.5],
  ]
  const canopy = clumps
    .map(([x, y, rx, ry]) => {
      const specks = Array.from({ length: 6 }, () => `<circle cx="${f(x + (r() - 0.5) * rx * 1.4)}" cy="${f(y - ry * 0.3 - r() * ry * 0.5)}" r="${f(0.6 + r() * 0.7)}" fill="#c9ec8a"/>`).join('')
      return `<ellipse cx="${x}" cy="${f(y + 1.6)}" rx="${rx}" ry="${ry}" fill="#36702c"/>
        <ellipse cx="${x}" cy="${y}" rx="${f(rx - 0.4)}" ry="${f(ry - 0.4)}" fill="#5f9f3e"/>
        <ellipse cx="${f(x - rx * 0.15)}" cy="${f(y - ry * 0.3)}" rx="${f(rx * 0.6)}" ry="${f(ry * 0.45)}" fill="#86c152"/>${specks}`
    })
    .join('')

  return `
  <rect width="100" height="100" fill="url(#grass)"/>
  ${tufts}
  ${bushShadow}${bushBody}${bushSpecks}${fronds}
  <ellipse cx="50" cy="84" rx="24" ry="5" fill="#5f8a33" opacity="0.6"/>
  <path d="M44 86C46 76 41 70 45 60C47 54 46 50 47 46L54 46C55 52 54 58 56 62C59 70 55 78 58 86C54 88 48 88 44 86Z" fill="url(#bark)" stroke="#5a463a" stroke-width="1"/>
  <path d="M47 84C48 76 46 70 48 62M51 82C52 74 50 68 52 58M54 80C55 74 53 70 55 64" stroke="#7b6455" stroke-width="0.6" fill="none"/>
  <path d="M44 86C40 88 36 87 33 89M58 86C62 88 66 87 69 89M50 87C50 89 49 91 47 92" stroke="#5a463a" stroke-width="1.4" fill="none" stroke-linecap="round"/>
  <path d="M47 56C42 52 37 50 33 44M54 54C59 50 63 46 67 40M50 48C50 40 49 34 49 28M48 52C46 48 44 46 42 44M53 50C56 48 58 47 60 46" stroke="#6b5649" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  ${canopy}`
}

function mountain() {
  const r = rng(9)
  const rock = (top: string, side: string, cracks: string) =>
    `<path d="${side}" fill="#9e9a97" stroke="#6e6966" stroke-width="0.9" stroke-linejoin="round"/>
     <path d="${top}" fill="url(#stone)" stroke="#6e6966" stroke-width="0.9" stroke-linejoin="round"/>
     ${cracks ? `<path d="${cracks}" fill="none" stroke="#8a8582" stroke-width="0.6" stroke-linecap="round"/>` : ''}`
  const rocks = [
    rock('M18 72L22 62L32 58L42 61L44 68L34 71Z', 'M18 72L34 71L44 68L45 78L20 80Z', 'M24 74l4 2M38 73l2 3'),
    rock('M56 70L60 60L72 56L82 60L84 68L70 70Z', 'M56 70L70 70L84 68L84 78L57 80Z', 'M62 74l3 2M76 73l2 3'),
    rock('M32 58L36 46L48 41L60 44L64 54L48 57Z', 'M32 58L48 57L64 54L64 64L34 66Z', 'M40 60l3 2M54 60l3 2M46 50l4-2'),
    rock('M40 42L44 31L52 26L60 30L60 39L50 42Z', 'M40 42L50 42L60 39L60 46L42 48Z', 'M48 44l2 2M50 34l3-1'),
    rock('M30 84L33 78L42 77L46 82Z', 'M30 84L46 82L46 87L31 88Z', ''),
    rock('M60 84L64 78L72 78L75 83Z', 'M60 84L75 83L74 88L61 88Z', ''),
  ].join('')
  const gravel = Array.from({ length: 30 }, () => {
    const x = 14 + r() * 72
    const y = 78 + r() * 14
    return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(0.6 + r())}" ry="${f(0.4 + r() * 0.5)}" fill="#8f8a86"/>`
  }).join('')
  return `
  <rect width="100" height="100" fill="url(#slate)"/>
  <ellipse cx="50" cy="82" rx="38" ry="9" fill="#8d7f72" opacity="0.45" filter="url(#soft)"/>
  ${gravel}${rocks}`
}

const SCENES: Record<Exclude<Terrain, 'any'>, () => string> = { desert, water, forest, mountain }

function joker() {
  const order: Exclude<Terrain, 'any'>[] = ['desert', 'forest', 'mountain', 'water']
  const edges = [0, 28.4, 50, 71.6, 100] // the hex shows x≈7–93 of the scene box
  const clips = order
    .map((_, i) => `<clipPath id="s${i}"><rect x="${edges[i]}" y="0" width="${f(edges[i + 1] - edges[i] + 0.3)}" height="100"/></clipPath>`)
    .join('')
  const strips = order.map((t, i) => `<g clip-path="url(#s${i})">${SCENES[t]()}</g>`).join('')
  const dividers = edges
    .slice(1, 4)
    .map((x) => `<path d="M${x} 0V100" stroke="#3a2a1b" stroke-width="0.8" opacity="0.6"/>`)
    .join('')
  return `<defs>${clips}</defs>${strips}${dividers}`
}

/* ---------- card ---------- */

const DEFS = `
<defs>
  <radialGradient id="paper" cx="50%" cy="48%" r="62%"><stop offset="0" stop-color="#fbf5e8"/><stop offset="0.7" stop-color="#f0e4cb"/><stop offset="1" stop-color="#dcc9a6"/></radialGradient>
  <linearGradient id="roots" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f383c"/><stop offset="0.5" stop-color="#4d4549"/><stop offset="1" stop-color="#352f33"/></linearGradient>
  <linearGradient id="leafA" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8fbf45"/><stop offset="1" stop-color="#c6e27a"/></linearGradient>
  <linearGradient id="leafB" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#76a83a"/><stop offset="1" stop-color="#b2d866"/></linearGradient>
  <linearGradient id="leafC" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9ccb52"/><stop offset="1" stop-color="#dbee98"/></linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3dc9c"/><stop offset="0.5" stop-color="#c79a4c"/><stop offset="1" stop-color="#8a6630"/></linearGradient>
  <radialGradient id="sand" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#f8f0da"/><stop offset="1" stop-color="#e6d4a8"/></radialGradient>
  <radialGradient id="sea" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#2a7fc2"/><stop offset="0.6" stop-color="#3d9fd9"/><stop offset="1" stop-color="#6cc8ef"/></radialGradient>
  <radialGradient id="grass" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#cbe68a"/><stop offset="1" stop-color="#9cc957"/></radialGradient>
  <linearGradient id="bark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a7464"/><stop offset="0.45" stop-color="#b9a493"/><stop offset="1" stop-color="#76604f"/></linearGradient>
  <radialGradient id="slate" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#d0ccc8"/><stop offset="1" stop-color="#aaa5a1"/></radialGradient>
  <linearGradient id="stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1efed"/><stop offset="1" stop-color="#c8c4c1"/></linearGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.35  0 0 0 0 0.2  0 0 0 0.12 0"/></filter>
  <clipPath id="hex"><polygon points="${pts(hexPoints(34.8))}"/></clipPath>
</defs>`

function cardSvg(terrain: Terrain) {
  const fr = frame()
  const scene = terrain === 'any' ? joker() : SCENES[terrain]()
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 145" width="400" height="580">
  ${DEFS}
  <rect width="100" height="145" fill="url(#paper)"/>
  <rect width="100" height="145" filter="url(#grain)"/>
  ${fr.vines}
  <g transform="translate(0 22.5)">
    ${bronzeHex()}
    <g clip-path="url(#hex)">
      <g transform="translate(15.2 15.2) scale(0.696)">${scene}</g>
      <polygon points="${pts(hexPoints(34.8))}" fill="none" stroke="#000" stroke-width="3" opacity="0.18" filter="url(#soft)"/>
    </g>
    <polygon points="${pts(hexPoints(34.8))}" fill="none" stroke="#1e140d" stroke-width="0.9"/>
  </g>
  ${fr.leaves}
</svg>`
}

const cache = new Map<Terrain, string>()
function cardUrl(terrain: Terrain) {
  let url = cache.get(terrain)
  if (!url) {
    url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cardSvg(terrain))}`
    cache.set(terrain, url)
  }
  return url
}

/** Full card face artwork for a terrain card. */
export function TerrainArt({ terrain, name }: { terrain: Terrain; name: string }) {
  return (
    <>
      <img className="terrain-art" src={cardUrl(terrain)} alt={name} draggable={false} />
    </>
  )
}
