import { scheduleRows } from '../data/schedule'
import PageHeader from './PageHeader'

export function ScheduleContent() {
  return (
    <div className="flex-1 flex flex-col gap-[3px]">
      {scheduleRows.map((row) => (
        <div
          key={row.key}
          className="flex-1 flex items-center rounded-xl relative overflow-hidden px-5"
          style={{ background: row.bg, color: row.fg }}
        >
          <div className="absolute left-0 top-[15%] bottom-[15%] w-[5px] rounded-r-sm" style={{ background: row.bar }} />
          <div className="text-4xl font-black whitespace-nowrap min-w-[220px]">
            {row.emoji} {row.label}
          </div>
          <div className="font-mono text-[46px] font-extrabold tracking-tight ml-auto text-right">
            {row.time}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Schedule() {
  return (
    <div className="page" id="schedule-page">
      <PageHeader badge="Daily" title="일과 운영표" />
      <ScheduleContent />
    </div>
  )
}
