import { useState, useEffect } from 'react'
import { defaultFixedRoles, defaultVariableRoles, defaultSeating, defaultBingoQuestions } from './data/defaults'

const STORAGE_KEY = 'homeroomkit'

export interface Student {
  num: number
  name: string
}

export interface FixedRole {
  name: string
  description: string
  studentNum?: number
}

export interface VariableRole {
  name: string
  description: string
}

export interface SeatingConfig {
  rows: number
  cols: number
  disabled: number[]
  fixed: Record<number, number>
  distanced: [number, number][]
}

export type BingoDifficulty = 'easy' | 'medium' | 'hard'

export interface BingoQuestion {
  emoji: string
  prompt: string
  difficulty: BingoDifficulty
  required?: boolean
}

export interface AppData {
  students: Student[]
  fixedRoles: FixedRole[]
  variableRoles: VariableRole[]
  roleSelectedNums: number[]
  seating: SeatingConfig
  bingoQuestions: BingoQuestion[]
}

const defaultData: AppData = {
  students: [],
  fixedRoles: defaultFixedRoles,
  variableRoles: defaultVariableRoles,
  roleSelectedNums: [],
  seating: defaultSeating,
  bingoQuestions: defaultBingoQuestions,
}

function migrate(data: Record<string, unknown>): Record<string, unknown> {
  if (Array.isArray(data.bingoQuestions)) {
    const hasOld = (data.bingoQuestions as BingoQuestion[]).some(q => q.prompt.includes('사람') || q.prompt.includes('이름 모르는'))
    if (hasOld) {
      data.bingoQuestions = defaultBingoQuestions
    }
  }
  return data
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultData
    const parsed = migrate(JSON.parse(raw))
    const students = parsed.students as unknown[]
    if (students?.[0] && typeof students[0] !== 'object') {
      return defaultData
    }
    return { ...defaultData, ...parsed } as AppData
  } catch {
    return defaultData
  }
}

function save(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

let current = load()
const listeners = new Set<() => void>()

export function setData(partial: Partial<AppData>) {
  current = { ...current, ...partial }
  save(current)
  listeners.forEach(fn => fn())
}

export function useAppData(): AppData {
  const [, rerender] = useState(0)
  useEffect(() => {
    const fn = () => rerender(n => n + 1)
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  }, [])
  return current
}
