import { useState, useMemo, useCallback, useEffect } from 'react'
import { useAppData } from '../store'
import type { Student } from '../store'
import { shuffleArray } from '../utils/shuffle'
import PageHeader from './PageHeader'
import DownloadButton from './PrintButton'
import CardReveal from './CardReveal'

const rowBg = (i: number) => i % 2 === 0 ? '#EAEDE2' : '#E4E8E0'
const fmtStudent = (s: Student) => `${s.num}번 ${s.name}`

export default function RoleAssign() {
  const { students: allStudents, fixedRoles, variableRoles, roleSelectedNums } = useAppData()
  const [pairs, setPairs] = useState<{ student: Student; role: string }[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const varCount = variableRoles.length
  const studentByNum = useMemo(() => new Map(allStudents.map(s => [s.num, s])), [allStudents])
  const selectedNums = useMemo(() => new Set(roleSelectedNums), [roleSelectedNums])
  const fixedStudentNums = useMemo(() => new Set(fixedRoles.map(r => r.studentNum).filter(Boolean) as number[]), [fixedRoles])
  const availableStudents = useMemo(() => allStudents.filter(s => !fixedStudentNums.has(s.num)), [allStudents, fixedStudentNums])

  const canCreate = varCount > 0 && selectedNums.size === varCount

  const descriptions = useMemo(() => {
    const map = new Map<string, string>()
    variableRoles.forEach(r => { if (!map.has(r.name)) map.set(r.name, r.description) })
    return map
  }, [variableRoles])

  const groupedByRole = useMemo(() => {
    const seen = new Set<string>()
    const uniqueRoles = variableRoles.map(r => r.name).filter(r => seen.has(r) ? false : (seen.add(r), true))
    return uniqueRoles.map(role => ({
      role,
      students: pairs.filter(p => p.role === role).map(p => p.student),
    }))
  }, [variableRoles, pairs])

  const handleComplete = useCallback(() => {
    setTimeout(() => setShowPreview(true), 500)
  }, [])

  const reset = () => {
    setPairs([])
    setShowPreview(false)
  }

  const selectedStudents = useMemo(() =>
    availableStudents.filter(s => selectedNums.has(s.num)),
    [availableStudents, selectedNums]
  )

  const studentLabels = useMemo(() =>
    pairs.map(p => `${p.student.num} ${p.student.name}`),
    [pairs]
  )

  const page1Rows = useMemo(() => [
    ...fixedRoles.map((r, i) => {
      const s = r.studentNum ? studentByNum.get(r.studentNum) : null
      return { key: `f${i}`, left: s ? fmtStudent(s) : '미정', right: r.name, desc: r.description, idx: i }
    }),
    ...pairs.map((p, i) => ({
      key: `v${i}`, left: fmtStudent(p.student), right: p.role, desc: descriptions.get(p.role) || '', idx: fixedRoles.length + i,
    })),
  ], [fixedRoles, pairs, studentByNum, descriptions])

  const page2Rows = useMemo(() => [
    ...fixedRoles.map((r, i) => {
      const s = r.studentNum ? studentByNum.get(r.studentNum) : null
      return { key: `f${i}`, left: r.name, right: s ? fmtStudent(s) : '미정', idx: i }
    }),
    ...groupedByRole.map(({ role, students }, i) => ({
      key: `r${i}`, left: role, right: students.map(fmtStudent).join(', '), idx: fixedRoles.length + i,
    })),
  ], [fixedRoles, groupedByRole, studentByNum])

  // 조건 충족 시 1회만 셔플 실행 (reset 후 재마운트 시 다시 실행)
  // canCreate만 의존: 나머지는 canCreate가 true일 때 안정적
  useEffect(() => {
    if (!canCreate || pairs.length > 0) return

    const shuffled = shuffleArray(
      availableStudents.filter(s => selectedNums.has(s.num))
    )

    setPairs(variableRoles.map((r, i) => ({
      student: shuffled[i],
      role: r.name,
    })).filter(p => p.student))
  }, [canCreate]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!varCount) {
    return (
      <div className="w-[794px] bg-bg rounded-lg shadow-lg p-8 text-center">
        <p className="text-ink/50">설정에서 가변 역할을 먼저 등록해주세요.</p>
      </div>
    )
  }

  if (!canCreate) {
    return (
      <div className="w-[794px] bg-bg rounded-lg shadow-lg p-8 text-center">
        <p className="text-ink/50">설정에서 참여 학생을 선택해주세요. (가변 역할 {varCount}개)</p>
      </div>
    )
  }

  if (pairs.length === 0) return null

  return (
    <div>
      <div className="print:hidden">
        <CardReveal
          roles={pairs.map(p => p.role)}
          students={studentLabels}
          results={studentLabels}
          onComplete={handleComplete}
          onReset={reset}
          selectedStudents={selectedStudents}
          fixedRoles={fixedRoles}
          studentByNum={studentByNum}
        />
      </div>

      {showPreview && (
        <div className="mt-8">
          <DownloadButton />

          <div data-capture>
            <div className="page">
              <PageHeader badge="Role" title="1인 1역 배정 결과" />
              <div className="flex-1 grid gap-[2px] min-h-0" style={{ gridTemplateRows: `repeat(${page1Rows.length}, minmax(0, 1fr))` }}>
                {page1Rows.map(r => (
                  <div key={r.key} className="flex items-center rounded-xl overflow-hidden px-5 min-h-0" style={{ background: rowBg(r.idx) }}>
                    <div className="text-lg font-black text-ink whitespace-nowrap">{r.left}</div>
                    <div className="ml-auto text-right shrink-0">
                      <div className="text-lg font-extrabold text-ink/80">{r.right}</div>
                      {r.desc && <div className="text-[9px] text-ink/40 leading-tight whitespace-nowrap">{r.desc}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="page mt-8">
              <PageHeader badge="Role" title="1인 1역 — 역할별 번호" />
              <div className="flex-1 grid gap-[2px] min-h-0" style={{ gridTemplateRows: `repeat(${page2Rows.length}, minmax(0, 1fr))` }}>
                {page2Rows.map(r => (
                  <div key={r.key} className="flex items-center rounded-xl overflow-hidden px-5 min-h-0" style={{ background: rowBg(r.idx) }}>
                    <div className="text-lg font-black text-ink whitespace-nowrap">{r.left}</div>
                    <div className="text-lg font-extrabold text-ink/70 ml-auto text-right">{r.right}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
