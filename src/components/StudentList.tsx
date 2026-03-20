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
      <PageHeader badge="Students" title="학생 명단" />
      <div className="flex gap-[3px] flex-1 min-h-0">
        <Column students={left} rows={rowCount} />
        <Column students={right} rows={rowCount} />
      </div>
    </div>
  )
}

function Column({ students, rows }: { students: { num: number; name: string }[]; rows: number }) {
  return (
    <div className="flex-1 grid gap-[2px] min-h-0" style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
      {Array.from({ length: rows }, (_, i) => {
        const s = students[i]
        if (!s) return <div key={i} />
        return (
          <div
            key={s.num}
            className="flex items-center rounded-xl overflow-hidden px-5 min-h-0"
            style={{ background: getStudentColor(s.num).bg }}
          >
            <div className="text-[28px] font-black w-12" style={{ color: `${getStudentColor(s.num).fg}99` }}>{s.num}</div>
            <div className="text-[28px] font-black" style={{ color: getStudentColor(s.num).fg }}>{s.name}</div>
          </div>
        )
      })}
    </div>
  )
}
