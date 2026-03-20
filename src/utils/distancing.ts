import type { Student } from '../store'
import { shuffleArray } from './shuffle'

/**
 * 두 좌석 간 맨해튼 거리 계산
 */
function seatDistance(a: number, b: number, cols: number): number {
  const ar = Math.floor(a / cols), ac = a % cols
  const br = Math.floor(b / cols), bc = b % cols
  return Math.abs(ar - br) + Math.abs(ac - bc)
}

/**
 * 거리두기 쌍을 고려한 셔플 배정
 * - 최대 200회 시도하여 모든 거리두기 쌍이 최소 거리 이상 떨어지게 배정
 * - 실패 시 가장 좋은 결과 반환
 */
export function shuffleWithDistancing(
  students: Student[],
  activeIndices: number[],
  fixedResult: Map<number, Student>,
  distanced: [number, number][],
  cols: number,
): Map<number, Student> {
  if (distanced.length === 0) {
    // 거리두기 없으면 단순 셔플
    return simpleShuffle(students, activeIndices, fixedResult)
  }

  const fixedNums = new Set([...fixedResult.values()].map(s => s.num))
  const freeStudents = students.filter(s => !fixedNums.has(s.num))
  const freeSeats = activeIndices.filter(idx => !fixedResult.has(idx))

  // 최소 거리: 그리드 대각선의 절반 정도
  const minDist = Math.max(3, Math.floor(Math.sqrt(freeSeats.length) * 0.6))

  let bestResult: Map<number, Student> | null = null
  let bestScore = -1

  for (let attempt = 0; attempt < 200; attempt++) {
    const shuffled = shuffleArray([...freeStudents])
    const result = new Map(fixedResult)

    for (let i = 0; i < freeSeats.length && i < shuffled.length; i++) {
      result.set(freeSeats[i], shuffled[i])
    }

    // 점수 계산: 모든 거리두기 쌍의 최소 거리
    const score = calcDistanceScore(result, distanced, cols)

    if (score >= minDist * distanced.length) {
      return result // 충분히 떨어져 있으면 즉시 반환
    }

    if (score > bestScore) {
      bestScore = score
      bestResult = result
    }
  }

  return bestResult ?? simpleShuffle(students, activeIndices, fixedResult)
}

function simpleShuffle(
  students: Student[],
  activeIndices: number[],
  fixedResult: Map<number, Student>,
): Map<number, Student> {
  const fixedNums = new Set([...fixedResult.values()].map(s => s.num))
  const freeStudents = shuffleArray(students.filter(s => !fixedNums.has(s.num)))
  const result = new Map(fixedResult)

  let si = 0
  for (const idx of activeIndices) {
    if (result.has(idx)) continue
    if (si < freeStudents.length) result.set(idx, freeStudents[si++])
  }
  return result
}

function calcDistanceScore(
  assignment: Map<number, Student>,
  distanced: [number, number][],
  cols: number,
): number {
  // 번호 → 좌석 인덱스 매핑
  const numToSeat = new Map<number, number>()
  for (const [seat, student] of assignment) {
    numToSeat.set(student.num, seat)
  }

  let totalDist = 0
  for (const [numA, numB] of distanced) {
    const seatA = numToSeat.get(numA)
    const seatB = numToSeat.get(numB)
    if (seatA !== undefined && seatB !== undefined) {
      totalDist += seatDistance(seatA, seatB, cols)
    }
  }
  return totalDist
}
