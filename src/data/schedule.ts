export interface ScheduleRow {
  key: string
  label: string
  emoji: string
  time: string
  bg: string
  bar: string
  fg: string
}

export const scheduleRows: ScheduleRow[] = [
  { key: '등교', label: '학생 등교', emoji: '🎒', time: '08:00 ~ 08:30', bg: '#E4EDF2', bar: '#5E8FA6', fg: '#2B5F78' },
  { key: '조회', label: '학급 조회', emoji: '🎙️', time: '08:30 ~ 08:40', bg: '#E4E8F4', bar: '#6872B0', fg: '#333A72' },
  { key: '1',    label: '1 교시',    emoji: '🏫', time: '08:45 ~ 09:30', bg: '#FCF0E8', bar: '#C47A52', fg: '#8B4725' },
  { key: '2',    label: '2 교시',    emoji: '🏫', time: '09:40 ~ 10:25', bg: '#E8EEE4', bar: '#6B8F5E', fg: '#365229' },
  { key: '3',    label: '3 교시',    emoji: '🏫', time: '10:35 ~ 11:20', bg: '#E2EFEA', bar: '#4E9B7E', fg: '#1D6B4F' },
  { key: '4',    label: '4 교시',    emoji: '🏫', time: '11:30 ~ 12:15', bg: '#FBF2E0', bar: '#C9A24E', fg: '#7D6118' },
  { key: '점심', label: '점 심',     emoji: '🍴', time: '12:15 ~ 13:15', bg: '#F2E6EA', bar: '#B06E80', fg: '#7A3248' },
  { key: '5',    label: '5 교시',    emoji: '🏫', time: '13:20 ~ 14:05', bg: '#E0EDE8', bar: '#5AA08A', fg: '#1F705A' },
  { key: '6',    label: '6 교시',    emoji: '🏫', time: '14:15 ~ 15:00', bg: '#EBF2E4', bar: '#7FA86A', fg: '#3D6828' },
  { key: '7',    label: '7교시: 화, 목', emoji: '⏰', time: '15:10 ~ 15:55', bg: '#F4F0E0', bar: '#B5A452', fg: '#6E6218' },
  { key: '종례', label: '종례 및 청소', emoji: '🧹', time: '',             bg: '#EAE6EE', bar: '#8A7EA0', fg: '#4A3E60' },
]
