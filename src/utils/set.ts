export function toggleSet<T>(set: Set<T>, val: T): Set<T> {
  const next = new Set(set)
  next.has(val) ? next.delete(val) : next.add(val)
  return next
}
