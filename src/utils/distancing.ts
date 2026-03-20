import type { Student } from '../store'
import { shuffleArray } from './shuffle'

/**
 * 두 좌석이 인접한지 (8방향: 상하좌우 + 대각선)
 */
function isAdjacent(a: number, b: number, cols: number): boolean {
  const ar = Math.floor(a / cols), ac = a % cols
  const br = Math.floor(b / cols), bc = b % cols
  return Math.abs(ar - br) <= 1 && Math.abs(ac - bc) <= 1
}

/**
 * 거리두기 쌍 중 인접 위반 수 계산
 */
function countViolations(
  assignment: Map<number, Student>,
  distanced: [number, number][],
  cols: number,
): number {
  const numToSeat = new Map<number, number>()
  for (const [seat, student] of assignment) {
    numToSeat.set(student.num, seat)
  }

  let violations = 0
  for (const [numA, numB] of distanced) {
    const seatA = numToSeat.get(numA)
    const seatB = numToSeat.get(numB)
    if (seatA !== undefined && seatB !== undefined && isAdjacent(seatA, seatB, cols)) {
      violations++
    }
  }
  return violations
}

/**
 * 거리두기 쌍이 인접하지 않도록 셔플
 * - 최대 300회 시도하여 인접 위반 0인 결과 탐색
 * - 실패 시 위반 가장 적은 결과 반환
 */
export function shuffleWithDistancing(
  students: Student[],
  activeIndices: number[],
  fixedResult: Map<number, Student>,
  distanced: [number, number][],
  cols: number,
): Map<number, Student> {
  if (distanced.length === 0) {
    return simpleShuffle(students, activeIndices, fixedResult)
  }

  const fixedNums = new Set([...fixedResult.values()].map(s => s.num))
  const freeStudents = students.filter(s => !fixedNums.has(s.num))
  const freeSeats = activeIndices.filter(idx => !fixedResult.has(idx))

  let bestResult: Map<number, Student> | null = null
  let bestViolations = Infinity

  for (let attempt = 0; attempt < 300; attempt++) {
    const shuffled = shuffleArray([...freeStudents])
    const result = new Map(fixedResult)

    for (let i = 0; i < freeSeats.length && i < shuffled.length; i++) {
      result.set(freeSeats[i], shuffled[i])
    }

    const v = countViolations(result, distanced, cols)
    if (v === 0) return result

    if (v < bestViolations) {
      bestViolations = v
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
