export interface ScheduleRow {
  key: string
  label: string
  emoji: string
  time: string
  bg: string
  bar: string
  fg: string
}

/** 일과표 행에 순서대로 입히는 색상. 행 수가 더 많으면 처음부터 다시 순환한다 */
export const scheduleColors: { bg: string; bar: string; fg: string }[] = [
  { bg: '#E4EDF2', bar: '#5E8FA6', fg: '#2B5F78' },
  { bg: '#E4E8F4', bar: '#6872B0', fg: '#333A72' },
  { bg: '#FCF0E8', bar: '#C47A52', fg: '#8B4725' },
  { bg: '#E8EEE4', bar: '#6B8F5E', fg: '#365229' },
  { bg: '#E2EFEA', bar: '#4E9B7E', fg: '#1D6B4F' },
  { bg: '#FBF2E0', bar: '#C9A24E', fg: '#7D6118' },
  { bg: '#F2E6EA', bar: '#B06E80', fg: '#7A3248' },
  { bg: '#E0EDE8', bar: '#5AA08A', fg: '#1F705A' },
  { bg: '#EBF2E4', bar: '#7FA86A', fg: '#3D6828' },
  { bg: '#F4F0E0', bar: '#B5A452', fg: '#6E6218' },
  { bg: '#EAE6EE', bar: '#8A7EA0', fg: '#4A3E60' },
]
