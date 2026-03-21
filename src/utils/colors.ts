// 번호대별 색상 — 5명 단위, 30번 이상 마지막 색상 고정
const NUM_COLORS: { bg: string; bar: string; fg: string }[] = [
  { bg: '#FCF0E8', bar: '#C47A52', fg: '#8B4725' },
  { bg: '#E4E8F4', bar: '#6872B0', fg: '#333A72' },
  { bg: '#E2EFEA', bar: '#4E9B7E', fg: '#1D6B4F' },
  { bg: '#FBF2E0', bar: '#C9A24E', fg: '#7D6118' },
  { bg: '#F0E8F0', bar: '#9E7AA0', fg: '#664068' },
  { bg: '#E4EDF2', bar: '#5E8FA6', fg: '#2B5F78' },
]

const FALLBACK_COLOR = { bg: '#E4EDF2', bar: '#5E8FA6', fg: '#2B5F78' }

export function getStudentColor(num: number): { bg: string; bar: string; fg: string } {
  if (num <= 0) return FALLBACK_COLOR
  if (num >= 30) return NUM_COLORS[NUM_COLORS.length - 1]
  const group = Math.floor((num - 1) / 5)
  return NUM_COLORS[group] ?? FALLBACK_COLOR
}
