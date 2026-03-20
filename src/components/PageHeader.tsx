export default function PageHeader({ badge, title, extra }: { badge: string; title: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-end mb-4 pb-3.5 border-b-[2.5px] border-ink">
      <div className="flex items-baseline gap-3.5">
        <span className="font-display text-[11px] font-bold tracking-[2.5px] uppercase text-bg bg-ink px-3 py-1 rounded relative -top-0.5">{badge}</span>
        <h1 className="text-[34px] font-black text-ink leading-none -tracking-[1px]">{title}</h1>
      </div>
      {extra && <div className="ml-auto">{extra}</div>}
    </div>
  )
}
