import { useEffect, useRef, useState, useCallback } from 'react'

/* ── types ── */
interface FallingItem {
  id: number
  x: number
  y: number
  type: 'star' | 'bomb'
  size: number
}

/* ── micro:bit serial ── */
function useMicrobit() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const portRef = useRef<any>(null)
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null)
  const [connected, setConnected] = useState(false)
  const dataRef = useRef({ x: 0, a: false, b: false })

  const connect = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const port = await (navigator as any).serial.requestPort({
        filters: [{ usbVendorId: 0x0d28 }],
      })
      await port.open({ baudRate: 115200 })
      portRef.current = port
      setConnected(true)

      const decoder = new TextDecoderStream()
      port.readable!.pipeTo(decoder.writable)
      const reader = decoder.readable.getReader()
      readerRef.current = reader

      let buf = ''
      const read = async () => {
        try {
          while (true) {
            const { value, done } = await reader.read()
            if (done) break
            buf += value
            const lines = buf.split('\n')
            buf = lines.pop()!
            for (const line of lines) {
              const parts = line.trim().split(',')
              if (parts.length === 3) {
                dataRef.current = {
                  x: parseInt(parts[0]) || 0,
                  a: parts[1] === '1',
                  b: parts[2] === '1',
                }
              }
            }
          }
        } catch { /* port closed */ }
      }
      read()
    } catch { /* user cancelled */ }
  }, [])

  const disconnect = useCallback(async () => {
    readerRef.current?.cancel()
    await portRef.current?.close()
    portRef.current = null
    setConnected(false)
  }, [])

  return { connected, connect, disconnect, dataRef }
}

/* ── constants ── */
const W = 730
const H = 1000
const PLAYER_W = 60
const SPEED = 6
const SPAWN_INTERVAL = 600
const FALL_SPEED_BASE = 3
const TILT_THRESHOLD = 150
const TILT_SCALE = 0.012

/* ── component ── */
export default function StarCatcher() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { connected, connect, disconnect, dataRef } = useMicrobit()

  const gameRef = useRef({
    playerX: W / 2,
    items: [] as FallingItem[],
    score: 0,
    lives: 3,
    nextId: 0,
    spawnTimer: 0,
    gameOver: false,
    shield: false,
    shieldTimer: 0,
    combo: 0,
    maxCombo: 0,
    difficulty: 1,
    frameCount: 0,
  })
  const keysRef = useRef(new Set<string>())

  const resetGame = useCallback(() => {
    const g = gameRef.current
    g.playerX = W / 2
    g.items = []
    g.score = 0
    g.lives = 3
    g.gameOver = false
    g.shield = false
    g.shieldTimer = 0
    g.combo = 0
    g.maxCombo = 0
    g.difficulty = 1
    g.frameCount = 0
    g.spawnTimer = 0
  }, [])

  /* keyboard fallback */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key)
      if (e.key === ' ' && gameRef.current.gameOver) resetGame()
    }
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [resetGame])

  /* main game loop */
  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let raf: number

    const loop = () => {
      const g = gameRef.current
      const keys = keysRef.current
      const mb = dataRef.current

      if (!g.gameOver) {
        g.frameCount++
        g.difficulty = 1 + Math.floor(g.score / 10) * 0.2

        /* ── player movement ── */
        let dx = 0
        if (keys.has('ArrowLeft')) dx -= SPEED
        if (keys.has('ArrowRight')) dx += SPEED
        if (keys.has('a') || keys.has('A')) {
          if (!g.shield && g.shieldTimer <= 0) {
            g.shield = true
            g.shieldTimer = 120
          }
        }

        // micro:bit tilt
        if (connected) {
          if (Math.abs(mb.x) > TILT_THRESHOLD) {
            dx += mb.x * TILT_SCALE * SPEED
          }
          if (mb.a && !g.shield && g.shieldTimer <= 0) {
            g.shield = true
            g.shieldTimer = 120
          }
          if (mb.b && g.gameOver) resetGame()
        }

        g.playerX = Math.max(PLAYER_W / 2, Math.min(W - PLAYER_W / 2, g.playerX + dx))

        /* ── shield timer ── */
        if (g.shield) {
          g.shieldTimer--
          if (g.shieldTimer <= 0) {
            g.shield = false
            g.shieldTimer = 180 // cooldown
          }
        } else if (g.shieldTimer > 0) {
          g.shieldTimer--
        }

        /* ── spawn items ── */
        g.spawnTimer++
        const interval = Math.max(200, SPAWN_INTERVAL - g.difficulty * 40)
        if (g.spawnTimer > interval / 16) {
          g.spawnTimer = 0
          const isBomb = Math.random() < 0.25 + g.difficulty * 0.03
          g.items.push({
            id: g.nextId++,
            x: Math.random() * (W - 60) + 30,
            y: -30,
            type: isBomb ? 'bomb' : 'star',
            size: isBomb ? 28 : 22,
          })
        }

        /* ── update items ── */
        const fallSpeed = FALL_SPEED_BASE + g.difficulty * 0.5
        g.items = g.items.filter(item => {
          item.y += fallSpeed

          // collision check
          const cdx = item.x - g.playerX
          const cdy = item.y - (H - 60)
          const dist = Math.sqrt(cdx * cdx + cdy * cdy)

          if (dist < item.size + PLAYER_W / 2 - 5) {
            if (item.type === 'star') {
              g.combo++
              g.maxCombo = Math.max(g.maxCombo, g.combo)
              g.score += g.combo >= 5 ? 3 : g.combo >= 3 ? 2 : 1
              return false
            } else {
              if (g.shield) return false
              g.lives--
              g.combo = 0
              if (g.lives <= 0) g.gameOver = true
              return false
            }
          }

          if (item.y > H + 30) {
            if (item.type === 'star') g.combo = 0
            return false
          }
          return true
        })
      } else {
        if (connected && dataRef.current.b) resetGame()
      }

      /* ── draw ── */
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, W, H)

      // background stars
      for (let i = 0; i < 50; i++) {
        const sx = (i * 137.5) % W
        const sy = ((i * 97.3 + g.frameCount * 0.2) % H)
        ctx.fillStyle = `rgba(255,255,255,${0.1 + (i % 5) * 0.05})`
        ctx.beginPath()
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2)
        ctx.fill()
      }

      if (!g.gameOver) {
        for (const item of g.items) {
          if (item.type === 'star') drawStar(ctx, item.x, item.y, item.size, g.frameCount)
          else drawBomb(ctx, item.x, item.y, item.size)
        }

        drawPlayer(ctx, g.playerX, H - 60, g.shield)

        // HUD
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 28px "Outfit", sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(`${g.score}`, 20, 44)

        ctx.font = '20px sans-serif'
        ctx.fillText('\u2764\uFE0F'.repeat(g.lives), 20, 78)

        if (g.combo >= 3) {
          ctx.textAlign = 'center'
          ctx.fillStyle = '#ffd700'
          ctx.font = 'bold 22px "Outfit", sans-serif'
          ctx.fillText(`${g.combo} COMBO!`, W / 2, 44)
        }

        ctx.textAlign = 'right'
        if (g.shield) {
          ctx.fillStyle = '#7ec8e3'
          ctx.font = 'bold 18px sans-serif'
          ctx.fillText('SHIELD', W - 20, 44)
        } else if (g.shieldTimer > 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.3)'
          ctx.font = '14px sans-serif'
          ctx.fillText(`shield ${Math.ceil(g.shieldTimer / 60)}s`, W - 20, 44)
        } else {
          ctx.fillStyle = 'rgba(126,200,227,0.6)'
          ctx.font = '14px sans-serif'
          ctx.fillText(connected ? 'A: shield' : 'A key: shield', W - 20, 44)
        }
      } else {
        ctx.textAlign = 'center'
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 52px "Outfit", sans-serif'
        ctx.fillText('GAME OVER', W / 2, H / 2 - 60)

        ctx.font = 'bold 36px "Outfit", sans-serif'
        ctx.fillStyle = '#ffd700'
        ctx.fillText(`${g.score}`, W / 2, H / 2)

        if (g.maxCombo >= 3) {
          ctx.font = '22px sans-serif'
          ctx.fillStyle = '#ffa500'
          ctx.fillText(`Max Combo: ${g.maxCombo}`, W / 2, H / 2 + 40)
        }

        ctx.font = '20px sans-serif'
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.fillText(connected ? 'B button: restart' : 'Space: restart', W / 2, H / 2 + 90)
      }

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [connected, resetGame, dataRef])

  return (
    <div className="page" style={{ padding: '20px 32px 24px', gap: 0 }}>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-[22px] font-bold text-ink font-display tracking-tight">
          Star Catcher
        </h1>
        <button
          onClick={connected ? disconnect : connect}
          className="btn-action text-[13px] px-4 py-2"
          style={{ backgroundColor: connected ? '#e74c3c' : '#2ecc71' }}
        >
          {connected ? 'micro:bit 연결 해제' : 'micro:bit 연결'}
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-lg"
        style={{ width: W, height: H }}
        tabIndex={0}
      />

      <div className="flex justify-center gap-6 mt-2 text-[12px] text-ink/40">
        <span>micro:bit: 기울이기=이동, A=보호막, B=재시작</span>
        <span>키보드: 화살표=이동, A=보호막, Space=재시작</span>
      </div>
    </div>
  )
}

/* ── draw helpers ── */

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, frame: number) {
  const glow = Math.sin(frame * 0.1) * 0.3 + 0.7
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(frame * 0.03)
  ctx.shadowColor = '#ffd700'
  ctx.shadowBlur = 12 * glow

  ctx.fillStyle = '#ffd700'
  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
    ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size)
    const midAngle = angle + (2 * Math.PI) / 5
    ctx.lineTo(Math.cos(midAngle) * (size * 0.4), Math.sin(midAngle) * (size * 0.4))
  }
  ctx.closePath()
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.restore()
}

function drawBomb(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save()
  ctx.translate(x, y)

  ctx.fillStyle = '#333'
  ctx.beginPath()
  ctx.arc(0, 0, size, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#555'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.strokeStyle = '#ff6b35'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(size * 0.5, -size * 0.5)
  ctx.quadraticCurveTo(size * 0.8, -size * 1.2, size * 0.2, -size * 1.3)
  ctx.stroke()

  ctx.fillStyle = '#ff4444'
  ctx.shadowColor = '#ff4444'
  ctx.shadowBlur = 8
  ctx.beginPath()
  ctx.arc(size * 0.2, -size * 1.3, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.fillStyle = '#aaa'
  ctx.font = `${size}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('x', 0, 2)

  ctx.restore()
}

function drawPlayer(ctx: CanvasRenderingContext2D, x: number, y: number, shield: boolean) {
  ctx.save()
  ctx.translate(x, y)

  if (shield) {
    ctx.strokeStyle = 'rgba(126,200,227,0.6)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(0, 0, 42, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = 'rgba(126,200,227,0.1)'
    ctx.fill()
  }

  ctx.fillStyle = '#7ec8e3'
  ctx.beginPath()
  ctx.arc(0, -8, 20, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#1a1a2e'
  ctx.beginPath()
  ctx.arc(-7, -12, 3.5, 0, Math.PI * 2)
  ctx.arc(7, -12, 3.5, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#1a1a2e'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(0, -6, 8, 0.2, Math.PI - 0.2)
  ctx.stroke()

  ctx.fillStyle = '#5ba3c9'
  ctx.beginPath()
  ctx.moveTo(-24, 12)
  ctx.lineTo(24, 12)
  ctx.lineTo(18, 22)
  ctx.lineTo(-18, 22)
  ctx.closePath()
  ctx.fill()

  ctx.restore()
}
