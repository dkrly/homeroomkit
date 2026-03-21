export type Cell = { value: string }
export type Row = (Cell | undefined)[]

export function cell(v: string | number | undefined): Cell {
  return { value: v != null ? String(v) : '' }
}

export function val(row: Row, col: number): string {
  return row[col]?.value?.trim() ?? ''
}

export function emptyRows(cols: number, count: number): Row[] {
  return Array.from({ length: count }, () => Array.from({ length: cols }, () => cell('')))
}
