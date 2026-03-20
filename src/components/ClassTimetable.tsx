import { days, grid, subjectColors } from '../data/timetable'
import { CLASS_NAME } from '../data/defaults'
import TimetableGrid from './Timetable'

const getColor = (label: string) => subjectColors[label] ?? { bg: '#EFF1E8', bar: '#B0B8A0', fg: '#4A4A4A' }

export default function ClassTimetable() {
  return <TimetableGrid badge="Class" title={`${CLASS_NAME} 시간표`} days={days} grid={grid} getColor={getColor} />
}
