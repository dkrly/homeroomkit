import { useState } from 'react'

export default function ResetTab() {
  const [confirm, setConfirm] = useState(false)
  const [done, setDone] = useState(false)

  const handleReset = () => {
    localStorage.removeItem('homeroomkit')
    localStorage.removeItem('homeroomkit-zoom')
    setDone(true)
    setTimeout(() => { window.location.href = window.location.pathname }, 800)
  }

  return (
    <div className="py-8">
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
