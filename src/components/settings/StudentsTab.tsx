import { useState } from 'react'
import Spreadsheet from 'react-spreadsheet'
import { useAppData, setData } from '../../store'
import { LoadPreset } from '../PasswordGate'
import { cell, emptyRows, val, type Row } from './spreadsheet'

function studentsToMatrix(students: { num: number; name: string }[]): Row[] {
  return [...students.map(s => [cell(s.num), cell(s.name)]), ...emptyRows(2, 5)]
}

function matrixToStudents(data: Row[]) {
  return data
    .map(row => ({ num: parseInt(val(row, 0), 10), name: val(row, 1) }))
    .filter(s => !isNaN(s.num) && s.name)
}

export default function StudentsTab() {
  const { students, grade, classNum } = useAppData()
  const [data, setSheetData] = useState<Row[]>(studentsToMatrix(students))
  const [prevLen, setPrevLen] = useState(students.length)

  if (students.length !== prevLen) {
    setSheetData(studentsToMatrix(students))
    setPrevLen(students.length)
  }

  const valid = matrixToStudents(data)

  const handleChange = (d: Row[]) => {
    setSheetData(d)
    setData({ students: matrixToStudents(d) })
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4 pb-3" style={{ borderBottom: '1px solid #e5e7eb' }}>
        <label className="text-sm font-semibold text-ink/60">학년</label>
        <input type="number" value={grade || ''} min={1} max={6} placeholder="학년"
          onChange={e => setData({ grade: parseInt(e.target.value) || undefined })}
          className="w-16 px-2 py-1.5 text-sm rounded-lg"
          style={{ border: '1px solid #ddd' }} />
        <label className="text-sm font-semibold text-ink/60">반</label>
        <input type="number" value={classNum || ''} min={1} max={30} placeholder="반"
          onChange={e => setData({ classNum: parseInt(e.target.value) || undefined })}
          className="w-16 px-2 py-1.5 text-sm rounded-lg"
          style={{ border: '1px solid #ddd' }} />
      </div>
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm text-ink/50">엑셀에서 복사 붙여넣기 가능</p>
          <LoadPreset />
        </div>
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
