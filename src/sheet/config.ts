import type { Student, FixedRole, VariableRole, BingoQuestion, BingoDifficulty } from '../store'
import type { ScheduleRow } from '../data/schedule'
import { scheduleColors } from '../data/schedule'
import { sortSemesters, type SemesterId } from '../data/semester'

export type RawTabs = Record<string, string[][]>
export type Grid = (string | null)[][]

/** 앱이 읽는 탭 이름. Apps Script 의 TABS 와 같아야 한다 */
export const TAB_NAMES = ['학급', '학생', '역할', '거리두기', '친구탐험', '반시간표', '정보시간표', '일과표']

export interface SheetConfig {
  grade?: number
  classNum?: number
  defaultSemester: SemesterId
  semesters: SemesterId[]
  seatRows: number
  seatCols: number
  students: Student[]
  roleSelectedNums: number[]
  fixedRoles: FixedRole[]
  variableRoles: VariableRole[]
  distanced: [number, number][]
  bingoQuestions: BingoQuestion[]
  /** 학기별 반 시간표. 해당 학기 데이터가 없으면 키 자체가 없다 */
  classGrids: Record<SemesterId, Grid>
  teacherGrids: Record<SemesterId, Grid>
  scheduleRows: ScheduleRow[]
}

const DAY_COUNT = 5

// ── 셀 헬퍼 ───────────────────────────────────────────────────────────────

/** 헤더 행을 제외하고, 완전히 빈 행을 걸러낸 본문 */
function body(tab: string[][] | undefined): string[][] {
  if (!tab || tab.length < 2) return []
  return tab.slice(1).filter(row => row.some(c => (c ?? '').trim() !== ''))
}

function text(row: string[], col: number): string {
  return (row[col] ?? '').trim()
}

function num(row: string[], col: number): number | undefined {
  const v = text(row, col)
  if (!v) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

function isYes(v: string): boolean {
  const s = v.trim().toLowerCase()
  return s === 'y' || s === 'yes' || s === 'o' || s === 'true' || s === '1' || s === 'ㅇ'
}

// ── 탭별 파서 ─────────────────────────────────────────────────────────────

/** 학급 탭: 항목 | 값 형태의 key-value */
function parseSettings(tab: string[][] | undefined): Map<string, string> {
  const map = new Map<string, string>()
  for (const row of body(tab)) {
    const key = text(row, 0)
    if (key) map.set(key, text(row, 1))
  }
  return map
}

function parseStudents(tab: string[][] | undefined) {
  const students: Student[] = []
  const selected: number[] = []
  for (const row of body(tab)) {
    const n = num(row, 0)
    const name = text(row, 1)
    if (n === undefined || !name) continue
    students.push({ num: n, name })
    if (isYes(text(row, 2))) selected.push(n)
  }
  students.sort((a, b) => a.num - b.num)
  // 역할대상 열을 아무도 표시하지 않았으면 전원을 대상으로 본다
  return { students, roleSelectedNums: selected.length ? selected : students.map(s => s.num) }
}

function parseRoles(tab: string[][] | undefined) {
  const fixedRoles: FixedRole[] = []
  const variableRoles: VariableRole[] = []
  for (const row of body(tab)) {
    const kind = text(row, 0)
    const name = text(row, 1)
    if (!name) continue
    const description = text(row, 2)
    if (kind.startsWith('고정')) {
      fixedRoles.push({ name, description, studentNum: num(row, 3) })
    } else if (kind.startsWith('변동')) {
      variableRoles.push({ name, description })
    }
  }
  return { fixedRoles, variableRoles }
}

function parseDistanced(tab: string[][] | undefined): [number, number][] {
  const pairs: [number, number][] = []
  for (const row of body(tab)) {
    const a = num(row, 0)
    const b = num(row, 1)
    if (a === undefined || b === undefined || a === b) continue
    pairs.push(a < b ? [a, b] : [b, a])
  }
  return pairs
}

function parseBingo(tab: string[][] | undefined): BingoQuestion[] {
  const out: BingoQuestion[] = []
  for (const row of body(tab)) {
    const prompt = text(row, 1)
    if (!prompt) continue
    const raw = text(row, 2).toLowerCase()
    const difficulty: BingoDifficulty = raw === 'easy' || raw === 'hard' ? raw : 'medium'
    const q: BingoQuestion = { emoji: text(row, 0) || '❓', prompt, difficulty }
    if (isYes(text(row, 3))) q.required = true
    out.push(q)
  }
  return out
}

/** 시간표 탭: 학기 | 교시 | 월~금 */
function parseTimetable(tab: string[][] | undefined): Record<SemesterId, Grid> {
  const byPeriod = new Map<SemesterId, Map<number, (string | null)[]>>()

  for (const row of body(tab)) {
    const semester = text(row, 0)
    const period = num(row, 1)
    if (!semester || period === undefined || period < 1) continue
    const cells: (string | null)[] = []
    for (let d = 0; d < DAY_COUNT; d++) {
      const v = text(row, 2 + d)
      cells.push(v || null)
    }
    if (!byPeriod.has(semester)) byPeriod.set(semester, new Map())
    byPeriod.get(semester)!.set(period, cells)
  }

  const out: Record<SemesterId, Grid> = {}
  for (const [semester, periods] of byPeriod) {
    const maxPeriod = Math.max(...periods.keys())
    const grid: Grid = []
    for (let p = 1; p <= maxPeriod; p++) {
      grid.push(periods.get(p) ?? Array(DAY_COUNT).fill(null))
    }
    out[semester] = grid
  }
  return out
}

/** 일과표 탭: 이름 | 이모지 | 시간. 색상은 코드 팔레트를 순서대로 입힌다 */
function parseSchedule(tab: string[][] | undefined): ScheduleRow[] {
  const rows = body(tab)
  return rows.map((row, i) => {
    const label = text(row, 0)
    return {
      key: `${i}-${label}`,
      label,
      emoji: text(row, 1),
      time: text(row, 2),
      ...scheduleColors[i % scheduleColors.length],
    }
  }).filter(r => r.label)
}

// ── 전체 조립 ─────────────────────────────────────────────────────────────

export function parseTabs(tabs: RawTabs): SheetConfig {
  const settings = parseSettings(tabs['학급'])
  const { students, roleSelectedNums } = parseStudents(tabs['학생'])
  const { fixedRoles, variableRoles } = parseRoles(tabs['역할'])

  const classGrids = parseTimetable(tabs['반시간표'])
  const teacherGrids = parseTimetable(tabs['정보시간표'])

  const semesters = sortSemesters([...new Set([...Object.keys(classGrids), ...Object.keys(teacherGrids)])])
  const wanted = settings.get('기본학기') ?? ''
  const defaultSemester = semesters.includes(wanted)
    ? wanted
    : semesters[semesters.length - 1] ?? wanted

  const toInt = (key: string, fallback: number) => {
    const n = Number(settings.get(key))
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
  }
  const toOptInt = (key: string) => {
    const n = Number(settings.get(key))
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined
  }

  return {
    grade: toOptInt('학년'),
    classNum: toOptInt('반'),
    defaultSemester,
    semesters,
    seatRows: toInt('자리행', 7),
    seatCols: toInt('자리열', 5),
    students,
    roleSelectedNums,
    fixedRoles,
    variableRoles,
    distanced: parseDistanced(tabs['거리두기']),
    bingoQuestions: parseBingo(tabs['친구탐험']),
    classGrids,
    teacherGrids,
    scheduleRows: parseSchedule(tabs['일과표']),
  }
}
