import { useCallback } from 'react'
import { enqueue } from '../utils/downloadQueue'

export default function DownloadButton({ disabled, inline, label }: { disabled?: boolean; inline?: boolean; label?: string } = {}) {
  const handleDownload = useCallback(() => {
    const container = document.querySelector('[data-capture]') as HTMLElement | null
    if (!container) return
    enqueue(container, label || 'page')
  }, [label])

  const btn = (
    <button
      onClick={handleDownload}
      disabled={disabled}
      className={`flex items-center gap-1.5 border-none px-5 py-2.5 rounded-lg font-display text-[13px] font-semibold transition-all shadow-md print:hidden
        ${disabled ? 'bg-ink/20 text-ink/30 cursor-not-allowed' : 'bg-ink text-bg cursor-pointer hover:bg-[#2A3D2A] hover:-translate-y-0.5'}`}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      다운로드
    </button>
  )

  if (inline) return btn
  return <div className="flex justify-end mb-3 print:hidden">{btn}</div>
}
