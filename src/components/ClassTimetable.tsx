import { days, grids, getSubjectColor } from '../data/timetable'
import { useSemester } from '../store'
import TimetableGrid from './Timetable'

export default function ClassTimetable() {
  const semester = useSemester()
  return <TimetableGrid badge="Class" title="우리반 시간표" days={days} grid={grids[semester]} getColor={getSubjectColor} />
}
