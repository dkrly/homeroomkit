import { useAppData } from '../store'
import { getStudentColor } from '../utils/colors'
import PageHeader from './PageHeader'

export default function StudentList() {
  const { students } = useAppData()
  const rowCount = 20
  const left = students.slice(0, rowCount)
  const right = students.slice(rowCount)

  return (
    <div className="page">
      <PageHeader badge="Students" title="우리반 학생" />
      <div className="flex gap-[3px] flex-1 min-h-0">
        <Column students={left} rows={rowCount} />
        <Column students={right} rows={rowCount} />
      </div>
    </div>
  )
}

function Column({ students, rows }: { students: { num: number; name: string }[]; rows: number }) {
  return (
    <div className="flex-1 grid gap-[3px] min-h-0" style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
      {Array.from({ length: rows }, (_, i) => {
        const s = students[i]
        if (!s) return <div key={i} />
        const sc = getStudentColor(s.num)
        return (
          <div
            key={s.num}
            className="relative flex items-center rounded-xl overflow-hidden px-5 min-h-0"
            style={{ background: sc.bg }}
          >
            <div className="absolute left-0 top-[15%] bottom-[15%] w-[5px] rounded-r-sm" style={{ background: sc.bar }} />
            <div className="text-[28px] font-black w-12" style={{ color: `${sc.fg}DD` }}>{s.num}</div>
            <div className="text-[28px] font-black" style={{ color: sc.fg }}>{s.name}</div>
          </div>
        )
      })}
    </div>
  )
}
