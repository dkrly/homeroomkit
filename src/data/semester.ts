// 학기 id 는 시트의 '2026-1' 형식 문자열을 그대로 쓴다.
// 어떤 학기가 존재하는지는 시트의 반시간표 탭에서 결정되므로 코드에 목록을 두지 않는다.
export type SemesterId = string

export interface Semester {
  id: SemesterId
  year: number
  term: number
  /** 토글 버튼용 짧은 이름 */
  short: string
  /** 인쇄물용 전체 이름 */
  label: string
}

const PATTERN = /^(\d{4})-(\d)$/

export function parseSemester(id: SemesterId): Semester {
  const m = PATTERN.exec(id.trim())
  if (!m) return { id, year: 0, term: 0, short: id, label: id }
  const year = Number(m[1])
  const term = Number(m[2])
  return { id, year, term, short: `${term}학기`, label: `${year} ${term}학기` }
}

export function sortSemesters(ids: SemesterId[]): SemesterId[] {
  return [...ids].sort((a, b) => {
    const pa = parseSemester(a)
    const pb = parseSemester(b)
    return pa.year - pb.year || pa.term - pb.term || a.localeCompare(b)
  })
}
