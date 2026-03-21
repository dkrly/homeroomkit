function getTimestamp() {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`
}

export default function PrintButton({ disabled, inline, title }: { disabled?: boolean; inline?: boolean; title?: string } = {}) {
  const handlePrint = () => {
    const origTitle = document.title
    if (title) document.title = `${title}_${getTimestamp()}`
    window.print()
    document.title = origTitle
  }

  const btn = (
    <button
      onClick={handlePrint}
      disabled={disabled}
      className={`flex items-center gap-1.5 border-none px-5 py-2.5 rounded-lg font-display text-[13px] font-semibold transition-all shadow-md print:hidden
        ${disabled ? 'bg-ink/20 text-ink/30 cursor-not-allowed' : 'bg-ink text-bg cursor-pointer hover:bg-[#2A3D2A] hover:-translate-y-0.5'}`}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"/>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
      </svg>
      인쇄
    </button>
  )

  if (inline) return btn
  return <div className="flex justify-end mb-3 print:hidden">{btn}</div>
}
