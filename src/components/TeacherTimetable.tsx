import { days, grid, getClassColor } from '../data/teacher-timetable'
import TimetableGrid from './Timetable'

export default function TeacherTimetable() {
  return <TimetableGrid badge="Info" title="정보 시간표" days={days} grid={grid} getColor={getClassColor} />
}
