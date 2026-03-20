export const days = ['월', '화', '수', '목', '금']

// null = 공강
export const grid: (string | null)[][] = [
  ['1-3',  null,  '1-7', '1-8', '1-2'],
  ['1-8',  '1-7', null,  '1-5', null ],
  [null,   '1-4', '1-4', null,  '1-5'],
  ['1-6',  null,  '1-1', null,  '1-1'],
  [null,   '1-9', null,  '1-6', null ],
  ['1-9',  null,  '1-2', null,  '1-3'],
  [null,   null,  null,  null,  null ],
]

// 반별 색상
const CLASS_COLORS: Record<string, { bg: string; bar: string; fg: string }> = {
  '1-1': { bg: '#FCF0E8', bar: '#C47A52', fg: '#8B4725' },
  '1-2': { bg: '#E4E8F4', bar: '#6872B0', fg: '#333A72' },
  '1-3': { bg: '#E4EDF2', bar: '#5E8FA6', fg: '#2B5F78' },
  '1-4': { bg: '#E2EFEA', bar: '#4E9B7E', fg: '#1D6B4F' },
  '1-5': { bg: '#F0E8F0', bar: '#9E7AA0', fg: '#664068' },
  '1-6': { bg: '#FBF2E0', bar: '#C9A24E', fg: '#7D6118' },
  '1-7': { bg: '#E0EDE8', bar: '#5AA08A', fg: '#1F705A' },
  '1-8': { bg: '#F2E6EA', bar: '#B06E80', fg: '#7A3248' },
  '1-9': { bg: '#EBF2E4', bar: '#7FA86A', fg: '#3D6828' },
}

export function getClassColor(cls: string) {
  return CLASS_COLORS[cls] ?? { bg: '#EFF1E8', bar: '#B0B8A0', fg: '#4A4A4A' }
}
