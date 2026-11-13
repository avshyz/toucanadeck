// Tiny Web Audio synth — no audio files needed.
let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(ac: AudioContext, freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.18, endFreq?: number) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, start + dur)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(vol, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(gain).connect(ac.destination)
  osc.start(start)
  osc.stop(start + dur + 0.02)
}

/** Card "swish": short band-passed noise burst. */
function swish(ac: AudioContext, start: number) {
  const len = Math.floor(ac.sampleRate * 0.12)
  const buf = ac.createBuffer(1, len, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = ac.createBufferSource()
  src.buffer = buf
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(2500, start)
  filter.frequency.exponentialRampToValueAtTime(900, start + 0.12)
  const gain = ac.createGain()
  gain.gain.value = 0.5
  src.connect(filter).connect(gain).connect(ac.destination)
  src.start(start)
}

/** Next: two card swishes (timed with the cards landing) + a bright beep. */
export function playDraw() {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime
  swish(ac, t + 0.1)
  swish(ac, t + 0.26)
  tone(ac, 880, t + 0.42, 0.12, 'triangle')
  tone(ac, 1320, t + 0.5, 0.18, 'triangle')
}

/** Undo: a descending "whoop". */
export function playUndo() {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime
  swish(ac, t)
  tone(ac, 520, t + 0.05, 0.25, 'sine', 0.2, 260)
}

/** Bonus card flip: soft tick. */
export function playFlip() {
  const ac = audio()
  if (!ac) return
  tone(ac, 660, ac.currentTime, 0.08, 'square', 0.06)
}

/** Round over: short rising three-note fanfare. */
export function playRoundEnd() {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime
  ;[523.25, 659.25, 783.99].forEach((f, i) => tone(ac, f, t + i * 0.13, 0.22, 'triangle', 0.2))
  tone(ac, 1046.5, t + 0.42, 0.45, 'triangle', 0.16)
}

/** Game over: longer fanfare ending on a sustained major chord. */
export function playGameEnd() {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime
  ;[392, 523.25, 659.25, 783.99, 659.25, 783.99].forEach((f, i) => tone(ac, f, t + i * 0.12, 0.2, 'triangle', 0.18))
  const end = t + 0.8
  ;[523.25, 659.25, 783.99, 1046.5].forEach((f) => tone(ac, f, end, 1.2, 'triangle', 0.12))
  tone(ac, 261.63, end, 1.2, 'sine', 0.15)
}

/** Picker selection: a quick soft "tock". */
export function playSelect() {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime
  tone(ac, 1200, t, 0.05, 'triangle', 0.12, 700)
}
