import PageHeader from './PageHeader'

interface TimetableGridProps {
  badge: string
  title: string
  days: string[]
  grid: (string | null)[][]
  getColor: (label: string) => { bg: string; bar: string; fg: string }
}

export function TimetableContent({ days, grid, getColor }: Omit<TimetableGridProps, 'badge' | 'title'>) {
  const rows = grid.length
  return (
    <div className="grid gap-[3px]" style={{ flex: 1, gridTemplateColumns: '46px repeat(5, 1fr)', gridTemplateRows: `44px repeat(${rows}, 1fr)` }}>
      <div className="flex items-center justify-center rounded-lg bg-period-bg">
        <svg className="w-5 h-5 text-period-fg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
      {days.map(d => (
        <div key={d} className="flex items-center justify-center rounded-lg text-xl font-black tracking-widest bg-ink text-bg">{d}</div>
      ))}
      {grid.map((row, p) => (
        <div key={p} className="contents">
          <div className="flex items-center justify-center rounded-lg font-display text-2xl font-black bg-period-bg text-period-fg">{p + 1}</div>
          {row.map((label, d) => label ? (
            <Cell key={d} label={label} color={getColor(label)} />
          ) : (
            <div key={d} className="flex items-center justify-center rounded-lg bg-empty">
              <div className="w-1.5 h-1.5 rounded-full bg-border" />
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
      <PageHeader badge={badge} title={title} />
      <TimetableContent days={days} grid={grid} getColor={getColor} />
    </div>
  )
}

function Cell({ label, color }: { label: string; color: { bg: string; bar: string; fg: string } }) {
  return (
    <div className="relative flex items-center justify-center rounded-[10px] overflow-hidden hover:scale-[1.02] transition-transform" style={{ background: color.bg, color: color.fg }}>
      <div className="absolute left-0 top-[18%] bottom-[18%] w-[5px] rounded-r-sm" style={{ background: color.bar }} />
      <span className="text-[32px] font-black leading-none tracking-tight">{label}</span>
    </div>
  )
}
