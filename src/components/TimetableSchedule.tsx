import { days, grid, getSubjectColor } from '../data/timetable'
import { TimetableContent } from './Timetable'
import { ScheduleContent } from './Schedule'
import PageHeader from './PageHeader'

// A4 content: 730×1063, A2 panel: ~1050×1503 → scale ≈ 1.41
const PANEL_ZOOM = 1.41

export default function TimetableSchedule() {
  return (
    <div className="page-a2">
      <div className="flex flex-1 min-h-0">
        {/* 왼쪽: 시간표 */}
        <div className="flex-1 flex flex-col min-w-0" style={{ zoom: PANEL_ZOOM }}>
          <PageHeader badge="Class" title="우리반 시간표" />
          <TimetableContent days={days} grid={grid} getColor={getSubjectColor} />
        </div>

        {/* 세로 구분선 */}
        <div className="flex flex-col items-center mx-6">
          <div className="w-[2.5px] flex-1 rounded-full bg-gradient-to-b from-border/20 via-ink/25 to-border/20" />
        </div>

        {/* 오른쪽: 일과표 */}
        <div className="flex-1 flex flex-col min-w-0" style={{ zoom: PANEL_ZOOM }}>
          <PageHeader badge="Daily" title="일과 운영표" />
          <ScheduleContent />
        </div>
      </div>
    </div>
  )
}
