// 과목별 색상
export const subjectColors: Record<string, { bg: string; bar: string; fg: string }> = {
  국어: { bg: '#FCF0E8', bar: '#C47A52', fg: '#8B4725' },
  독서: { bg: '#F7EFE6', bar: '#B08A62', fg: '#6B4A26' },
  수학: { bg: '#E4E8F4', bar: '#6872B0', fg: '#333A72' },
  영어: { bg: '#E4EDF2', bar: '#5E8FA6', fg: '#2B5F78' },
  체육: { bg: '#FBF2E0', bar: '#C9A24E', fg: '#7D6118' },
  스포츠: { bg: '#F8EBE4', bar: '#C4785A', fg: '#7A3E22' },
  협종: { bg: '#F0EBE6', bar: '#A8907C', fg: '#5C4636' },
  사회: { bg: '#E2EFEA', bar: '#4E9B7E', fg: '#1D6B4F' },
  과학: { bg: '#E0EDE8', bar: '#5AA08A', fg: '#1F705A' },
  과학A: { bg: '#E0EDE8', bar: '#5AA08A', fg: '#1F705A' },
  과학B: { bg: '#E6F0E9', bar: '#6FA98D', fg: '#2C6B52' },
  도덕A: { bg: '#EBF2E4', bar: '#7FA86A', fg: '#3D6828' },
  도덕B: { bg: '#E4F0ED', bar: '#5BA88E', fg: '#266B50' },
  정보: { bg: '#E3EEEB', bar: '#5E9E8D', fg: '#236B5A' },
  인공지능: { bg: '#E3EEEB', bar: '#5E9E8D', fg: '#236B5A' },
  미술: { bg: '#F0E8F0', bar: '#9E7AA0', fg: '#664068' },
  음악: { bg: '#F2E6EA', bar: '#B06E80', fg: '#7A3248' },
  진탐: { bg: '#EDEAE4', bar: '#9B9480', fg: '#4A4434' },
  창특: { bg: '#EAE6EE', bar: '#8A7EA0', fg: '#4A3E60' },
  주선: { bg: '#F4F0E0', bar: '#B5A452', fg: '#6E6218' },
  가정: { bg: '#F5ECE2', bar: '#B88C5E', fg: '#6E4C24' },
  진로: { bg: '#EDF2E4', bar: '#8AAE6A', fg: '#426E28' },
  진로와직: { bg: '#EDF2E4', bar: '#8AAE6A', fg: '#426E28' },
}

export const days = ['월', '화', '수', '목', '금']

const DEFAULT_COLOR = { bg: '#EFF1E8', bar: '#B0B8A0', fg: '#4A4A4A' }

export function getSubjectColor(label: string) {
  return subjectColors[label] ?? DEFAULT_COLOR
}
