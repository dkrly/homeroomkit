import { useState } from 'react'
import { disconnectSheet, refreshSheet, useSheet } from '../sheet/client'

function ago(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000)
  if (sec < 60) return '방금'
  if (sec < 3600) return `${Math.floor(sec / 60)}분 전`
  if (sec < 86400) return `${Math.floor(sec / 3600)}시간 전`
  return `${Math.floor(sec / 86400)}일 전`
}

/** 드로어 하단에 붙는 시트 동기화 상태 */
export default function SheetStatus() {
  const { fetchedAt, loading, error } = useSheet()
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => void refreshSheet()}
          disabled={loading}
          className="flex-1 h-9 rounded-lg flex items-center justify-center gap-2 border-none cursor-pointer text-[12px] font-semibold bg-bg/8 text-bg/60 hover:bg-bg/15 hover:text-bg transition-colors disabled:opacity-40"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-3-6.7" /><polyline points="21 3 21 9 15 9" />
          </svg>
          {loading ? '동기화 중' : '시트 새로고침'}
        </button>
        <button
          onClick={() => setConfirmDisconnect(v => !v)}
          title="시트 연결 해제"
          className="w-9 h-9 rounded-lg border-none cursor-pointer text-[12px] bg-bg/8 text-bg/40 hover:bg-bg/15 hover:text-bg transition-colors"
        >
          ⚙
        </button>
      </div>

      {error ? (
        <p className="text-[10px] leading-snug text-danger/90">{error}</p>
      ) : (
        <p className="text-[10px] text-bg/25">
          {fetchedAt ? `시트 동기화 ${ago(fetchedAt)}` : '아직 동기화되지 않음'}
        </p>
      )}

      {confirmDisconnect && (
        <button
          onClick={() => { disconnectSheet(); window.location.reload() }}
          className="h-8 rounded-lg border-none cursor-pointer text-[11px] font-bold"
          style={{ background: '#7F1D1D', color: '#fff' }}
        >
          시트 연결 해제
        </button>
      )}
    </div>
  )
}
