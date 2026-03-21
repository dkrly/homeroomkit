import { useState, useRef } from 'react'
import { exportData, importData } from '../../store'

function getTimestamp() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}`
}

export default function ResetTab() {
  const [confirm, setConfirm] = useState(false)
  const [done, setDone] = useState(false)
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleReset = () => {
    localStorage.removeItem('homeroomkit')
    localStorage.removeItem('homeroomkit-zoom')
    setDone(true)
    setTimeout(() => { window.location.href = window.location.pathname }, 800)
  }

  const handleExport = () => {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `homeroomkit_backup_${getTimestamp()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const handleImport = () => {
    fileRef.current?.click()
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        importData(reader.result as string)
        setImportMsg({ ok: true, text: '불러오기 완료' })
      } catch {
        setImportMsg({ ok: false, text: '올바른 백업 파일이 아닙니다' })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="py-8 flex flex-col gap-6">
      {/* 백업 / 복원 */}
      <div className="rounded-xl p-6" style={{ background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
        <h3 className="text-lg font-bold mb-2" style={{ color: '#0C4A6E' }}>데이터 백업 / 복원</h3>
        <p className="text-sm mb-4" style={{ color: '#0C4A6E', opacity: 0.7 }}>
          현재 데이터를 JSON 파일로 내보내거나, 백업 파일에서 복원할 수 있습니다.<br />
          기기 변경, 브라우저 초기화 등에 대비하세요.
        </p>
        <div className="flex items-center gap-3">
          <button onClick={handleExport}
            className="px-5 py-2.5 rounded-lg font-bold text-sm border-none cursor-pointer"
            style={{ background: '#0284C7', color: '#fff' }}>
            내보내기
          </button>
          <button onClick={handleImport}
            className="px-5 py-2.5 rounded-lg font-bold text-sm border-none cursor-pointer"
            style={{ background: '#fff', color: '#0284C7', border: '1px solid #0284C7' }}>
            불러오기
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={onFileChange} className="hidden" />
          {importMsg && (
            <span className="text-sm font-bold" style={{ color: importMsg.ok ? '#059669' : '#DC2626' }}>
              {importMsg.text}
            </span>
          )}
        </div>
      </div>

      {/* 초기화 */}
      <div className="rounded-xl p-6" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
        <h3 className="text-lg font-bold mb-2" style={{ color: '#991B1B' }}>데이터 초기화</h3>
        <p className="text-sm mb-1" style={{ color: '#991B1B' }}>
          이 작업은 <strong>되돌릴 수 없습니다.</strong>
        </p>
        <p className="text-sm mb-4" style={{ color: '#7F1D1D', opacity: 0.7 }}>
          학생 목록, 역할 배정, 자리 배치, 빙고 질문, 줌 설정 등<br />
          이 브라우저에 저장된 모든 데이터가 삭제됩니다.
        </p>

        {done ? (
          <p className="text-sm font-bold" style={{ color: '#991B1B' }}>초기화 완료. 새로고침 중...</p>
        ) : !confirm ? (
          <button onClick={() => setConfirm(true)}
            className="px-5 py-2.5 rounded-lg font-bold text-sm border-none cursor-pointer"
            style={{ background: '#DC2626', color: '#fff' }}>
            전체 초기화
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold" style={{ color: '#991B1B' }}>정말 모든 데이터를 삭제하시겠습니까?</span>
            <button onClick={handleReset}
              className="px-5 py-2.5 rounded-lg font-bold text-sm border-none cursor-pointer"
              style={{ background: '#991B1B', color: '#fff' }}>
              삭제
            </button>
            <button onClick={() => setConfirm(false)}
              className="px-4 py-2.5 rounded-lg text-sm border-none cursor-pointer"
              style={{ background: '#E5E7EB', color: '#374151' }}>
              취소
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
