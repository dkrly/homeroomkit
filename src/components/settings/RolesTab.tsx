import { useState, useMemo } from 'react'
import Spreadsheet from 'react-spreadsheet'
import { useAppData, setData } from '../../store'
import type { FixedRole, VariableRole } from '../../store'
import { toggleSet } from '../../utils/set'
import { cell, emptyRows, val, type Row } from './spreadsheet'

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
    .map(row => ({ name: val(row, 0), description: val(row, 1) }))
}

export default function RolesTab() {
  const { fixedRoles, variableRoles, students, roleSelectedNums } = useAppData()
  const [fixedData, setFixedData] = useState<Row[]>(fixedToMatrix(fixedRoles))
  const [varData, setVarData] = useState<Row[]>(varToMatrix(variableRoles))

  const validFixed = useMemo(() => matrixToFixed(fixedData), [fixedData])
  const validVar = useMemo(() => matrixToVar(varData), [varData])
  const fixedStudentNums = useMemo(() => new Set(validFixed.map(r => r.studentNum).filter(Boolean) as number[]), [validFixed])
  const availableStudents = useMemo(() => students.filter(s => !fixedStudentNums.has(s.num)), [students, fixedStudentNums])
  const availableNums = useMemo(() => new Set(availableStudents.map(s => s.num)), [availableStudents])
  const selectedNums = useMemo(() => new Set(roleSelectedNums.filter(n => availableNums.has(n))), [roleSelectedNums, availableNums])
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
