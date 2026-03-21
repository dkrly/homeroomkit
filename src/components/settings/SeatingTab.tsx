import { useState, useMemo } from 'react'
import { useAppData, setData } from '../../store'
import { buildDisabled } from '../../utils/seating'

export default function SeatingTab() {
  const { seating, students } = useAppData()
  const [r, setR] = useState(seating.rows)
  const [c, setC] = useState(seating.cols)

  const total = r * c
  const dis = buildDisabled(students.length, total)
  const active = total - dis.length

  const saveSeating = (rows: number, cols: number) => {
    setData({ seating: { ...seating, rows, cols, disabled: buildDisabled(students.length, rows * cols), fixed: {} } })
  }

  const handleRowChange = (v: number) => {
    const nr = Math.max(1, Math.min(10, v))
    setR(nr)
    saveSeating(nr, c)
  }

  const handleColChange = (v: number) => {
    const nc = Math.max(1, Math.min(10, v))
    setC(nc)
    saveSeating(r, nc)
  }

  return (
    <div>
      <p className="text-sm text-ink/50 mb-3">자리 배치 그리드 크기</p>
      <div className="flex items-center gap-3 mb-3">
        <label className="text-sm font-bold text-ink/60">
          행
          <input
            type="number" min={1} max={10} value={r}
            onChange={e => handleRowChange(Number(e.target.value))}
            className="ml-1 w-14 px-2 py-1.5 rounded border border-border text-center text-sm"
          />
        </label>
        <span className="text-ink/30 font-bold text-lg">×</span>
        <label className="text-sm font-bold text-ink/60">
          열
          <input
            type="number" min={1} max={10} value={c}
            onChange={e => handleColChange(Number(e.target.value))}
            className="ml-1 w-14 px-2 py-1.5 rounded border border-border text-center text-sm"
          />
        </label>
        <span className="text-sm text-ink/40">= {total}석 (활성 {active}, 학생 {students.length}명)</span>
      </div>
      {active !== students.length && (
        <p className="text-xs text-danger mb-2">활성 좌석({active})과 학생 수({students.length})가 다릅니다.</p>
      )}

      <AdvancedOptions />
    </div>
  )
}

function AdvancedOptions() {
  const [open, setOpen] = useState(false)
  const { seating } = useAppData()
  const distanced = seating.distanced || []

  return (
    <div className="mt-5">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm font-bold border-none cursor-pointer bg-transparent"
        style={{ color: '#1E2A1E', opacity: 0.5 }}>
        <span style={{ display: 'inline-block', transition: 'transform .2s', transform: open ? 'rotate(90deg)' : '' }}>▶</span>
        추가 옵션
        {distanced.length > 0 && <span className="text-[10px] opacity-60">({distanced.length})</span>}
      </button>
      {open && <DistancingEditor />}
    </div>
  )
}

function DistancingEditor() {
  const { seating, students } = useAppData()
  const studentNums = useMemo(() => new Set(students.map(s => s.num)), [students])
  const distanced = useMemo(() => {
    const raw = seating.distanced || []
    const valid = raw.filter(([a, b]) => studentNums.has(a) && studentNums.has(b))
    if (valid.length !== raw.length) {
      setData({ seating: { ...seating, distanced: valid } })
    }
    return valid
  }, [seating, studentNums]) // eslint-disable-line
  const [selA, setSelA] = useState<number | null>(null)
  const [selB, setSelB] = useState<number | null>(null)

  const addPair = () => {
    if (selA === null || selB === null || selA === selB) return
    const pair: [number, number] = selA < selB ? [selA, selB] : [selB, selA]
    if (distanced.some(([a, b]) => a === pair[0] && b === pair[1])) return
    setData({ seating: { ...seating, distanced: [...distanced, pair] } })
    setSelA(null)
    setSelB(null)
  }

  const removePair = (idx: number) => {
    setData({ seating: { ...seating, distanced: distanced.filter((_, i) => i !== idx) } })
  }

  const getName = (num: number) => students.find(s => s.num === num)?.name ?? `${num}번`

  return (
    <div className="mt-6 pt-5" style={{ borderTop: '1px solid #E5E7EB' }}>
      <p className="text-sm font-bold text-ink mb-1">거리두기</p>
      <p className="text-xs text-ink/40 mb-3">선택한 두 학생을 자리 셔플 시 인접하지 않게 배정합니다</p>

      {distanced.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-4">
          {distanced.map(([a, b], i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
              <span className="text-sm font-bold" style={{ color: '#991B1B' }}>
                {a}번 {getName(a)}
              </span>
              <span className="text-xs" style={{ color: '#991B1B', opacity: 0.5 }}>↔</span>
              <span className="text-sm font-bold" style={{ color: '#991B1B' }}>
                {b}번 {getName(b)}
              </span>
              <button onClick={() => removePair(i)}
                className="ml-auto text-xs border-none cursor-pointer rounded px-2 py-1"
                style={{ background: '#DC2626', color: '#fff' }}>
                삭제
              </button>
            </div>
          ))}
        </div>
      )}

      {students.length > 0 && (
        <div className="flex items-center gap-2">
          <select value={selA ?? ''} onChange={e => setSelA(e.target.value ? Number(e.target.value) : null)}
            className="px-2 py-1.5 rounded border border-border text-sm">
            <option value="">학생 1</option>
            {students.map(s => <option key={s.num} value={s.num}>{s.num} {s.name}</option>)}
          </select>
          <span className="text-ink/30 font-bold">↔</span>
          <select value={selB ?? ''} onChange={e => setSelB(e.target.value ? Number(e.target.value) : null)}
            className="px-2 py-1.5 rounded border border-border text-sm">
            <option value="">학생 2</option>
            {students.filter(s => s.num !== selA).map(s => <option key={s.num} value={s.num}>{s.num} {s.name}</option>)}
          </select>
          <button onClick={addPair}
            disabled={selA === null || selB === null || selA === selB}
            className="px-3 py-1.5 rounded-lg text-sm font-bold border-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: '#1E2A1E', color: '#F6F7F2' }}>
            추가
          </button>
        </div>
      )}
    </div>
  )
}
