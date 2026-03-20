import { useCallback, useState, useEffect } from 'react'
import { toPng } from 'html-to-image'

type Phase = 'idle' | 'capturing' | 'done'

export default function DownloadButton({ disabled, inline }: { disabled?: boolean; inline?: boolean } = {}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (phase !== 'capturing') return
    setProgress(0)
    let frame: number
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      setProgress(Math.min(95, (elapsed / 100) ** 0.5 * 10))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [phase])

  const handleDownload = useCallback(async () => {
    const container = document.querySelector('[data-capture]') as HTMLElement | null
    if (!container) return

    // zoom 임시 제거
    const zoomEl = container.closest('[style*="zoom"]') as HTMLElement | null
    const origZoom = zoomEl?.style.zoom || ''
    if (zoomEl) zoomEl.style.zoom = '1'
    await new Promise(r => requestAnimationFrame(r))

    setPhase('capturing')

    try {
      const dataUrl = await toPng(container, {
        pixelRatio: 2,
        backgroundColor: '#F6F7F2',
      })

      setProgress(100)
      setPhase('done')

      const link = document.createElement('a')
      const now = new Date()
      const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
      link.download = `homeroomkit_${ts}.png`
      link.href = dataUrl
      link.click()

      setTimeout(() => setPhase('idle'), 1200)
    } catch {
      setPhase('idle')
    } finally {
      if (zoomEl) zoomEl.style.zoom = origZoom
    }
  }, [])

  const busy = phase !== 'idle'
  const label = phase === 'capturing' ? `${Math.round(progress)}%`
    : phase === 'done' ? '완료!' : '다운로드'

  const btn = (
    <button
      onClick={handleDownload}
      disabled={disabled || busy}
      className={`flex items-center gap-1.5 border-none px-5 py-2.5 rounded-lg font-display text-[13px] font-semibold transition-all shadow-md print:hidden
        ${disabled || busy ? 'bg-ink/20 text-ink/30 cursor-not-allowed' : 'bg-ink text-bg cursor-pointer hover:bg-[#2A3D2A] hover:-translate-y-0.5'}`}
    >
      {busy ? (
        <>
          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(30,42,30,0.15)' }}>
            <div className="h-full rounded-full transition-all duration-200"
              style={{ width: `${progress}%`, background: phase === 'done' ? '#4E9B7E' : '#1E2A1E' }} />
          </div>
          <span className="text-[11px]">{label}</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          다운로드
        </>
      )}
    </button>
  )

  if (inline) return btn
  return <div className="flex justify-end mb-3 print:hidden">{btn}</div>
}
