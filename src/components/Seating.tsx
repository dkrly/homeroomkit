import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAppData, setData } from '../store'
import type { Student } from '../store'
import { getStudentColor } from '../utils/colors'
import { shuffleWithDistancing } from '../utils/distancing'
import { useShuffleReveal } from '../utils/useShuffleReveal'
import { buildDisabled } from '../utils/seating'
import PageHeader from './PageHeader'
import PrintButton from './PrintButton'

const SEATING_REVEAL_INTERVAL = 200
const ROLLING_TICK_INTERVAL = 60

function loadSeatingResult(data: ReturnType<typeof useAppData>): { assigned: Map<number, Student>; phase: 'ready' | 'done' } {
  const sr = data.seatingResult
  if (!sr || sr.phase !== 'done') return { assigned: new Map(), phase: 'ready' }
  const m = new Map<number, Student>()
  for (const [k, v] of Object.entries(sr.assigned)) m.set(Number(k), v)
  return { assigned: m, phase: 'done' }
}

export default function Seating() {
  const appData = useAppData()
  const { students, seating } = appData
  const { rows, cols, disabled, fixed } = seating

  const studentByNum = useMemo(() => new Map(students.map(s => [s.num, s])), [students])
  const totalSeats = rows * cols
  const disabledSet = useMemo(() => new Set(disabled), [disabled])

  const activeIndices = useMemo(() => {
    const arr: number[] = []
    for (let i = 0; i < totalSeats; i++) if (!disabledSet.has(i)) arr.push(i)
    return arr
  }, [totalSeats, disabledSet])

  const activeOrderMap = useMemo(() => {
    const m = new Map<number, number>()
    activeIndices.forEach((idx, order) => m.set(idx, order))
    return m
  }, [activeIndices])

  const savedResult = useMemo(() => loadSeatingResult(appData), []) // eslint-disable-line

  const [fixingIdx, setFixingIdx] = useState<number | null>(null)
  const [assigned, setAssignedState] = useState<Map<number, Student>>(savedResult.assigned)

  const setAssigned = useCallback((m: Map<number, Student>) => {
    setAssignedState(m)
  }, [])

  const saveResult = useCallback((m: Map<number, Student>, p: 'ready' | 'done') => {
    const obj: Record<string, { num: number; name: string }> = {}
    for (const [k, v] of m) obj[String(k)] = { num: v.num, name: v.name }
    setData({ seatingResult: p === 'done' ? { assigned: obj, phase: 'done' } : null })
  }, [])

  const { phase, stoppedUpTo, startSpin: startShuffleReveal, stopSpin, reset: resetShuffle, finishImmediately } = useShuffleReveal({
    itemCount: activeIndices.length,
    revealInterval: SEATING_REVEAL_INTERVAL,
    initialPhase: savedResult.phase,
    initialStoppedUpTo: savedResult.phase === 'done' ? activeIndices.length : -1,
  })

  // done 시 localStorage 저장
  useEffect(() => {
    if (phase === 'done' && assigned.size > 0) saveResult(assigned, 'done')
  }, [phase]) // eslint-disable-line

  // 초기화: 학생 수만큼 자동 활성화
  useEffect(() => {
    if (disabled.length === 0 && students.length < totalSeats) {
      setData({ seating: { ...seating, disabled: buildDisabled(students.length, totalSeats) } })
    }
  }, []) // eslint-disable-line

  const toggleSeat = (idx: number) => {
    if (phase !== 'ready') return
    const next = new Set(disabledSet)
    if (next.has(idx)) {
      next.delete(idx)
    } else {
      next.add(idx)
      const nextFixed = { ...fixed }
      delete nextFixed[idx]
      setData({ seating: { ...seating, disabled: [...next], fixed: nextFixed } })
      return
    }
    setData({ seating: { ...seating, disabled: [...next] } })
  }

  const fixStudent = (seatIdx: number, studentNum: number | null) => {
    const nextFixed = { ...fixed }
    if (studentNum === null) {
      delete nextFixed[seatIdx]
    } else {
      nextFixed[seatIdx] = studentNum
    }
    setData({ seating: { ...seating, fixed: nextFixed } })
    setFixingIdx(null)
  }

  const fixedNums = useMemo(() => new Set(Object.values(fixed)), [fixed])

  // 고정 좌석 결과를 미리 계산하는 헬퍼
  const buildFixedResult = useCallback(() => {
    const fixedEntries = Object.entries(fixed).map(([k, v]) => [Number(k), v] as [number, number])
    const usedNums = new Set(fixedEntries.map(([, v]) => v))
    const result = new Map<number, Student>()
    for (const [seatIdx, num] of fixedEntries) {
      const s = studentByNum.get(num)
      if (s) result.set(seatIdx, s)
    }
    return { result, usedNums }
  }, [fixed, studentByNum])

  const assignByOrder = useCallback(() => {
    const { result, usedNums } = buildFixedResult()
    const sorted = students.filter(s => !usedNums.has(s.num)).sort((a, b) => a.num - b.num)

    // 세로(분단별) 순서로 배정: 열 우선 순회
    const colFirst: number[] = []
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const idx = r * cols + c
        if (!disabledSet.has(idx)) colFirst.push(idx)
      }
    }
    let studentIdx = 0
    for (const idx of colFirst) {
      if (result.has(idx)) continue
      if (studentIdx < sorted.length) result.set(idx, sorted[studentIdx++])
    }

    setAssigned(result)
    finishImmediately()
  }, [buildFixedResult, students, cols, rows, disabledSet, finishImmediately, setAssigned])

  const startSpin = useCallback(() => {
    const { result } = buildFixedResult()
    const a = shuffleWithDistancing(students, activeIndices, result, seating.distanced || [], cols)
    setAssigned(a)
    startShuffleReveal()
  }, [buildFixedResult, students, activeIndices, seating, cols, startShuffleReveal, setAssigned])

  const handleReset = useCallback(() => {
    if (phase === 'done' || phase === 'ready') {
      if (!window.confirm('초기화하시겠습니까?')) return
      setData({ seating: { ...seating, fixed: {} }, seatingResult: null })
      resetShuffle()
      setAssigned(new Map())
    }
  }, [phase, seating, resetShuffle])

  const isSetup = phase === 'ready'
  const canStart = isSetup && activeIndices.length === students.length

  return (
    <div>
      {/* 컨트롤 */}
      <div className="flex items-center gap-2 mb-3 print:hidden">
        <div className="flex gap-2 ml-auto">
          <button onClick={assignByOrder} disabled={!canStart}
            className={`btn-action ${!canStart ? 'bg-ink/30 cursor-not-allowed' : 'bg-ink/20 !text-ink hover:bg-ink/30'}`}>
            번호순
          </button>
          <button onClick={startSpin} disabled={!canStart}
            className={`btn-action ${!canStart ? 'bg-ink/30 cursor-not-allowed' : 'bg-success hover:bg-success-hover'}`}>
            시작
          </button>
          <button onClick={stopSpin} disabled={phase !== 'spinning'}
            className={`btn-action ${phase !== 'spinning' ? 'bg-ink/30 cursor-not-allowed' : 'bg-danger hover:bg-danger-hover'}`}>
            멈춰
          </button>
          <button onClick={handleReset} disabled={phase === 'spinning' || phase === 'stopping'}
            className={`btn-action ${phase === 'spinning' || phase === 'stopping' ? 'bg-ink/10 !text-ink/30 cursor-not-allowed' : 'bg-ink/20 !text-ink hover:bg-ink/30'}`}>
            초기화
          </button>
          <PrintButton disabled={phase !== 'done'} inline />
        </div>
      </div>

      <div className="page h-[calc(100vh-7rem)] print:!h-[1123px]">
        <PageHeader badge="Seat" title="자리 배치표"
          extra={activeIndices.length !== students.length
            ? <span className="text-xs text-danger print:hidden">좌석 {activeIndices.length} ≠ 학생 {students.length}명</span>
            : undefined}
        />
        <div className="flex justify-center mb-3">
          <div className="px-10 py-2 bg-ink/10 rounded-lg text-sm font-bold text-ink/40">칠 판</div>
        </div>
        <div className="grid gap-[3px] flex-1" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: totalSeats }, (_, idx) => {
            const isDisabled = disabledSet.has(idx)
            const isFixed = !isDisabled && idx in fixed
            const fixedStudent = isFixed ? studentByNum.get(fixed[idx]) : null

            const activeOrder = activeOrderMap.get(idx) ?? -1
            const isStopped = activeOrder >= 0 && activeOrder <= stoppedUpTo
            const isSpinning = (phase === 'spinning' || phase === 'stopping') && !isDisabled && !isStopped && !isFixed
            const assignedStudent = assigned.get(idx)
            const sColor = assignedStudent ? getStudentColor(assignedStudent.num) : fixedStudent ? getStudentColor(fixedStudent.num) : null

            if (isDisabled) {
              return (
                <div key={idx} onClick={() => toggleSeat(idx)}
                  className="rounded-[10px] bg-empty flex items-center justify-center transition-colors"
                  style={{ cursor: isSetup ? 'pointer' : 'default' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-border" />
                </div>
              )
            }

            let numText: React.ReactNode = '\u00A0'
            let nameText: React.ReactNode = '\u00A0'
            let textClass = ''

            if ((isFixed && fixedStudent && isSetup) || (isFixed && !isSetup && assignedStudent)) {
              const s = (isSetup ? fixedStudent : assignedStudent) || fixedStudent!
              numText = s.num
              nameText = s.name
            } else if (isSpinning) {
              numText = null
              nameText = null
            } else if (isStopped && assignedStudent) {
              numText = assignedStudent.num
              nameText = assignedStudent.name
              textClass = 'animate-pop'
            } else if (phase === 'done' && assignedStudent) {
              numText = assignedStudent.num
              nameText = assignedStudent.name
            } else {
              numText = <span className="text-ink/20">{idx + 1}</span>
            }

            const revealed = isStopped || (phase === 'done' && !!assignedStudent) || isFixed
            const bg = revealed && sColor ? sColor.bg : isSpinning ? 'var(--color-dark)' : 'var(--color-empty)'
            const fgColor = revealed && sColor ? sColor.fg : undefined

            return (
              <div key={idx}
                className="rounded-[10px] relative overflow-hidden flex items-center justify-center transition-colors duration-300"
                style={{ background: bg, cursor: isSetup ? 'pointer' : 'default' }}
                onClick={() => { if (isSetup) toggleSeat(idx) }}>
                {isSetup && (
                  <button onClick={e => { e.stopPropagation(); setFixingIdx(idx) }}
                    className="absolute top-1 right-1 w-5 h-5 rounded text-[9px] font-bold border-none cursor-pointer transition-colors z-10 print:hidden"
                    style={{
                      background: isFixed ? `${sColor?.bar ?? '#666'}33` : 'rgba(0,0,0,0.06)',
                      color: isFixed ? sColor?.fg ?? '#666' : 'rgba(0,0,0,0.2)',
                    }}>
                    {isFixed ? '🔒' : '🔓'}
                  </button>
                )}
                {isFixed && !isSetup && (
                  <div className="absolute top-1 right-1 text-[10px] print:hidden" style={{ color: sColor ? `${sColor.fg}99` : undefined }}>🔒</div>
                )}
                {isSpinning ? (
                  <RollingName students={students} offset={idx} />
                ) : (
                  <div className={`text-center ${textClass}`}>
                    <div className="text-[28px] font-black leading-none" style={{ color: fgColor ? `${fgColor}BB` : undefined }}>{numText}</div>
                    <div className="text-[32px] font-black leading-none tracking-tight" style={{ color: fgColor }}>{nameText ?? '\u00A0'}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 쌍둥이 페이지 — 칠판 아래 (인쇄 전용) */}
      {phase === 'done' && (
        <div className="hidden print:block">
          <div className="page">
            <PageHeader badge="Seat" title="자리 배치표" />
            <div className="grid gap-[3px] flex-1" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
              {Array.from({ length: totalSeats }, (_, i) => {
                const r = Math.floor(i / cols)
                const c = i % cols
                const idx = (rows - 1 - r) * cols + (cols - 1 - c)

                const isDisabled = disabledSet.has(idx)
                const assignedStudent = assigned.get(idx)
                const isFixed = !isDisabled && idx in fixed
                const fixedStudent = isFixed ? studentByNum.get(fixed[idx]) : null
                const s = assignedStudent || fixedStudent
                const sc = s ? getStudentColor(s.num) : null

                if (isDisabled) {
                  return (
                    <div key={i} className="rounded-[10px] bg-empty flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-border" />
                    </div>
                  )
                }

                return (
                  <div key={i} className="rounded-[10px] relative overflow-hidden flex items-center justify-center"
                    style={{ background: sc?.bg ?? 'var(--color-empty)' }}>
                    <div className="text-center">
                      <div className="text-[28px] font-black leading-none" style={{ color: sc ? `${sc.fg}BB` : undefined }}>{s?.num ?? '\u00A0'}</div>
                      <div className="text-[32px] font-black leading-none tracking-tight" style={{ color: sc?.fg }}>{s?.name ?? '\u00A0'}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-center mt-3">
              <div className="px-10 py-2 bg-ink/10 rounded-lg text-sm font-bold text-ink/40">칠 판</div>
            </div>
          </div>
        </div>
      )}

      {/* 고정 학생 선택 모달 */}
      {fixingIdx !== null && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 print:hidden" onClick={() => setFixingIdx(null)}>
          <div className="bg-bg rounded-xl p-5 shadow-2xl max-w-sm w-full max-h-[60vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-black text-ink mb-3">좌석 {fixingIdx + 1} — 학생 고정</h3>
            {fixingIdx in fixed && (
              <button onClick={() => fixStudent(fixingIdx, null)}
                className="w-full mb-2 py-2 rounded-lg text-sm font-bold bg-danger text-white border-none cursor-pointer">
                고정 해제
              </button>
            )}
            <div className="grid grid-cols-3 gap-1.5">
              {students.map(s => {
                const alreadyFixed = fixedNums.has(s.num) && fixed[fixingIdx] !== s.num
                return (
                  <button key={s.num}
                    onClick={() => !alreadyFixed && fixStudent(fixingIdx, s.num)}
                    disabled={alreadyFixed}
                    className={`py-2 rounded-md text-xs font-bold border-none cursor-pointer transition-colors
                      ${fixed[fixingIdx] === s.num ? 'bg-ink text-bg' : alreadyFixed ? 'bg-ink/5 text-ink/20 cursor-not-allowed' : 'bg-ink/10 text-ink hover:bg-ink/20'}`}>
                    {s.num} {s.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 단일 타이머로 모든 RollingName 인스턴스를 구동
let rollingTick = 0
const rollingListeners = new Set<() => void>()
let rollingTimer: ReturnType<typeof setInterval> | null = null

function useRollingTick() {
  const [, rerender] = useState(0)
  useEffect(() => {
    const fn = () => rerender(n => n + 1)
    rollingListeners.add(fn)
    if (!rollingTimer) {
      rollingTimer = setInterval(() => { rollingTick++; rollingListeners.forEach(f => f()) }, ROLLING_TICK_INTERVAL)
    }
    return () => {
      rollingListeners.delete(fn)
      if (rollingListeners.size === 0 && rollingTimer) {
        clearInterval(rollingTimer)
        rollingTimer = null
      }
    }
  }, [])
  return rollingTick
}

function RollingName({ students, offset }: { students: Student[]; offset: number }) {
  const tick = useRollingTick()
  const s = students[(tick + offset) % students.length]
  return (
    <div className="text-center">
      <div className="text-[28px] font-black leading-none text-white/50">{s.num}</div>
      <div className="text-[32px] font-black leading-none tracking-tight text-white/60">{s.name}</div>
    </div>
  )
}
