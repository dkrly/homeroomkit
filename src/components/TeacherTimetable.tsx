import { days, getClassColor } from '../data/teacher-timetable'
import { useAppData } from '../store'
import TimetableGrid from './Timetable'

export default function TeacherTimetable() {
  const { teacherGrids, semester } = useAppData()
  return <TimetableGrid badge="Info" title="정보 시간표" days={days} grid={teacherGrids[semester] ?? null} getColor={getClassColor} />
}
