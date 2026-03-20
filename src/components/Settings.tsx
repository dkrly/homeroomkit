import { useState, useMemo } from 'react'
import Spreadsheet from 'react-spreadsheet'
import { useAppData, setData } from '../store'
import type { FixedRole, VariableRole, BingoQuestion, BingoDifficulty } from '../store'
import { toggleSet } from '../utils/set'
import { buildDisabled } from '../utils/seating'

const settingsTabs = [
  { id: 'students', label: '학생 목록' },
  { id: 'roles', label: '1인 1역' },
  { id: 'seating', label: '자리 배치' },
  { id: 'bingo', label: '친구 탐험' },
] as const

type SettingsTab = (typeof settingsTabs)[number]['id']

type Cell = { value: string }
type Row = (Cell | undefined)[]

function cell(v: string | number | undefined): Cell {
  return { value: v != null ? String(v) : '' }
}

function val(row: Row, col: number): string {
  return row[col]?.value?.trim() ?? ''
}

function emptyRows(cols: number, count: number): Row[] {
  return Array.from({ length: count }, () => Array.from({ length: cols }, () => cell('')))
}

export default function Settings() {
  const [tab, setTab] = useState<SettingsTab>('students')

  return (
    <div className="w-[794px] max-w-full">
      <div className="flex gap-1 mb-6 border-b-2 border-border">
        {settingsTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold border-none cursor-pointer transition-colors rounded-t-lg
              ${tab === t.id ? 'bg-bg text-ink border-b-2 border-ink -mb-[2px]' : 'bg-transparent text-ink/40 hover:text-ink/70'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'students' && <StudentsTab />}
      {tab === 'roles' && <RolesTab />}
      {tab === 'seating' && <SeatingTab />}
      {tab === 'bingo' && <BingoTab />}
    </div>
  )
}

// --- 학생 ---

function studentsToMatrix(students: { num: number; name: string }[]): Row[] {
  return [...students.map(s => [cell(s.num), cell(s.name)]), ...emptyRows(2, 5)]
}

function matrixToStudents(data: Row[]) {
  return data
    .map(row => ({ num: parseInt(val(row, 0), 10), name: val(row, 1) }))
    .filter(s => !isNaN(s.num) && s.name)
}

function StudentsTab() {
  const { students } = useAppData()
  const [data, setSheetData] = useState<Row[]>(studentsToMatrix(students))

  const valid = matrixToStudents(data)

  const handleChange = (d: Row[]) => {
    setSheetData(d)
    const parsed = matrixToStudents(d)
    setData({ students: parsed })
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-sm text-ink/50">엑셀에서 복사 붙여넣기 가능</p>
        <span className="text-sm font-bold text-ink">{valid.length}명</span>
      </div>
      <Spreadsheet
        data={data}
        onChange={d => handleChange(d as Row[])}
        columnLabels={['번호', '이름']}
      />
    </div>
  )
}

// --- 역할 ---

function fixedToMatrix(roles: FixedRole[]): Row[] {
  return [...roles.map(r => [cell(r.name), cell(r.studentNum ?? ''), cell(r.description)]), ...emptyRows(3, 3)]
}

function matrixToFixed(data: Row[]): FixedRole[] {
  return data
    .filter(row => val(row, 0))
    .map(row => {
      const numStr = val(row, 1)
      const studentNum = numStr ? parseInt(numStr, 10) : undefined
      return { name: val(row, 0), description: val(row, 2), studentNum: isNaN(studentNum as number) ? undefined : studentNum }
    })
}

function varToMatrix(roles: VariableRole[]): Row[] {
  return [...roles.map(r => [cell(r.name), cell(r.description)]), ...emptyRows(2, 3)]
}

function matrixToVar(data: Row[]): VariableRole[] {
  return data
    .filter(row => val(row, 0))
    .map(row => ({
      name: val(row, 0),
      description: val(row, 1),
    }))
}

function SeatingTab() {
  const { seating, students } = useAppData()
  const [r, setR] = useState(seating.rows)
  const [c, setC] = useState(seating.cols)

  const total = r * c
  const dis = buildDisabled(students.length, total)
  const active = total - dis.length

  const saveSeating = (rows: number, cols: number) => {
    setData({ seating: { rows, cols, disabled: buildDisabled(students.length, rows * cols), fixed: {} } })
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
    </div>
  )
}

function RolesTab() {
  const { fixedRoles, variableRoles, students, roleSelectedNums } = useAppData()
  const [fixedData, setFixedData] = useState<Row[]>(fixedToMatrix(fixedRoles))
  const [varData, setVarData] = useState<Row[]>(varToMatrix(variableRoles))

  const selectedNums = useMemo(() => new Set(roleSelectedNums), [roleSelectedNums])
  const validFixed = useMemo(() => matrixToFixed(fixedData), [fixedData])
  const validVar = useMemo(() => matrixToVar(varData), [varData])
  const fixedStudentNums = useMemo(() => new Set(validFixed.map(r => r.studentNum).filter(Boolean) as number[]), [validFixed])
  const availableStudents = useMemo(() => students.filter(s => !fixedStudentNums.has(s.num)), [students, fixedStudentNums])
  const varCount = validVar.length

  const handleFixedChange = (d: Row[]) => {
    setFixedData(d)
    setData({ fixedRoles: matrixToFixed(d) })
  }

  const handleVarChange = (d: Row[]) => {
    setVarData(d)
    setData({ variableRoles: matrixToVar(d) })
  }

  const handleToggleStudent = (num: number) => {
    const next = toggleSet(selectedNums, num)
    setData({ roleSelectedNums: [...next] })
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-sm text-ink/50">고정 역할 (배정된 학생이 있는 역할)</p>
        <span className="text-sm font-bold text-ink">{validFixed.length}개</span>
      </div>
      <div className="overflow-x-auto">
        <Spreadsheet
          data={fixedData}
          onChange={d => handleFixedChange(d as Row[])}
          columnLabels={['역할명', '담당 번호', '설명']}
        />
      </div>

      <div className="flex items-baseline justify-between mb-2 mt-5">
        <p className="text-sm text-ink/50">가변 역할 — 셔플 대상</p>
        <span className="text-sm font-bold text-ink">{validVar.length}개</span>
      </div>
      <div className="overflow-x-auto">
        <Spreadsheet
          data={varData}
          onChange={d => handleVarChange(d as Row[])}
          columnLabels={['역할명', '설명']}
        />
      </div>

      <div className="mt-5">
        <p className="text-sm text-ink/50 mb-2">
          참여 학생 선택
          <span className="ml-2 font-bold text-ink">{selectedNums.size}/{varCount}명</span>
          {varCount > 0 && selectedNums.size !== varCount && (
            <span className="ml-2 text-danger text-xs">가변 역할 수와 맞춰주세요</span>
          )}
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {availableStudents.map(s => {
            const isSel = selectedNums.has(s.num)
            return (
              <button
                key={s.num}
                onClick={() => handleToggleStudent(s.num)}
                className={`h-10 rounded-md text-sm font-bold cursor-pointer border-none transition-colors
                  ${isSel ? 'bg-ink text-bg' : 'bg-bg text-ink/40 hover:bg-ink/10 hover:text-ink'}`}
              >
                {s.num} {s.name}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// --- 친구 탐험 ---

const diffOptions: { value: BingoDifficulty; label: string }[] = [
  { value: 'easy', label: '쉬움' },
  { value: 'medium', label: '보통' },
  { value: 'hard', label: '어려움' },
]

function bingoToMatrix(questions: BingoQuestion[]): Row[] {
  return [
    ...questions.map(q => [cell(q.emoji), cell(q.prompt), cell(diffOptions.find(d => d.value === q.difficulty)!.label), cell(q.required ? 'O' : '')]),
    ...emptyRows(4, 5),
  ]
}

function matrixToBingo(data: Row[]): BingoQuestion[] {
  const diffMap: Record<string, BingoDifficulty> = { '쉬움': 'easy', '보통': 'medium', '어려움': 'hard' }
  return data
    .filter(row => val(row, 1))
    .map(row => ({
      emoji: val(row, 0) || '❓',
      prompt: val(row, 1),
      difficulty: diffMap[val(row, 2)] ?? 'medium',
      ...(val(row, 3).toUpperCase() === 'O' ? { required: true } : {}),
    }))
}

function BingoTab() {
  const { bingoQuestions } = useAppData()
  const [data, setSheetData] = useState<Row[]>(bingoToMatrix(bingoQuestions))

  const valid = matrixToBingo(data)
  const counts = { easy: 0, medium: 0, hard: 0 }
  valid.forEach(q => counts[q.difficulty]++)
  const reqCount = valid.filter(q => q.required).length

  const handleChange = (d: Row[]) => {
    setSheetData(d)
    setData({ bingoQuestions: matrixToBingo(d) })
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-sm text-ink/50">
          쉬움 {counts.easy} / 보통 {counts.medium} / 어려움 {counts.hard} · 필수 {reqCount}개
          <span className="ml-2 text-ink/30 text-xs">(섞기 시 필수 + 나머지 = 12)</span>
        </p>
        <span className="text-sm font-bold text-ink">{valid.length}개</span>
      </div>
      <div className="overflow-x-auto">
        <Spreadsheet
          data={data}
          onChange={d => handleChange(d as Row[])}
          columnLabels={['이모지', '질문', '난이도', '필수']}
        />
      </div>
      <p className="text-xs text-ink/30 mt-2">난이도: 쉬움(15명↑) · 보통(5~14명) · 어려움(1~4명) | 필수: O 입력 시 매번 포함</p>
    </div>
  )
}
