import { days, grid, getSubjectColor } from '../data/timetable'
import TimetableGrid from './Timetable'

export default function ClassTimetable() {
  return <TimetableGrid badge="Class" title="우리반 시간표" days={days} grid={grid} getColor={getSubjectColor} />
}
