import { days, getSubjectColor } from '../data/timetable'
import { useAppData } from '../store'
import TimetableGrid from './Timetable'

export default function ClassTimetable() {
  const { classGrids, semester } = useAppData()
  return <TimetableGrid badge="Class" title="우리반 시간표" days={days} grid={classGrids[semester] ?? null} getColor={getSubjectColor} />
}
