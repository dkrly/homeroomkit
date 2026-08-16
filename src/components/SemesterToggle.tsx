import { parseSemester } from '../data/semester'
import { setSemester, useAppData } from '../store'

/** 화면에서는 학기 전환 토글, 인쇄물에서는 '2026 2학기' 라벨로 나온다 */
export default function SemesterToggle() {
  const { semesters, semester } = useAppData()
  if (semesters.length === 0) return null

  const current = parseSemester(semester)

  return (
    <>
      <div className="flex items-center gap-2 print:hidden">
        {current.year > 0 && (
          <span className="font-display text-[13px] font-bold tracking-wider text-ink/35">{current.year}</span>
        )}
        <div className="flex gap-0.5 p-1 rounded-xl bg-period-bg">
          {semesters.map(id => (
            <button
              key={id}
              onClick={() => setSemester(id)}
              className={`px-3.5 py-1.5 rounded-lg text-[13px] font-bold border-none cursor-pointer transition-colors
                ${id === semester ? 'bg-ink text-bg' : 'bg-transparent text-ink/40 hover:text-ink/70'}`}
            >
              {parseSemester(id).short}
            </button>
          ))}
        </div>
      </div>
      <span className="hidden print:inline-block font-display text-[16px] font-bold tracking-wider text-ink/45">
        {current.label}
      </span>
    </>
  )
}
