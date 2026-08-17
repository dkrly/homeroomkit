export type SemesterId = '2026-1' | '2026-2'

export interface Semester {
  id: SemesterId
  year: number
  /** 토글 버튼에 쓰는 짧은 이름 */
  short: string
  /** 인쇄물에 쓰는 전체 이름 */
  label: string
}

export const semesters: Semester[] = [
  { id: '2026-1', year: 2026, short: '1학기', label: '2026 1학기' },
  { id: '2026-2', year: 2026, short: '2학기', label: '2026 2학기' },
]

// 저장된 값이 없을 때 처음 열리는 학기
export const DEFAULT_SEMESTER: SemesterId = '2026-2'

const byId = new Map(semesters.map(s => [s.id, s]))

export function isSemesterId(v: unknown): v is SemesterId {
  return typeof v === 'string' && byId.has(v as SemesterId)
}

export function getSemester(id: SemesterId): Semester {
  return byId.get(id) ?? semesters[0]
}
