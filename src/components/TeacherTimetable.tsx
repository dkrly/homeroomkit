import { days, grids, getClassColor } from '../data/teacher-timetable'
import { useSemester } from '../store'
import TimetableGrid from './Timetable'

export default function TeacherTimetable() {
  const semester = useSemester()
  return <TimetableGrid badge="Info" title="정보 시간표" days={days} grid={grids[semester]} getColor={getClassColor} />
}
