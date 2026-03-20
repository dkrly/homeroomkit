export function buildDisabled(studentCount: number, totalSeats: number): number[] {
  const d: number[] = []
  for (let i = studentCount; i < totalSeats; i++) d.push(i)
  return d
}
