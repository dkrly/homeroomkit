import { useCallback, useState, useEffect } from 'react'
import { toPng } from 'html-to-image'

type Phase = 'idle' | 'preparing' | 'capturing' | 'done'

export default function DownloadButton({ disabled, inline }: { disabled?: boolean; inline?: boolean } = {}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)

  // 프로그레스 애니메이션 (캡처 중 시각 피드백)
  useEffect(() => {
    if (phase !== 'capturing') return
    setProgress(0)
    let frame: number
    let start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      // 점차 느려지는 곡선 (최대 90%까지, 나머진 완료 시 100%)
      setProgress(Math.min(90, (elapsed / 80) ** 0.5 * 10))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [phase])

  const handleDownload = useCallback(async () => {
    const container = document.querySelector('[data-capture]') as HTMLElement | null
    if (!container) return

    setPhase('preparing')
    // zoom 제거
    const zoomEl = container.closest('[style*="zoom"]') as HTMLElement | null
    const origZoom = zoomEl?.style.zoom || ''
    if (zoomEl) zoomEl.style.zoom = '1'

    // 1프레임 대기 (리플로우)
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

      setTimeout(() => setPhase('idle'), 1500)
    } catch {
      setPhase('idle')
    } finally {
      if (zoomEl) zoomEl.style.zoom = origZoom
    }
  }, [])

  const busy = phase !== 'idle'

  const btn = (
    <button
      onClick={handleDownload}
      disabled={disabled || busy}
      className={`flex items-center gap-1.5 border-none px-5 py-2.5 rounded-lg font-display text-[13px] font-semibold transition-all shadow-md print:hidden
        ${disabled || busy ? 'bg-ink/20 text-ink/30 cursor-not-allowed' : 'bg-ink text-bg cursor-pointer hover:bg-[#2A3D2A] hover:-translate-y-0.5'}`}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      다운로드
    </button>
  )

  return (
    <>
      {inline ? btn : <div className="flex justify-end mb-3 print:hidden">{btn}</div>}

      {/* 프로그레스 오버레이 */}
      {busy && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center print:hidden"
          style={{ background: 'rgba(246,247,242,0.85)', backdropFilter: 'blur(4px)' }}>
          <div className="flex flex-col items-center gap-4">
            <div className="w-56 h-2 rounded-full overflow-hidden" style={{ background: '#ddd' }}>
              <div className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: phase === 'done' ? '#4E9B7E' : '#1E2A1E',
                }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: '#1E2A1E' }}>
              {phase === 'preparing' ? '준비 중...'
                : phase === 'done' ? '완료!'
                : `이미지 생성 중... ${Math.round(progress)}%`}
            </span>
          </div>
        </div>
      )}
    </>
  )
}
