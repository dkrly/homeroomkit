import { useCallback, useState } from 'react'
import { toPng } from 'html-to-image'

export default function DownloadButton({ disabled, inline }: { disabled?: boolean; inline?: boolean } = {}) {
  const [saving, setSaving] = useState(false)

  const handleDownload = useCallback(async () => {
    const container = document.querySelector('[data-capture]') as HTMLElement | null
    if (!container) return

    setSaving(true)
    try {
      const dataUrl = await toPng(container, {
        pixelRatio: 1,
        backgroundColor: '#F6F7F2',
      })
      const link = document.createElement('a')
      const now = new Date()
      const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
      link.download = `homeroomkit_${ts}.png`
      link.href = dataUrl
      link.click()
    } finally {
      setSaving(false)
    }
  }, [])

  const btn = (
    <button
      onClick={handleDownload}
      disabled={disabled || saving}
      className={`flex items-center gap-1.5 border-none px-5 py-2.5 rounded-lg font-display text-[13px] font-semibold transition-all shadow-md
        ${disabled || saving ? 'bg-ink/20 text-ink/30 cursor-not-allowed' : 'bg-ink text-bg cursor-pointer hover:bg-[#2A3D2A] hover:-translate-y-0.5'}`}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      {saving ? '저장 중...' : 'PNG 저장'}
    </button>
  )

  if (inline) return btn
  return <div className="flex justify-end mb-3">{btn}</div>
}
