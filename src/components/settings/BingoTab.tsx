import { useState } from 'react'
import Spreadsheet from 'react-spreadsheet'
import { useAppData, setData } from '../../store'
import type { BingoQuestion, BingoDifficulty } from '../../store'
import { cell, emptyRows, val, type Row } from './spreadsheet'

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

export default function BingoTab() {
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
