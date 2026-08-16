import PageHeader from './PageHeader'
import SemesterToggle from './SemesterToggle'

interface TimetableGridProps {
  badge: string
  title: string
  days: string[]
  /** null = 해당 학기 시간표 미등록 */
  grid: (string | null)[][] | null
  getColor: (label: string) => { bg: string; bar: string; fg: string }
}

function EmptyState() {
  return (
    <div className="flex-1 grid place-items-center rounded-xl bg-empty">
      <div className="text-center">
        <div className="text-5xl mb-3 opacity-30">🗓️</div>
        <p className="text-lg font-bold text-ink/35">아직 등록된 시간표가 없습니다</p>
        <p className="text-sm text-ink/25 mt-1">다른 학기를 선택하거나 시간표가 나오면 등록해 주세요</p>
      </div>
    </div>
  )
}

export function TimetableContent({ days, grid, getColor }: Omit<TimetableGridProps, 'badge' | 'title'>) {
  if (!grid) return <EmptyState />
  const rows = grid.length
  return (
    <div className="grid gap-[3px]" style={{ flex: 1, gridTemplateColumns: '46px repeat(5, 1fr)', gridTemplateRows: `44px repeat(${rows}, 1fr)` }}>
      <div className="grid place-items-center rounded-lg bg-period-bg">
        <svg className="w-5 h-5 text-period-fg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      {days.map(d => (
        <div key={d} className="grid place-items-center rounded-lg text-xl font-black tracking-widest bg-ink text-bg">{d}</div>
      ))}
      {grid.map((row, p) => (
        <div key={p} className="contents">
          <div className="grid place-items-center rounded-lg font-display text-2xl font-black bg-period-bg text-period-fg">{p + 1}</div>
          {row.map((label, d) => label ? (
            <Cell key={d} label={label} color={getColor(label)} />
          ) : (
            <div key={d} className="grid place-items-center rounded-lg bg-empty">
              <div className="w-2 h-2 rounded-full bg-border" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function TimetableGrid({ badge, title, days, grid, getColor }: TimetableGridProps) {
  return (
    <div className="page">
      <PageHeader badge={badge} title={title} extra={<SemesterToggle />} />
      <TimetableContent days={days} grid={grid} getColor={getColor} />
    </div>
  )
}

// 긴 과목명(인공지능, 진로와직)이 칸을 넘지 않도록
function labelSize(label: string) {
  if (label.length >= 4) return 24
  if (label.length === 3) return 28
  return 32
}

function Cell({ label, color }: { label: string; color: { bg: string; bar: string; fg: string } }) {
  return (
    <div className="relative grid place-items-center rounded-[10px] overflow-hidden hover:scale-[1.02] transition-transform" style={{ background: color.bg, color: color.fg }}>
      <div className="absolute left-0 top-[18%] bottom-[18%] w-[5px] rounded-r-sm" style={{ background: color.bar }} />
      <span className="font-black leading-none tracking-tight" style={{ fontSize: labelSize(label) }}>{label}</span>
    </div>
  )
}
