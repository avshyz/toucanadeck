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
