let ctx: AudioContext | null = null

function getCtx() {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

/** 셔플 틱 — 피아노 음계를 랜덤으로 */
const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880] // C5 D5 E5 G5 A5
let tickIdx = 0

export function playTick() {
  const c = getCtx()
  const t = c.currentTime

  const freq = PENTATONIC[tickIdx % PENTATONIC.length]
  tickIdx++

  const osc = c.createOscillator()
  const gain = c.createGain()
  const filter = c.createBiquadFilter()

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(c.destination)

  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, t)
  osc.frequency.exponentialRampToValueAtTime(freq * 0.98, t + 0.06)

  filter.type = 'lowpass'
  filter.frequency.value = 3000

  gain.gain.setValueAtTime(0.07, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)

  osc.start(t)
  osc.stop(t + 0.08)
}

/** 카드 확정 — 맑은 차임벨 */
export function playReveal() {
  const c = getCtx()
  const t = c.currentTime

  // 3개 음을 살짝 어긋나게 쳐서 차임 느낌
  const freqs = [523.25, 659.25, 783.99] // C5, E5, G5
  freqs.forEach((freq, i) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)

    osc.type = 'sine'
    osc.frequency.value = freq

    const start = t + i * 0.04
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.1, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4)

    osc.start(start)
    osc.stop(start + 0.4)
  })
}

/** 셔플 배경 틱 루프 */
export function startShuffleLoop() {
  const id = setInterval(playTick, 100)
  return () => clearInterval(id)
}
