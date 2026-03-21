import { useState, useMemo, useCallback, useEffect } from 'react'
import { useAppData, setData } from '../store'
import type { Student } from '../store'
import { shuffleArray } from '../utils/shuffle'
import PageHeader from './PageHeader'
import PrintButton from './PrintButton'
import CardReveal from './CardReveal'

const rowBg = (i: number) => i % 2 === 0 ? '#EAEDE2' : '#E4E8E0'
const fmtStudent = (s: Student) => `${s.num}번 ${s.name}`

export default function RoleAssign() {
  const appData = useAppData()
  const { students: allStudents, fixedRoles, variableRoles, roleSelectedNums } = appData

  const varCount = variableRoles.length
  const studentByNum = useMemo(() => new Map(allStudents.map(s => [s.num, s])), [allStudents])
  const fixedStudentNums = useMemo(() => new Set(fixedRoles.map(r => r.studentNum).filter(Boolean) as number[]), [fixedRoles])
  const availableStudents = useMemo(() => allStudents.filter(s => !fixedStudentNums.has(s.num)), [allStudents, fixedStudentNums])
  const selectedNums = useMemo(() => new Set(roleSelectedNums.filter(n => !fixedStudentNums.has(n))), [roleSelectedNums, fixedStudentNums])
  const canCreate = varCount > 0 && selectedNums.size === varCount

  const savedRole = appData.roleResult
  const [pairs, setPairs] = useState<{ student: Student; role: string }[]>(savedRole?.pairs ?? [])
  const [showPreview, setShowPreview] = useState(savedRole?.showPreview ?? false)
  const [shuffleKey, setShuffleKey] = useState(0) // CardReveal 리마운트용

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

  const doShuffle = useCallback(() => {
    const shuffled = shuffleArray(
      availableStudents.filter(s => selectedNums.has(s.num))
    )
    const newPairs = variableRoles.map((r, i) => ({
      student: shuffled[i],
      role: r.name,
    })).filter(p => p.student)
    setPairs(newPairs)
    setData({ roleResult: { pairs: newPairs, showPreview: false } })
  }, [availableStudents, selectedNums, variableRoles])

  const handleComplete = useCallback(() => {
    setTimeout(() => {
      setShowPreview(true)
      setData({ roleResult: { pairs, showPreview: true } })
    }, 500)
  }, [pairs])

  const reset = useCallback(() => {
    setShowPreview(false)
    const shuffled = shuffleArray(
      availableStudents.filter(s => selectedNums.has(s.num))
    )
    const newPairs = variableRoles.map((r, i) => ({
      student: shuffled[i],
      role: r.name,
    })).filter(p => p.student)
    setPairs(newPairs)
    setData({ roleResult: { pairs: newPairs, showPreview: false } })
    setShuffleKey(k => k + 1)
  }, [availableStudents, selectedNums, variableRoles])

  const selectedStudents = useMemo(() =>
    availableStudents.filter(s => selectedNums.has(s.num)),
    [availableStudents, selectedNums]
  )

  const studentLabels = useMemo(() =>
    pairs.map(p => `${p.student.num} ${p.student.name}`),
    [pairs]
  )

  const page1Rows = useMemo(() =>
    pairs.map((p, i) => ({
      key: `v${i}`, left: fmtStudent(p.student), right: p.role, desc: descriptions.get(p.role) || '', idx: i,
    })),
  [pairs, descriptions])

  const page2Rows = useMemo(() =>
    groupedByRole.map(({ role, students }, i) => ({
      key: `r${i}`, left: role, right: students.map(fmtStudent).join(', '), idx: i,
    })),
  [groupedByRole])

  // 최초 마운트 시 pairs 없으면 셔플
  useEffect(() => {
    if (canCreate && pairs.length === 0) doShuffle()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      {!showPreview && (
        <div className="print:hidden">
          <CardReveal
            key={shuffleKey}
            roles={pairs.map(p => p.role)}
            students={studentLabels}
            results={studentLabels}
            onComplete={handleComplete}
            onReset={reset}
            selectedStudents={selectedStudents}
          />
        </div>
      )}

      {showPreview && (
        <div className="print:!mt-0">
          <div className="flex justify-end gap-2 mb-3 print:hidden">
            <button onClick={reset}
              className="btn-action bg-ink/20 !text-ink hover:bg-ink/30">
              초기화
            </button>
            <PrintButton inline title="우리반_역할" />
          </div>

          <div className="page">
            <PageHeader badge="Role" title="우리반 역할 — 학생" />
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
            <PageHeader badge="Role" title="우리반 역할" />
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
      )}
    </div>
  )
}
