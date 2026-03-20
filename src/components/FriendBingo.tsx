import { useState, useCallback } from 'react'
import { toPng } from 'html-to-image'
import PageHeader from './PageHeader'
import DownloadButton from './PrintButton'
import { useAppData } from '../store'
import type { BingoQuestion } from '../store'

interface BingoItem {
  emoji: string
  prompt: string
  required?: boolean
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const TOTAL = 12

function pick(questions: BingoQuestion[]): BingoItem[] {
  const required = questions.filter(q => q.required).map(q => ({ ...q, required: true }))
  const rest = shuffle(questions.filter(q => !q.required)).slice(0, TOTAL - required.length)
  return shuffle([...required, ...rest])
}

const COLS = 4
const ROWS = 3

function BingoSheet({ items }: { items: BingoItem[] }) {
  return (
    <div className="page">
      <PageHeader badge="MINGLE" title="친구 탐험" extra={
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-ink/50">이름</span>
          <div className="w-44 h-8 border-b-2 border-ink/20" />
        </div>
      } />

      <div className="mb-4 px-4 py-3 rounded-xl bg-period-bg/60 border border-border">
        <div className="flex flex-col gap-1 text-[13px] text-ink/70 leading-relaxed">
          <p><span className="font-black text-ink">규칙 1</span>&ensp;칸에 해당하는 친구를 찾아 이름을 적어요</p>
          <p><span className="font-black text-ink">규칙 2</span>&ensp;모두 다른 친구 이름! (단, ✗ 칸은 중복 가능)</p>
          <p><span className="font-black text-ink">규칙 3</span>&ensp;3명한테 물어봐도 없으면 <b>✗</b> + 물어본 친구 3명 이름</p>
        </div>
      </div>

      <div
        className="grid flex-1"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          gap: 0,
        }}
      >
        {items.slice(0, ROWS * COLS).map((item, i) => (
          <div key={i} className="border border-border flex flex-col">
            <div className="px-3 pt-3 pb-2 bg-period-bg/30">
              <div className="text-2xl mb-1">{item.emoji}</div>
              <p className="text-[13px] font-semibold text-ink leading-snug">{item.prompt}</p>
            </div>
            <div className="flex-1 flex items-end px-3 pb-3 pt-2">
              <div className="w-full border-b-2 border-dashed border-ink/15 pb-1">
                <span className="text-[10px] text-ink/20">이름</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-center">
        <p className="text-[11px] text-ink/30">빈 칸은 절대 안 돼요 — 이름이거나 ✗거나!</p>
      </div>
    </div>
  )
}

const BULK_COUNT = 50

export default function FriendBingo() {
  const { bingoQuestions } = useAppData()
  const [items, setItems] = useState<BingoItem[]>(() => pick(bingoQuestions))
  const [bulkSheets, setBulkSheets] = useState<BingoItem[][] | null>(null)

  const [bulkSaving, setBulkSaving] = useState(false)

  const handleBulkDownload = useCallback(async () => {
    const sheets = Array.from({ length: BULK_COUNT }, () => pick(bingoQuestions))
    setBulkSheets(sheets)
    setBulkSaving(true)

    // Wait for DOM to render
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

    try {
      const container = document.querySelector('[data-capture]') as HTMLElement | null
      if (!container) return
      const dataUrl = await toPng(container, {
        pixelRatio: 1,
        backgroundColor: '#F6F7F2',
      })
      const link = document.createElement('a')
      const now = new Date()
      const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
      link.download = `homeroomkit_bingo_${ts}.png`
      link.href = dataUrl
      link.click()
    } finally {
      setBulkSaving(false)
      setBulkSheets(null)
    }
  }, [bingoQuestions])

  if (bulkSheets) {
    return (
      <div data-capture>
        {bulkSheets.map((sheet, i) => (
          <BingoSheet key={i} items={sheet} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-end gap-2 mb-3 print:hidden">
        <button
          onClick={() => setItems(pick(bingoQuestions))}
          className="flex items-center gap-1.5 border-none px-5 py-2.5 rounded-lg font-display text-[13px] font-semibold transition-all shadow-md bg-ink text-bg cursor-pointer hover:bg-[#2A3D2A] hover:-translate-y-0.5"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/>
          </svg>
          섞기
        </button>
        <DownloadButton inline />
      </div>

      <div data-capture>
        <BingoSheet items={items} />
      </div>

      <div className="flex justify-center mt-6 print:hidden">
        <button
          onClick={handleBulkDownload}
          disabled={bulkSaving}
          className={`flex items-center gap-2 border-none px-6 py-3 rounded-lg font-display text-[13px] font-semibold transition-all shadow-md
            ${bulkSaving ? 'bg-ink/20 text-ink/30 cursor-not-allowed' : 'bg-ink text-bg cursor-pointer hover:bg-[#2A3D2A] hover:-translate-y-0.5'}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {bulkSaving ? '저장 중...' : `전부 다르게 ${BULK_COUNT}장 PNG 저장`}
        </button>
      </div>
    </div>
  )
}
