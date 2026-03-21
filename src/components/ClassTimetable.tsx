import { days, grid, subjectColors } from '../data/timetable'
import TimetableGrid from './Timetable'

const getColor = (label: string) => subjectColors[label] ?? { bg: '#EFF1E8', bar: '#B0B8A0', fg: '#4A4A4A' }

export default function ClassTimetable() {
  return <TimetableGrid badge="Class" title="우리반 시간표" days={days} grid={grid} getColor={getColor} />
}
