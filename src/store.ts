import { useState, useEffect } from 'react'
import type { SemesterId } from './data/semester'
import type { ScheduleRow } from './data/schedule'
import { useSheet } from './sheet/client'
import type { SheetConfig, Grid } from './sheet/config'

const STORAGE_KEY = 'homeroomkit-local'

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

export interface SeatingResult {
  assigned: Record<string, { num: number; name: string }>  // seatIdx → student
  phase: 'ready' | 'done'
}

export interface RoleResult {
  pairs: { student: Student; role: string }[]
  showPreview: boolean
}

/**
 * 기기에만 저장되는 상태.
 * 설정(학생·역할·자리 크기·질문·시간표)은 전부 구글 시트에 있고, 여기에는
 * 그 위에서 이루어진 조작 결과만 남는다.
 */
interface LocalState {
  semester?: SemesterId
  seatDisabled: number[]
  seatFixed: Record<number, number>
  seatingResult?: SeatingResult | null
  roleResult?: RoleResult | null
}

/** 시트 설정 + 로컬 상태를 합친, 화면들이 실제로 쓰는 모양 */
export interface AppData {
  students: Student[]
  fixedRoles: FixedRole[]
  variableRoles: VariableRole[]
  roleSelectedNums: number[]
  seating: SeatingConfig
  bingoQuestions: BingoQuestion[]
  scheduleRows: ScheduleRow[]
  classGrids: Record<SemesterId, Grid>
  teacherGrids: Record<SemesterId, Grid>
  semesters: SemesterId[]
  seatingResult?: SeatingResult | null
  roleResult?: RoleResult | null
  grade?: number
  classNum?: number
  semester: SemesterId
}

const defaultLocal: LocalState = {
  seatDisabled: [],
  seatFixed: {},
}

const emptyConfig: SheetConfig = {
  defaultSemester: '',
  semesters: [],
  seatRows: 7,
  seatCols: 5,
  students: [],
  roleSelectedNums: [],
  fixedRoles: [],
  variableRoles: [],
  distanced: [],
  bingoQuestions: [],
  classGrids: {},
  teacherGrids: {},
  scheduleRows: [],
}

function loadLocal(): LocalState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultLocal
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return defaultLocal
    return {
      semester: typeof parsed.semester === 'string' ? parsed.semester : undefined,
      seatDisabled: Array.isArray(parsed.seatDisabled) ? parsed.seatDisabled : [],
      seatFixed: typeof parsed.seatFixed === 'object' && parsed.seatFixed ? parsed.seatFixed : {},
      seatingResult: parsed.seatingResult ?? null,
      roleResult: parsed.roleResult ?? null,
    }
  } catch {
    return defaultLocal
  }
}

let local = loadLocal()
const listeners = new Set<() => void>()

function saveLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(local))
  } catch {
    // 저장 실패는 무시 — 화면 동작에는 지장이 없다
  }
}

/** 화면에서 바꿀 수 있는 것들. 나머지 설정은 시트에서만 수정한다 */
type Writable = Partial<Pick<AppData, 'seating' | 'seatingResult' | 'roleResult' | 'semester'>>

export function setData(partial: Writable) {
  const next: LocalState = { ...local }
  if (partial.seating) {
    next.seatDisabled = partial.seating.disabled ?? []
    next.seatFixed = partial.seating.fixed ?? {}
  }
  if ('seatingResult' in partial) next.seatingResult = partial.seatingResult ?? null
  if ('roleResult' in partial) next.roleResult = partial.roleResult ?? null
  if (partial.semester) next.semester = partial.semester
  local = next
  saveLocal()
  listeners.forEach(fn => fn())
}

export function resetLocal() {
  local = { ...defaultLocal }
  saveLocal()
  listeners.forEach(fn => fn())
}

function useLocal(): LocalState {
  const [, rerender] = useState(0)
  useEffect(() => {
    const fn = () => rerender(n => n + 1)
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  }, [])
  return local
}

function merge(config: SheetConfig, state: LocalState): AppData {
  const semester = state.semester && config.semesters.includes(state.semester)
    ? state.semester
    : config.defaultSemester

  return {
    students: config.students,
    fixedRoles: config.fixedRoles,
    variableRoles: config.variableRoles,
    roleSelectedNums: config.roleSelectedNums,
    seating: {
      rows: config.seatRows,
      cols: config.seatCols,
      distanced: config.distanced,
      disabled: state.seatDisabled,
      fixed: state.seatFixed,
    },
    bingoQuestions: config.bingoQuestions,
    scheduleRows: config.scheduleRows,
    classGrids: config.classGrids,
    teacherGrids: config.teacherGrids,
    semesters: config.semesters,
    seatingResult: state.seatingResult,
    roleResult: state.roleResult,
    grade: config.grade,
    classNum: config.classNum,
    semester,
  }
}

export function useAppData(): AppData {
  const { config } = useSheet()
  const state = useLocal()
  return merge(config ?? emptyConfig, state)
}

export function useSemester(): SemesterId {
  return useAppData().semester
}

export function setSemester(semester: SemesterId) {
  setData({ semester })
}

/**
 * 시트 도입 이전 버전이 남긴 데이터. 최초 설정 화면에서 시트로 옮기는 데만 쓴다.
 */
export function readLegacyData(): { students: Student[]; raw: string } | null {
  try {
    const raw = localStorage.getItem('homeroomkit')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const students = Array.isArray(parsed?.students) ? parsed.students as Student[] : []
    return { students, raw }
  } catch {
    return null
  }
}

export function clearLegacyData() {
  localStorage.removeItem('homeroomkit')
}
