import { useState, useEffect, useCallback, useMemo } from 'react'
import { getStudentColor } from '../utils/colors'
import { useShuffleReveal } from '../utils/useShuffleReveal'
import type { Student, FixedRole } from '../store'

const MAX_COLS = 5
const REVEAL_INTERVAL = 350
const ROLLING_INTERVAL = 60

interface CardRevealProps {
  roles: string[]
  students: string[]
  results: string[]
  onComplete: () => void
  onReset: () => void
  selectedStudents?: Student[]
  fixedRoles?: FixedRole[]
  studentByNum?: Map<number, Student>
}

export default function CardReveal({ roles, students, results, onComplete, onReset, selectedStudents, fixedRoles, studentByNum }: CardRevealProps) {
  const { phase, stoppedUpTo, startSpin, stopSpin, reset } = useShuffleReveal({
    itemCount: roles.length,
    revealInterval: REVEAL_INTERVAL,
    onAllRevealed: onComplete,
  })

  const handleBack = useCallback(() => {
    if (!window.confirm('돌아가시겠습니까?')) return
    reset()
    onReset()
  }, [reset, onReset])

  const cols = Math.min(roles.length, MAX_COLS)

  const revealedNums = useMemo(() => new Set(
    results.slice(0, Math.max(0, stoppedUpTo + 1)).map(r => parseInt(r))
  ), [results, stoppedUpTo])

  return (
    <div className="w-[794px]" style={{ maxHeight: 'calc(100vh - 9rem)', display: 'flex', flexDirection: 'column' }}>
      <div className="flex gap-2 mb-4">
        <button
          onClick={startSpin}
          disabled={phase !== 'ready'}
          className={`btn-action ${phase !== 'ready' ? 'bg-ink/30 cursor-not-allowed' : 'bg-success hover:bg-success-hover'}`}
        >
          시작
        </button>
        <button
          onClick={stopSpin}
          disabled={phase !== 'spinning'}
          className={`btn-action ${phase !== 'spinning' ? 'bg-ink/30 cursor-not-allowed' : 'bg-danger hover:bg-danger-hover'}`}
        >
          멈춰
        </button>
        <button
          onClick={handleBack}
          disabled={phase === 'spinning' || phase === 'stopping'}
          className={`btn-action ${phase === 'spinning' || phase === 'stopping' ? 'bg-ink/10 !text-ink/30 cursor-not-allowed' : 'bg-ink/20 !text-ink hover:bg-ink/30'}`}
        >
          초기화
        </button>
      </div>

      {fixedRoles && fixedRoles.length > 0 && studentByNum && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {fixedRoles.map((r, i) => {
            const s = r.studentNum ? studentByNum.get(r.studentNum) : null
            return (
              <span key={`f${i}`} className="px-3 py-1.5 rounded-lg text-sm font-bold bg-ink/10 text-ink/70">
                {r.name}{s ? ` → ${s.num} ${s.name}` : ''}
              </span>
            )
          })}
        </div>
      )}

      {selectedStudents && selectedStudents.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {selectedStudents.map(s => {
            const revealed = revealedNums.has(s.num)
            const sc = getStudentColor(s.num)
            return (
              <span
                key={s.num}
                className="px-3 py-1.5 rounded-lg text-sm font-bold transition-opacity duration-300"
                style={{
                  background: revealed ? sc.bg : 'rgba(30,42,30,0.05)',
                  color: revealed ? sc.fg : 'var(--color-ink)',
                  borderLeft: revealed ? `3px solid ${sc.bar}` : '3px solid transparent',
                  opacity: revealed ? 1 : 0.35,
                }}
              >
                {s.num} {s.name}
              </span>
            )
          })}
        </div>
      )}

      <div className="grid gap-2 flex-1 min-h-0" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {roles.map((role, i) => {
          const stopped = stoppedUpTo >= i
          const isSpinning = (phase === 'spinning' || phase === 'stopping') && !stopped
          const sc = getStudentColor((i % 6) * 5 + 1)

          return (
            <div
              key={`${role}-${i}`}
              className="rounded-xl overflow-hidden transition-all duration-300 flex flex-col items-center justify-center p-3 min-h-0"
              style={{
                background: stopped ? sc.bg : 'var(--color-dark)',
                boxShadow: stopped ? '0 4px 16px rgba(0,0,0,0.15)' : isSpinning ? '0 8px 32px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <div
                className="font-black mb-2 transition-colors duration-300 text-center whitespace-nowrap"
                style={{
                  color: stopped ? sc.fg : 'rgba(255,255,255,0.9)',
                  fontSize: role.length > 8 ? '11px' : role.length > 6 ? '12px' : '14px',
                }}
              >
                {role}
              </div>

              <div className="h-8 flex items-center justify-center min-w-0 w-full">
                {isSpinning && <RollingText names={students} excludeNames={stoppedUpTo >= 0 ? results.slice(0, stoppedUpTo + 1) : []} />}
                {stopped && (
                  <div className="text-lg font-black leading-tight text-center animate-pop truncate" style={{ color: sc.fg }}>
                    {results[i]}
                  </div>
                )}
                {!isSpinning && !stopped && (
                  <div className="text-sm font-bold text-white/20">- - -</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RollingText({ names, excludeNames }: { names: string[]; excludeNames: string[] }) {
  const excluded = useMemo(() => new Set(excludeNames), [excludeNames])
  const list = useMemo(() => {
    const pool = names.filter(n => !excluded.has(n))
    return pool.length > 0 ? pool : names
  }, [names, excluded])

  const [idx, setIdx] = useState(() => Math.floor(Math.random() * list.length))

  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % list.length), ROLLING_INTERVAL)
    return () => clearInterval(id)
  }, [list.length])

  return (
    <div className="text-lg font-black text-white/70 leading-tight text-center">
      {list[idx]}
    </div>
  )
}
