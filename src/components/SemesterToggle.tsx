import { getSemester, semesters } from '../data/semester'
import { setSemester, useSemester } from '../store'

/** 화면에서는 학기 전환 토글, 인쇄물에서는 '2026 2학기' 라벨로 나온다 */
export default function SemesterToggle() {
  const current = useSemester()

  return (
    <>
      <div className="flex items-center gap-2 print:hidden">
        <span className="font-display text-[13px] font-bold tracking-wider text-ink/35">
          {getSemester(current).year}
        </span>
        <div className="flex gap-0.5 p-1 rounded-xl bg-period-bg">
          {semesters.map(s => (
            <button
              key={s.id}
              onClick={() => setSemester(s.id)}
              className={`px-3.5 py-1.5 rounded-lg text-[13px] font-bold border-none cursor-pointer transition-colors
                ${s.id === current ? 'bg-ink text-bg' : 'bg-transparent text-ink/40 hover:text-ink/70'}`}
            >
              {s.short}
            </button>
          ))}
        </div>
      </div>
      <span className="hidden print:inline-block font-display text-[16px] font-bold tracking-wider text-ink/45">
        {getSemester(current).label}
      </span>
    </>
  )
}
